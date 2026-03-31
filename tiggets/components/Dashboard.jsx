import Sidebar from '@/components/Sidebar';

// TODO: change this later to just user_role
export default function Dashboard({ children, user_role="admin" }) {
    return (
        <div>
            <Sidebar role={user_role}/>
            <main className="ml-64 min-h-screen bg-background p-6">
                {children}
            </main>
        </div>
    );
}