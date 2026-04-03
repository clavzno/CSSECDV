import Link from "next/link";

export default function TicketList({ tickets = [], role }) {
  const normalizedRole = role?.toLowerCase();
  const isManager = normalizedRole === "manager";
  const isAdmin = normalizedRole === "admin";
  const showAssignedTo = isManager || isAdmin;
  const showDetails = isManager || isAdmin;

    // N/A if it's not ticket-related
    function setTicketStatusColor(status) {
        // accept resolved, RESOLVED, ReSolved, etc.
        const normalizedStatus = status?.toUpperCase();

        switch (normalizedStatus) {
            case 'RESOLVED':
                return 'bg-green-200 text-green-800 border-green-300';
            case 'OPEN':
                return 'bg-red-200 text-red-800 border-red-300';
            case 'PROCESSING':
                return 'bg-teal-200 text-teal-800 border-teal-300';
            case 'PENDING':
                return 'bg-yellow-200 text-yellow-800 border-yellow-300';
            case 'N/A':
                return 'bg-gray-200 text-gray-800 border-gray-300';
            default:
                return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    }

  const displayTickets = tickets.map((ticket) => {
    const id = String(ticket.id ?? ticket.ticketid ?? ticket.ticketId ?? ticket._id ?? "");
    const username = String(ticket.username ?? ticket.createdBy ?? "");
    const assignedTo = String(ticket.assignedTo ?? ticket.assignedManagerId ?? "N/A");
    const lastUpdate = ticket.lastUpdate
      ? String(ticket.lastUpdate)
      : ticket.createdAt
        ? new Date(ticket.createdAt).toLocaleDateString()
        : "";

    return {
      ...ticket,
      id,
      username,
      assignedTo,
      lastUpdate,
      subject: String(ticket.subject ?? ""),
      type: String(ticket.type ?? ""),
      status: String(ticket.status ?? ""),
    };
  });

  return (
    <div className="overflow-hidden rounded-t-lg border border-border-gray shadow-sm">
      <table className="w-full border-collapse bg-background text-left text-sm">
        <thead>
          <tr className="border-b border-border-gray bg-div-gray">
            <th className="px-6 py-4 font-semibold">Ticket ID #</th>
            <th className="px-6 py-4 font-semibold">User ID #</th>
            <th className="px-6 py-4 font-semibold">Subject</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 text-center font-semibold">Status</th>
            <th className="px-6 py-4 text-center font-semibold">Last Update</th>
            {showAssignedTo && (
              <th className="px-6 py-4 text-center font-semibold">Assigned To</th>
            )}
            {showDetails && (
              <th className="px-6 py-4 text-center font-semibold">Details</th>
            )}
          </tr>
        </thead>

        <tbody>
          {displayTickets.length === 0 ? (
            <tr className="border-b border-border-gray bg-white">
              <td
                colSpan={showAssignedTo && showDetails ? 8 : showDetails || showAssignedTo ? 7 : 6}
                className="px-6 py-8 text-center text-zinc-500"
              >
                No tickets found.
              </td>
            </tr>
          ) : (
            displayTickets.map((ticket) => {
              const cleanId = ticket.id.replace(/^#/, "");
              const viewPath = `/tickets/${cleanId}`;

              return (
                <tr
                  key={ticket.id || ticket._id}
                  className="border-b border-border-gray bg-white transition-colors hover:bg-div-gray/30"
                >
                  <td className="px-6 py-4 font-medium text-zinc-800">
                    {ticket.id}
                  </td>

                  <td className="px-6 py-4 text-zinc-800">
                    {ticket.username}
                  </td>

                  <td className="max-w-37.5 truncate px-6 py-4 text-zinc-800">
                    {ticket.subject}
                  </td>

                  <td className="max-w-37.5 px-6 py-4 text-zinc-800">
                    {ticket.type}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium ${setTicketStatusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center text-gray-600">
                    {ticket.lastUpdate}
                  </td>

                  {showAssignedTo && (
                    <td className="px-6 py-4 text-center text-zinc-800">
                      {ticket.assignedTo}
                    </td>
                  )}

                  {showDetails && (
                    <td className="px-6 py-4 text-center">
                      <Link href={viewPath}>
                        <button className="cursor-pointer rounded bg-tiggets-lightgreen px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90">
                          View
                        </button>
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="border-t border-border-gray bg-div-gray py-6 text-center text-sm font-medium text-foreground" />
    </div>
  );
}