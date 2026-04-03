// specific ticket page
// this is the server page which will fetch data
import TicketView from '@/components/TicketView';
import { getCurrentSession } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import clientPromise from '@/lib/mongodb';

type ViewTicketPageProps = {
    params: Promise<{
        ticketid: string;
    }>;
};

type TicketReplyView = {
    id: string;
    author: string;
    date: string;
    content: string;
    attachment: string | null;
    isEdited: boolean;
};

type TicketViewData = {
    id: string;
    subject: string;
    type: string;
    description: string;
    status: string;
    assignedTo: string;
    author: string;
    createdAt: string;
    attachment: string | null;
    replies: TicketReplyView[];
};

type SafeSession = {
    userId: string;
    username: string;
    role: string;
};

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSafeSession(session: any): SafeSession {
    return {
        userId: String(session?.userId ?? ''),
        username: String(session?.username ?? ''),
        role: String(session?.role ?? ''),
    };
}

function formatDate(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatStatus(value: unknown): string {
    const raw = String(value ?? '').trim().toUpperCase();

    switch (raw) {
        case 'OPEN':
            return 'Open';
        case 'PENDING':
            return 'Pending';
        case 'PROCESSING':
            return 'Processing';
        case 'RESOLVED':
            return 'Resolved';
        default:
            return String(value ?? 'Pending');
    }
}

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReply(reply: any): TicketReplyView {
    return {
        id: String(reply?.replyId ?? ''),
        author: String(reply?.senderId ?? ''),
        date: formatDate(reply?.timestamp),
        content: String(reply?.message ?? ''),
        attachment:
            Array.isArray(reply?.attachments) && reply.attachments.length > 0
                ? String(reply.attachments[0])
                : null,
        isEdited: false,
    };
}

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicketForView(ticket: any): TicketViewData {
    return {
        id: String(ticket?.ticketid ?? ticket?.ticketId ?? ''),
        subject: String(ticket?.subject ?? ''),
        type: String(ticket?.type ?? ''),
        description: String(ticket?.body ?? ''),
        status: formatStatus(ticket?.status),
        author: String(ticket?.createdBy ?? ''),
        createdAt: formatDate(ticket?.createdAt),
        assignedTo: String(
            ticket?.assignedManagerId ?? ticket?.assignedTo ?? 'unassigned'
        ),
        attachment:
            Array.isArray(ticket?.attachments) && ticket?.attachments.length > 0
                ? String(ticket.attachments[0])
                : null,
        replies: Array.isArray(ticket?.replies) ? ticket.replies.map(mapReply) : [],
    };
}

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUserLabels(db: any, ticketData: TicketViewData): Promise<TicketViewData> {
    const rawIds = [
        ticketData.author,
        ticketData.assignedTo !== 'unassigned' ? ticketData.assignedTo : '',
        ...ticketData.replies.map((reply) => reply.author),
    ]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

    if (rawIds.length === 0) {
        return ticketData;
    }

    const uniqueIds = [...new Set(rawIds)];

    const users = await db
        .collection('users')
        .find(
            {
                $or: [
                    { userId: { $in: uniqueIds } },
                    { username: { $in: uniqueIds } },
                ],
            },
            {
                projection: {
                    _id: 0,
                    username: 1,
                    userId: 1,
                },
            }
        )
        .toArray();

    const labelMap = new Map<string, string>();

    for (const user of users) {
        if (user?.userId) {
            labelMap.set(String(user.userId), String(user.username ?? user.userId));
        }
        if (user?.username) {
            labelMap.set(String(user.username), String(user.username));
        }
    }

    return {
        ...ticketData,
        author: labelMap.get(ticketData.author) ?? ticketData.author,
        assignedTo:
            ticketData.assignedTo === 'unassigned'
                ? 'unassigned'
                : labelMap.get(ticketData.assignedTo) ?? ticketData.assignedTo,
        replies: ticketData.replies.map((reply) => ({
            ...reply,
            author: labelMap.get(reply.author) ?? reply.author,
        })),
    };
}

export default async function ViewTicketPage({ params }: ViewTicketPageProps) {
    const session = await getCurrentSession();

    if (!session) {
        redirect('/');
    }

    const safeSession = toSafeSession(session);
    const role = safeSession.role.toLowerCase();
    const resolvedParams = await params;
    const currentTicketId = String(resolvedParams.ticketid ?? '').replace('#', '');

    if (role !== 'admin' && role !== 'manager') {
        redirect('/');
    }

    const client = await clientPromise;
    const db = client.db('TicketingSystem');

    const ticketIdQuery = {
        $or: [
            { ticketid: currentTicketId },
            { ticketid: `#${currentTicketId}` },
            { ticketId: currentTicketId },
            { ticketId: `#${currentTicketId}` },
        ],
    };

    const managerAccessQuery = {
        $or: [
            { assignedManagerId: safeSession.userId },
            { assignedManagerId: safeSession.username },
            { assignedTo: safeSession.userId },
            { assignedTo: safeSession.username },
        ],
    };

    const accessQuery =
        role === 'admin'
            ? ticketIdQuery
            : {
                $and: [ticketIdQuery, managerAccessQuery],
            };

    const ticket = await db.collection('tickets').findOne(accessQuery, {
        projection: {
            _id: 0,
        },
    });

    if (!ticket) {
        return (
            <main className="ml-56 min-h-screen bg-background p-6">
                <h1 className="mb-8 text-3xl font-bold">Not found.</h1>
            </main>
        );
    }

    const mappedTicket = mapTicketForView(ticket);
    const resolvedTicket = await resolveUserLabels(db, mappedTicket);

    return (
        <main className="ml-56 min-h-screen bg-background p-6">
            <TicketView
                ticketId={currentTicketId}
                role={safeSession.role}
                ticket={resolvedTicket}
                currentUserId={safeSession.userId}
            />
        </main>
    );
}