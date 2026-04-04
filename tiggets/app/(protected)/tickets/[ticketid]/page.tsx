// specific ticket page
// this is the server page which will fetch data
import TicketView from '@/components/TicketView';
import CustomerTicketView from '@/components/ViewTicket';
import { getCurrentSession } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // <-- NEW IMPORT REQUIRED

type ViewTicketPageProps = {
    params: Promise<{
        ticketid: string;
    }>;
};

type TicketReplyView = {
    id: string;
    author: string;
    authorId: string; // <-- ADD THIS
    date: string;
    content: string;
    attachment: string | null;
    isEdited: boolean;
    editDate?: string;
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
    rawUserId: unknown;
    username: string;
    role: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSafeSession(session: any): SafeSession {
    return {
        userId: String(session?.userId ?? ''),
        rawUserId: session?.userId ?? null,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReply(reply: any): TicketReplyView {
    return {
        id: String(reply?.replyId ?? ''),
        author: String(reply?.senderId ?? ''),
        authorId: String(reply?.senderId ?? ''), // <-- ADD THIS
        date: formatDate(reply?.timestamp),
        content: String(reply?.message ?? ''),
        attachment:
            Array.isArray(reply?.attachments) && reply.attachments.length > 0
                ? String(reply.attachments[0])
                : null,
        isEdited: !!reply?.editedAt, 
        editDate: reply?.editedAt ? formatDate(reply?.editedAt) : undefined,
    };
}

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
        assignedTo: String(ticket?.assignedTo ?? 'unassigned'),
        attachment:
            Array.isArray(ticket?.attachments) && ticket?.attachments.length > 0
                ? String(ticket.attachments[0])
                : null,
        replies: Array.isArray(ticket?.replies) ? ticket.replies.map(mapReply) : [],
    };
}

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
    
    // --- NEW: Convert valid 24-character strings into real MongoDB ObjectIds ---
    const objectIds = uniqueIds
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
        .map((id) => new ObjectId(id));

    const users = await db
        .collection('users')
        .find(
            {
                $or: [
                    { _id: { $in: objectIds } }, // Search by ObjectId
                    { userId: { $in: uniqueIds } },
                    { username: { $in: uniqueIds } },
                ],
            },
            {
                projection: {
                    _id: 1,
                    username: 1,
                    userId: 1,
                    role: 1, // Need role to apply [Customer Support] mask
                },
            }
        )
        .toArray();

    const labelMap = new Map<string, string>();
    const roleMap = new Map<string, string>();

    for (const user of users) {
        const idStr = String(user._id);
        const name = String(user.username ?? user.userId ?? idStr);
        const role = String(user.role ?? '').toLowerCase();

        labelMap.set(idStr, name);
        roleMap.set(idStr, role);

        if (user.userId) {
            labelMap.set(String(user.userId), name);
            roleMap.set(String(user.userId), role);
        }
        if (user.username) {
            labelMap.set(String(user.username), name);
            roleMap.set(String(user.username), role);
        }
    }

    // --- NEW: Mask formatting helper ---
    const formatName = (id: string) => {
        const resolvedName = labelMap.get(id) ?? id;
        const role = roleMap.get(id);
        // If they are staff, permanently mask their name in the UI
        if (role === 'manager' || role === 'admin') {
            return 'Customer Support';
        }
        // Otherwise, show their resolved username
        return resolvedName;
    };

    return {
        ...ticketData,
        author: formatName(ticketData.author),
        assignedTo: ticketData.assignedTo, // Keep raw ID here so frontend UI state logic still works
        replies: ticketData.replies.map((reply) => ({
            ...reply,
            author: formatName(reply.author),
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
            { assignedTo: safeSession.rawUserId },
            { assignedTo: safeSession.userId },
            { assignedTo: safeSession.username },
            { assignedTo: null },
            { assignedTo: 'N/A' },
            { assignedTo: 'unassigned' },
            { assignedTo: '' },
            { assignedTo: { $exists: false } },
        ],
    };

    const customerAccessQuery = {
        $or: [
            { createdBy: safeSession.rawUserId },
            { createdBy: safeSession.userId },
            { createdBy: safeSession.username },
        ],
    };

    let accessQuery;

    if (role === 'admin') {
        accessQuery = ticketIdQuery;
    } else if (role === 'manager') {
        accessQuery = {
            $and: [ticketIdQuery, managerAccessQuery],
        };
    } else if (role === 'customer') {
        accessQuery = {
            $and: [ticketIdQuery, customerAccessQuery],
        };
    } else {
        redirect('/');
    }

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

    if (role === 'customer') {
        return (
            <main className="ml-56 min-h-screen bg-background p-6">
                <CustomerTicketView
                    ticketId={currentTicketId}
                    ticket={resolvedTicket}
                    currentUserId={safeSession.userId}
                />
            </main>
        );
    }

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