// this page fetches tickets and passes them into Admin/ManagerTickets views
import { redirect } from 'next/navigation';
import ManagerAdminTickets from '@/components/ManagerAdminTickets';
import { getCurrentSession } from '@/lib/rbac';
import clientPromise from '@/lib/mongodb';

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
  createdAt: string;
  assignedTo: string | 'N/A';
  attachments: unknown[];
  replies: TicketReply[];
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
function mapTicket(ticket: any): Ticket {
  return {
    _id: String(ticket?._id ?? ''),
    ticketid: String(ticket?.ticketid ?? ticket?.ticketId ?? ''),
    subject: String(ticket?.subject ?? ''),
    type: String(ticket?.type ?? ''),
    body: String(ticket?.body ?? ''),
    status: String(ticket?.status ?? ''),
    createdBy: String(ticket?.createdBy ?? ''),
    createdAt: ticket?.createdAt ? new Date(ticket.createdAt).toISOString() : '',
    assignedTo: ticket?.assignedTo
      ? String(ticket.assignedTo)
      : 'N/A',
    attachments: Array.isArray(ticket?.attachments) ? ticket.attachments : [],
    replies: Array.isArray(ticket?.replies) ? ticket.replies.map(mapReply) : [],
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
    query =
      identityValues.length > 0
        ? {
            $or: identityValues.map((value) => ({
              assignedTo: value,
            })),
          }
        : { assignedTo: null };
  }

  const tickets = await ticketsCollection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return tickets.map(mapTicket);
}

export default async function TicketsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/');
  }

  const safeSession = toSafeSession(session);
  const role = safeSession.role?.toLowerCase();
  const tickets = await getTicketsForRole(role, safeSession);

  // if they are a customer, they can't view it
  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="flex h-screen bg-background font-text text-foreground">
        <main className="ml-56 flex-1 overflow-y-auto p-8">
          <h1 className="mb-8 text-3xl font-bold">
            You are not authorized to view this page.
          </h1>
        </main>
      </div>
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