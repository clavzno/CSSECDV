import AdminDashboard from '@/components/AdminDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';
import clientPromise from '@/lib/mongodb';

async function mapReply(reply) {
  return {
    replyId: String(reply?.replyId ?? ''),
    senderId: String(reply?.senderId ?? ''),
    message: String(reply?.message ?? ''),
    timestamp: reply?.timestamp
      ? new Date(reply.timestamp).toISOString()
      : '',
    attachments: Array.isArray(reply?.attachments) ? reply.attachments : [],
  };
}

async function mapTicket(ticket) {
  return {
    _id: String(ticket?._id ?? ''),
    ticketid: String(ticket?.ticketid ?? ticket?.ticketId ?? ''),
    subject: String(ticket?.subject ?? ''),
    type: String(ticket?.type ?? ''),
    body: String(ticket?.body ?? ''),
    status: String(ticket?.status ?? ''),
    createdBy: String(ticket?.createdBy ?? ''),
    createdAt: ticket?.createdAt
      ? new Date(ticket.createdAt).toISOString()
      : '',
    assignedManagerId: ticket?.assignedManagerId
      ? String(ticket.assignedManagerId)
      : 'N/A',
    lastAccessedAt: ticket?.lastAccessedAt ? new Date(ticket.lastAccessedAt).toISOString() : null,
    attachments: Array.isArray(ticket?.attachments) ? ticket.attachments : [],
    replies: Array.isArray(ticket?.replies)
      ? await Promise.all(ticket.replies.map(mapReply))
      : [],
  };
}

async function getTicketsForRole(role, session) {
  const client = await clientPromise;
  const db = client.db('TicketingSystem');
  const ticketsCollection = db.collection('tickets');

  const userIdRaw = session?.userId ?? null;
  const userId = userIdRaw ? String(userIdRaw) : null;
  const username = session?.username ? String(session.username) : null;

  let query = {};

  if (role === 'manager') {
    const assignedManagerMatches = [
      { assignedTo: null },
      { assignedTo: 'N/A' },
      { assignedTo: 'unassigned' },
      { assignedTo: '' },
      { assignedTo: { $exists: false } },
    ];

    if (userId) assignedManagerMatches.push({ assignedTo: userId });
    if (username) assignedManagerMatches.push({ assignedTo: username });

    query = { $or: assignedManagerMatches };
  } else if (role === 'customer') {
    const createdByMatches = [];

    if (userIdRaw) createdByMatches.push({ createdBy: userIdRaw });
    if (userId) createdByMatches.push({ createdBy: userId });
    if (username) createdByMatches.push({ createdBy: username });

    query =
      createdByMatches.length > 0
        ? { $or: createdByMatches }
        : { createdBy: null };
  }

  const tickets = await ticketsCollection
    .find(query)
    .sort({ lastAccessedAt: -1, createdAt: -1 })
    .toArray();

  return Promise.all(tickets.map(mapTicket));
}

// session is called in page.tsx for dashboard
export default async function Dashboard({ role, session }) {
  const normalizedRole = role?.toLowerCase();
  const tickets = await getTicketsForRole(normalizedRole, session);

  function renderContent() {
    switch (normalizedRole) {
      case 'admin':
        return <AdminDashboard role={normalizedRole} tickets={tickets} />;

      case 'manager':
        return <ManagerDashboard role={normalizedRole} tickets={tickets} />;

      case 'customer':
        return <CustomerDashboard role={normalizedRole} tickets={tickets} />;

      default:
        return <h1>Content unavailable; Please log in.</h1>;
    }
  }

  return (
    <div className="w-full font-text text-foreground">
      {renderContent()}
    </div>
  );
}