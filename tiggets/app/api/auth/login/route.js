import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { verifyPassword } from '@/lib/crypto';
import { createLog } from '@/lib/logger';
import crypto from 'crypto';
import {
    verifyUserMfa,
    isManagerMfaStillValid,
    markManagerMfaVerified,
    MANAGER_MFA_HOURS,
} from '@/lib/mfa';

export async function POST(request) {
    try {
        const { username, password, mfaCode, backupCode } = await request.json();
        const genericAuthError = 'Invalid username and/or password'; 
        const deviceId = String(request.headers.get('x-device-id') || '').trim();

        const client = await clientPromise;
        const db = client.db('TicketingSystem');
        const usersCollection = db.collection('users');

        // 1. Find the user
        const user = await usersCollection.findOne({ username });

        // --- FAILURE PATH: User not found or missing passwordHash ---
        if (!user || !user.passwordHash) {
            await createLog({
                userId: username || 'Unknown',
                actionType: 'LOGIN_FAIL',
                details: `${username || 'Unknown'} failed to log in to account ${username || 'Unknown'}. Reason: Unknown username or missing credentials.`,
                priorityLevel: 'warning'
            });
            return NextResponse.json({ error: genericAuthError }, { status: 401 });
        }

        // 2. Check Account Lockout
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            await createLog({
                userId: username,
                actionType: 'LOGIN_FAIL',
                details: `${username} failed to log in to account ${username}. Reason: Attempted login on locked account.`,
                priorityLevel: 'error'
            });
            return NextResponse.json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' }, { status: 401 });
        }

        // guard
        if (!user || !user.passwordHash || typeof user.passwordHash !== 'string' || !user.passwordHash.includes(':')) {
            return NextResponse.json(
                { error: 'Invalid username/email or password.' },
                { status: 401 }
            );
        }

        // 3. Verify the password (Using the correct 'passwordHash' field)
        const isValid = verifyPassword(password, user.passwordHash);

        if (!isValid) {
            const attempts = (user.failedLoginAttempts || 0) + 1;
            let updates = {
                failedLoginAttempts: attempts,
                lastLoginAttempt: { date: new Date(), status: 'Unsuccessful' }
            };

            let priority = 'warning';
            let reason = 'Invalid password';

            // Lock account if 5 failed attempts are reached
            if (attempts >= 5) {
                updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
                priority = 'error';
                reason = 'Account locked out (5 failed attempts)';
            }

            // Elevate to Critical if an Admin account is being brute-forced
            if (user.role === 'admin' && attempts > 3) {
                priority = 'critical';
            }

            await usersCollection.updateOne({ _id: user._id }, { $set: updates });

            await createLog({
                userId: username,
                actionType: 'LOGIN_FAIL',
                details: `${username} failed to log in to account ${username}. Reason: ${reason}.`,
                priorityLevel: priority
            });

            return NextResponse.json({ error: genericAuthError }, { status: 401 });
        }

        // --- SUCCESS PATH (legacy accounts without MFA yet) ---
        const hadRecentFails = user.failedLoginAttempts > 0;
        const lastLoginMsg = user.lastLoginAttempt
            ? `Your last login attempt was ${user.lastLoginAttempt.status} on ${new Date(user.lastLoginAttempt.date).toLocaleString()}`
            : 'Welcome! This is your first time logging in.';

        const role = String(user.role || '').toLowerCase();
        const isAdmin = role === 'admin';
        const isManager = role === 'manager';
        const managerMfaValid = isManager && isManagerMfaStillValid(user, deviceId);
        const requiresLoginMfa = isAdmin || (isManager && !managerMfaValid);

        if ((isAdmin || isManager) && !user.mfaEnabled) {
            return NextResponse.json({
                error: 'MFA must be enabled for this role before login is allowed.',
            }, { status: 403 });
        }

        if (requiresLoginMfa) {
            const mfaResult = await verifyUserMfa({ db, user, mfaCode, backupCode });

            if (!mfaResult.ok) {
                return NextResponse.json({
                    error: mfaResult.error,
                    mfaRequired: true,
                    challenge: 'login',
                }, { status: 401 });
            }

            if (isManager && deviceId) {
                await markManagerMfaVerified(db, user._id, deviceId);
            }
        }

        const cookieStore = await cookies();

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    lastLoginAttempt: { date: new Date(), status: 'Successful' }
                }
            }
        );

        const sessionId = crypto.randomBytes(32).toString('hex');
        const sessionHours = isManager ? MANAGER_MFA_HOURS : 24;
        const expiresAt = new Date(Date.now() + sessionHours * 60 * 60 * 1000);

        await db.collection('sessions').insertOne({
            sessionId,
            userId: user._id,
            role: user.role,
            createdAt: new Date(),
            expiresAt
        });

        cookieStore.set('session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: expiresAt,
        });

        await createLog({
            userId: user.username,
            actionType: 'LOGIN_SUCCESS',
            details: `${user.username} logged in successfully at ${new Date().toISOString()} and was redirected to the dashboard.`,
            priorityLevel: hadRecentFails ? 'warning' : 'info'
        });

        return NextResponse.json({
            message: 'Login successful',
            lastLoginMessage: lastLoginMsg,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}