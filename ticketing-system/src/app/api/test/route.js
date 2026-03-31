import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    // 1. Await the connection function
    await dbConnect();

    // 2. Return a successful JSON response
    return NextResponse.json(
      { message: "Successfully connected to MongoDB Atlas via Next.js!" },
      { status: 200 }
    );
  } catch (error) {
    // 3. Return a secure, generic error message if it fails
    return NextResponse.json(
      { error: "Database connection failed." },
      { status: 500 }
    );
  }
}