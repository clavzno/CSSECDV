// this page fetches tickets and passes them into Admin/ManagerTickets views
import { redirect } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
// content
import ManagerAdminTickets from '@/components/ManagerAdminTickets';
import CreateTicket from '@/components/CreateTicket';
// rbac
import isAuthorized from '@/lib/rbac';
import { getCurrentSession } from '@/lib/rbac';
import { resolveUsernameFromUserId } from '@/lib/resolveUsernameFromUserId';

type TicketReply = {
  replyId: string;
  senderId: string;
  message: string;
  timestamp: string;
  attachments: unknown[];
};

type Ticket = {
  _id: string;
  ticketid: string;
  subject: string;
  type: string;
  body: string;
  status: string;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  assignedTo: string | 'N/A';
  assignedToUsername: string;
  attachments: unknown[];
  replies: TicketReply[];
  editedAt: string | null;
  editedBy: string | null;
  lastAccessedAt: string | null;
};

type SafeSession = {
  userId: string;
  username: string;
  role: string;
};

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReply(reply: any): TicketReply {
  return {
    replyId: String(reply?.replyId ?? ''),
    senderId: String(reply?.senderId ?? ''),
    message: String(reply?.message ?? ''),
    timestamp: reply?.timestamp ? new Date(reply.timestamp).toISOString() : '',
    attachments: Array.isArray(reply?.attachments) ? reply.attachments : [],
  };
}

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mapTicket(ticket: any, db: any): Promise<Ticket> {
  const createdByRaw = ticket?.createdBy ? String(ticket.createdBy) : '';
  const assignedToRaw = ticket?.assignedTo ? String(ticket.assignedTo) : '';

  const createdByUsername = await resolveUsernameFromUserId(db, createdByRaw);
  const assignedToUsername = assignedToRaw
    ? await resolveUsernameFromUserId(db, assignedToRaw)
    : 'N/A';

  return {
    _id: String(ticket?._id ?? ''),
    ticketid: String(ticket?.ticketid ?? ticket?.ticketId ?? ''),
    subject: String(ticket?.subject ?? ''),
    type: String(ticket?.type ?? ''),
    body: String(ticket?.body ?? ''),
    status: String(ticket?.status ?? ''),
    createdBy: createdByRaw,
    createdByUsername,
    createdAt: ticket?.createdAt ? new Date(ticket.createdAt).toISOString() : '',
    assignedTo: assignedToRaw || 'N/A',
    assignedToUsername,
    attachments: Array.isArray(ticket?.attachments) ? ticket.attachments : [],
    replies: Array.isArray(ticket?.replies) ? ticket.replies.map(mapReply) : [],
    editedAt: ticket?.editedAt ? new Date(ticket.editedAt).toISOString() : null,
    editedBy: ticket?.editedBy ? String(ticket.editedBy) : null,
    lastAccessedAt: ticket?.lastAccessedAt
      ? new Date(ticket.lastAccessedAt).toISOString()
      : null,
  };
}

// do not remove this next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSafeSession(session: any): SafeSession {
  return {
    userId: String(session?.userId ?? ''),
    username: String(session?.username ?? ''),
    role: String(session?.role ?? ''),
  };
}

async function getTicketsForRole(
  role: string | undefined,
  session: SafeSession
): Promise<Ticket[]> {
  const client = await clientPromise;
  const db = client.db('TicketingSystem');
  const ticketsCollection = db.collection('tickets');

  const identityValues = [
    session?.userId && String(session.userId),
    session?.username && String(session.username),
  ].filter(Boolean);

  let query = {};

  if (role === 'manager') {
    query = {
      $or: [
        ...identityValues.map((value) => ({ assignedTo: value })),
        { assignedTo: null },
        { assignedTo: 'N/A' },
        { assignedTo: 'unassigned' },
        { assignedTo: '' },
        { assignedTo: { $exists: false } },
      ],
    };
  }

  const tickets = await ticketsCollection
    .find(query)
    .sort({ lastAccessedAt: -1, createdAt: -1 })
    .toArray();

  return Promise.all(tickets.map((ticket) => mapTicket(ticket, db)));
}

export default async function TicketsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const safeSession = toSafeSession(session);
  const role = safeSession.role?.toLowerCase();

  if (role === 'customer') {
    return (
      <div className="flex h-screen bg-background font-text text-foreground">
        <main className="ml-56 flex-1 overflow-y-auto p-8">
          <CreateTicket />
        </main>
      </div>
    );
  }

  const tickets = await getTicketsForRole(role, safeSession);

  const currentPath = '/tickets';
  if (!isAuthorized(session.role.toLowerCase(), currentPath)) {
    return (
      <main className="ml-56 min-h-screen bg-background p-6">
        <h1 className="mb-8 text-3xl font-bold">
          You are not authorized to view this page.
        </h1>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-background font-text text-foreground">
      <main className="ml-56 flex-1 overflow-y-auto p-8">
        <ManagerAdminTickets
          role={role}
          session={safeSession}
          tickets={tickets}
        />
      </main>
    </div>
  );
}