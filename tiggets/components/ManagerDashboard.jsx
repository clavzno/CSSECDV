import TicketList from '@/components/TicketList';

export default function ManagerDashboard({ role, tickets }) {
  // TODO: call a security function here that checks the role
  if (role?.toLowerCase() != "manager") {
    return null;
  }

  return (
    <div className="w-full font-text text-foreground">
      <div className="w-full mb-8">
        {/* Header */}
        <h1 className="text-3xl font-bold w-full">Dashboard</h1>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-50 border border-border-gray flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Ticket type metrics</h2>
          <div className="w-full flex-1 bg-div-gray rounded flex items-center justify-center text-sm opacity-60">
            Chart Area
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-50 border border-border-gray flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Recently Opened</h2>
          <div className="w-full flex-1 bg-div-gray rounded flex items-center justify-center text-sm opacity-60">
            Recent List Area
          </div>
        </div>
      </div>

      {/* Ticket Table */}
      <TicketList role={role} tickets={tickets} />
    </div>
  );
}