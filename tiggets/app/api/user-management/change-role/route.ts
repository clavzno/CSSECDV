import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getCurrentSession } from "@/lib/rbac";
import { createLog, LOG_EVENT_TYPES } from '@/lib/logger';

const ALLOWED_ROLES = new Set(["admin", "manager", "customer"]);

type ChangeRoleRequestBody = {
    userIds?: string[];
    role?: string;
};

export async function PATCH(request: Request) {
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

        const body = (await request.json()) as ChangeRoleRequestBody;
        const requestedRole = String(body.role || "").trim().toLowerCase();
        const userIds = Array.isArray(body.userIds) ? body.userIds : [];

        if (!ALLOWED_ROLES.has(requestedRole)) {
            return NextResponse.json(
                { error: "Invalid role." },
                { status: 400 }
            );
        }

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
                { error: "You cannot change your own role." },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("TicketingSystem");

        const affectedUsers = await db
            .collection("users")
            .find(
                { _id: { $in: filteredObjectIds } },
                { projection: { username: 1, role: 1 } }
            )
            .toArray();

        const result = await db.collection("users").updateMany(
            { _id: { $in: filteredObjectIds } },
            {
                $set: {
                    role: requestedRole,
                    updatedAt: new Date(),
                },
            }
        );

        const eventType = filteredObjectIds.length > 1
            ? LOG_EVENT_TYPES.BULK_ROLE_CHANGE
            : LOG_EVENT_TYPES.ROLE_CHANGE;

        const affectedUsersText = affectedUsers.length > 0
            ? affectedUsers
                .map((user) => {
                    const username = String(user.username || user._id);
                    const oldRole = String(user.role || "unknown");
                    return `${username} | ${oldRole} --> ${requestedRole}`;
                })
                .join("; ")
            : "No matching users found.";

        await createLog({
            userId: String(session.userId),
            actionType: eventType,
            eventType,
            priority: 'INFO',
            priorityLevel: 'INFO',
            status: 'SUCCESS',
            ticketStatus: 'N/A',
            details: `${String(session.userId)} changed role for ${affectedUsers.length} user(s): ${affectedUsersText}`,
        });
        return NextResponse.json({
            success: true,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            skippedSelf: validObjectIds.length - filteredObjectIds.length,
        });
    } catch (error) {
        console.error("Bulk role change failed:", error);

        return NextResponse.json(
            { error: "Failed to change user role(s)." },
            { status: 500 }
        );
    }
}