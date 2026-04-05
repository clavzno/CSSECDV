import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getCurrentSession } from "@/lib/rbac";
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';
import { verifyUserMfa } from '@/lib/mfa';

type DeleteUsersRequestBody = {
    userIds?: string[];
    mfaCode?: string;
    backupCode?: string;
};

export async function DELETE(request: Request) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        if (String(session.role || "").toLowerCase() !== "admin") {
            return NextResponse.json(
                { error: "Forbidden." },
                { status: 403 }
            );
        }

        const body = (await request.json()) as DeleteUsersRequestBody;
        const userIds = Array.isArray(body.userIds) ? body.userIds : [];

        const validObjectIds = userIds
            .map((id) => String(id || "").trim())
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        if (validObjectIds.length === 0) {
            return NextResponse.json(
                { error: "No valid user IDs were provided." },
                { status: 400 }
            );
        }

        const currentUserId = String(session.userId || "").trim();

        const filteredObjectIds = validObjectIds.filter(
            (objectId) => objectId.toString() !== currentUserId
        );

        if (filteredObjectIds.length === 0) {
            return NextResponse.json(
                { error: "You cannot delete your own account." },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("TicketingSystem");

        const actingUser = await db.collection('users').findOne({ _id: new ObjectId(String(session.userId)) });
        if (!actingUser) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        const mfaResult = await verifyUserMfa({
            db,
            user: actingUser,
            mfaCode: body.mfaCode,
            backupCode: body.backupCode,
        });

        if (!mfaResult.ok) {
            return NextResponse.json({ error: mfaResult.error, mfaRequired: true }, { status: 401 });
        }

        const affectedUsers = await db
            .collection("users")
            .find(
                { _id: { $in: filteredObjectIds } },
                { projection: { username: 1, role: 1 } }
            )
            .toArray();

        const result = await db.collection("users").deleteMany({
            _id: { $in: filteredObjectIds },
        });

        const eventType = filteredObjectIds.length > 1
            ? LOG_EVENT_TYPES.BULK_USER_DELETION
            : LOG_EVENT_TYPES.USER_DELETION;

        const affectedUsersText = affectedUsers.length > 0
            ? affectedUsers
                .map((user) => {
                    const username = String(user.username || user._id);
                    const oldRole = String(user.role || "unknown");
                    return `${username} | ${oldRole}`;
                })
                .join("; ")
            : "No matching users found.";

        await createLog({
            userId: String(session.userId),
            actionType: eventType,
            eventType,
            priority: 'HIGH',
            priorityLevel: 'HIGH',
            status: 'SUCCESS',
            ticketStatus: 'N/A',
            details: `${String(session.userId)} deleted ${affectedUsers.length} user(s): ${affectedUsersText}`,
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            skippedSelf: validObjectIds.length - filteredObjectIds.length,
        });
    } catch (error) {
        console.error("Bulk delete failed:", error);

        return NextResponse.json(
            { error: "Failed to delete user(s)." },
            { status: 500 }
        );
    }
}