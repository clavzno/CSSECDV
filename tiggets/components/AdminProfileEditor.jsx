"use client";

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';

export default function AdminProfileEditor({
    firstName,
    lastName,
    username,
    email,
    role,
}) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Profile Information</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Only admins can edit their own profile information here.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    aria-label={isEditing ? 'Cancel editing profile' : 'Edit profile'}
                    title={isEditing ? 'Cancel' : 'Edit profile'}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                >
                    {isEditing ? <X size={18} /> : <Pencil size={18} />}
                </button>
            </div>

            {isEditing ? (
                <form action="/api/settings/update-profile" method="POST" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="firstName" className="text-sm font-medium text-zinc-500">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                defaultValue={firstName}
                                maxLength={100}
                                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="text-sm font-medium text-zinc-500">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                defaultValue={lastName}
                                maxLength={100}
                                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-zinc-500">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            defaultValue={username}
                            maxLength={50}
                            required
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-zinc-500">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={email}
                            maxLength={254}
                            required
                            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                        />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-zinc-500">Role</p>
                        <div className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {role}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                        >
                            Save Profile Changes
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm font-medium text-zinc-500">First Name</p>
                        <p className="mt-1 text-base text-zinc-900">{firstName || 'N/A'}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-zinc-500">Last Name</p>
                        <p className="mt-1 text-base text-zinc-900">{lastName || 'N/A'}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-zinc-500">Username</p>
                        <p className="mt-1 text-base font-medium text-zinc-900">{username}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-zinc-500">Email Address</p>
                        <p className="mt-1 text-base text-zinc-900">{email}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-zinc-500">Role</p>
                        <div className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {role}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}