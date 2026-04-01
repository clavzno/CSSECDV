export default function ManagerDashboard() {
  // ticket manager mock data, will remove later when we have data na sa db

  
  const mockTickets = [
    { 
      id: '#0142067', 
      subject: 'Lorem ipsum dolor sit amet...', 
      type: 'Transferees: Credit transfer and accreditations',
      status: 'Resolved', 
      lastUpdate: 'August 8, 2020',
      badgeColor: 'bg-green-200 text-green-800 border-green-300' 
    },
    { 
      id: '#0142068', 
      subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, esse!Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde, esse!', 
      type: 'Course withdrawals or dropping procedures',
      status: 'Open', 
      lastUpdate: 'August 7, 2020',
      badgeColor: 'bg-red-200 text-red-800 border-red-300' 
    },
    { 
      id: '#0142069', 
      subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...', 
      type: 'Graduation requirements and clearance',
      status: 'Processing', 
      lastUpdate: 'August 6, 2020',
      badgeColor: 'bg-teal-200 text-teal-800 border-teal-300' 
    },
    { 
      id: '#0142070', 
      subject: 'Lorem ipsum dolor sit amet, consectetur adipiscing...', 
      type: 'Graduation requirements and clearance',
      status: 'Pending', 
      lastUpdate: 'August 5, 2020',
      badgeColor: 'bg-yellow-200 text-yellow-800 border-yellow-300' 
    },
  ];

  return (
    <div className="w-full font-text text-foreground">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

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
      <div className="rounded-t-lg overflow-hidden border border-border-gray shadow-sm">
        <table className="w-full text-left border-collapse bg-background text-sm">
          <thead>
            <tr className="bg-div-gray border-b border-border-gray">
              <th className="py-4 px-6 font-semibold">Ticket ID #</th>
              <th className="py-4 px-6 font-semibold">Subject</th>
              <th className="py-4 px-6 font-semibold">Type</th>
              <th className="py-4 px-6 font-semibold text-center">Status</th>
              <th className="py-4 px-6 font-semibold text-center">Last Update</th>
              <th className="py-4 px-6" /> 
            </tr>
          </thead>
          {/* last th is the Header for Edit button, moved this down here because of the Hydration Error */}
          <tbody>
            {mockTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-border-gray hover:bg-div-gray/30 transition-colors bg-white">
                <td className="py-4 px-6 font-medium">{ticket.id}</td>
                <td className="py-4 px-6 truncate max-w-37.5">{ticket.subject}</td>
                <td className="py-4 px-6 max-w-37.5">{ticket.type}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${ticket.badgeColor}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center whitespace-nowrap text-gray-600">
                    {ticket.lastUpdate}
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="bg-tiggets-lightgreen hover:opacity-90 text-white px-5 py-1.5 rounded text-xs font-semibold shadow-sm transition-all cursor-pointer">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Table Footer */}
        <div className="text-center py-6 text-sm font-medium bg-div-gray text-foreground border-t border-border-gray" />
      </div>
    </div>
  );
}