import Sidebar from '@/components/Sidebar';
import AdminDashboard from '@/components/AdminDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';

export default function Dashboard({ role }) {
    function renderContent() {
        switch (role) {
            case "admin":
                return <AdminDashboard />;
            case "manager":
                return <ManagerDashboard />;
            case "customer":
                return <CustomerDashboard />;
            default:
                return <h1>Content unavailable; Please log in.</h1>;
        }
    }

    return (
        <div>
            <Sidebar role={role} />
            <main className="ml-64 min-h-screen bg-background p-6">
                {renderContent()}
            </main>
        </div>
    );
}