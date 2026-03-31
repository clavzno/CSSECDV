// redirects
import { redirect } from 'next/navigation';

// content
import Dashboard from '@/components/Dashboard';

// placeholder, should call some mongodb shit
async function getCurrentUser() {
  return {
    username: 'admin',
    role: 'admin',
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return (<Dashboard />);
}