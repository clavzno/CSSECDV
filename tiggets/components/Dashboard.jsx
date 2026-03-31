
import Sidebar from '@/components/Sidebar';

// TODO: implement the different dashboard shit
import AdminDashboard from '@/components/AdminDashboard';
import ManagerDashboard from '@/components/ManagerDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';

// TODO: change this later to just {children, user_role}
export default function Dashboard({ user_role = "customer" }) {
    function renderContent() {
        switch (user_role) {
            case "admin":
                return <AdminDashboard />;
            case "manager":
                return <ManagerDashboard />;
            case "customer":
                return <CustomerDashboard />;
            default:
                return <h1>Content unvailable; Please log in.</h1>;
        }
    }

    return (
        <div>
            <Sidebar role={user_role} />
            <main className="ml-64 min-h-screen bg-background p-6">
                {/* children */}
                {renderContent()}
            </main>
        </div>
    );
}