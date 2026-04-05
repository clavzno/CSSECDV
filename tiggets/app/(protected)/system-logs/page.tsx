import { redirect } from "next/navigation";
// session and log fetching
import { getCurrentSession } from "@/lib/rbac";
import clientPromise from '@/lib/mongodb';
// content
import SystemLogs from "@/components/SystemLogs";
// rbac 
import isAuthorized from '@/lib/rbac';
import { resolveUsernameFromUserId } from '@/lib/resolveUsernameFromUserId';

export default async function SystemLogsPage() {
  async function getSystemLogs() {
    try {
      const client = await clientPromise;
      const db = client.db("TicketingSystem");

      const rawLogs = await db
        .collection("logs")
        .find({})
        .sort({ timestamp: -1 })
        .toArray();

      const logs = await Promise.all(
        rawLogs.map(async (log) => {
          const userId = String(log.userId ?? '');
          const username = userId
            ? await resolveUsernameFromUserId(db, userId)
            : 'N/A';

          return {
            logId: String(log.logId ?? ''),
            timestamp:
              log.timestamp instanceof Date
                ? log.timestamp.toISOString()
                : String(log.timestamp ?? ''),
            userId,
            username,
            actionType: String(log.actionType ?? log.eventType ?? ''),
            ticketStatus: (() => {
              const status = String(log.ticketStatus ?? log.status ?? '').toUpperCase();
              return status === 'NA' ? 'N/A' : status;
            })(),
            details: String(log.details ?? ''),
            priorityLevel: String(log.priorityLevel ?? log.priority ?? ''),
          };
        })
      );

      return logs;
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
      return [];
    }
  }

  const rawSession = await getCurrentSession();

  if (!rawSession) {
    redirect("/");
  }

  const session = {
    userId: String(rawSession.userId ?? ''),
    role: String(rawSession.role ?? ''),
  };

  if (session.role?.toLowerCase() !== "admin") {
    return null;
  }

  const logs = await getSystemLogs();

  const currentPath = '/system-logs';
  if (!isAuthorized(session.role.toLowerCase(), currentPath)) {
    return (
      <main className="ml-56 min-h-screen bg-background p-6">
        <h1 className="mb-8 text-3xl font-bold">
          You are not authorized to view this page.
        </h1>
      </main>
    );
  }

  return (
    <main className="ml-56 flex-1 min-w-0 overflow-y-auto p-8">
      <SystemLogs session={session} logs={logs} />
    </main>
  );
}