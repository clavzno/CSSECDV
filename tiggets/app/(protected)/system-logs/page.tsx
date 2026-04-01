import { redirect } from "next/navigation";
// session and log fetching
import { getCurrentSession } from "@/lib/rbac";
import clientPromise from '@/lib/mongodb';
// content
import SystemLogs from "@/components/SystemLogs";

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

      // convert to plain logs
      const logs = rawLogs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
        timestamp:
          log.timestamp instanceof Date
            ? log.timestamp.toISOString()
            : String(log.timestamp),
      }));

      return logs;
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
      return [];
    }
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect("/");
  }

  if (session.role?.toLowerCase() !== "admin") {
    return null;
  }

  const logs = await getSystemLogs();

  return (
    <main className="ml-56 flex-1 p-8 overflow-y-auto">
      <SystemLogs session={session} logs={logs} />
    </main>
  );
}
