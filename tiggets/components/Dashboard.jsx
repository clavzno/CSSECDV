import AdminDashboard from '@/components/AdminDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';

// session is called in page.tsx for dashboard
export default function Dashboard({ role }) {
    function renderContent() {
        switch (role) {
            case "admin":
                return <AdminDashboard role={role}/>;
            case "manager":
                return <ManagerDashboard role={role}/>;
            case "customer":
                return <CustomerDashboard role={role}/>;
            default:
                return <h1>Content unavailable; Please log in.</h1>;
        }
    }

    return (
        <div>
            <main className="ml-64 min-h-screen bg-background p-6">
                {renderContent()}
            </main>
        </div>
    );
}