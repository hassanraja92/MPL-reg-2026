import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    let data: Record<string, string>;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      // multipart/form-data (file upload)
      const form = await req.formData();
      data = {};
      for (const [key, val] of form.entries()) {
        if (typeof val === "string") data[key] = val;
        // profile photo (file) is accepted but not stored yet
      }
    }

    const fullName = (data.full_name ?? "").trim();
    const mobileNumber = (data.mobile_number ?? "").trim();

    if (!fullName) return Response.json({ error: "Full name is required." }, { status: 400 });
    if (!mobileNumber) return Response.json({ error: "Mobile number is required." }, { status: 400 });

    // Check duplicate mobile
    const existing = await db.select({ id: players.id }).from(players).where(eq(players.mobileNumber, mobileNumber));
    if (existing.length > 0) {
      return Response.json({ error: "A player with this mobile number is already registered." }, { status: 409 });
    }

    const age = data.age ? parseInt(data.age, 10) : null;

    const [player] = await db
      .insert(players)
      .values({
        fullName,
        mobileNumber,
        email: data.email ?? "",
        dateOfBirth: data.date_of_birth ?? "",
        age: isNaN(age as number) ? null : age,
        gender: data.gender ?? "",
        address: data.address ?? "",
        district: data.district ?? "",
        state: data.state ?? "",
        playingRole: data.playing_role ?? "",
        battingStyle: data.batting_style ?? "",
        bowlingStyle: data.bowling_style ?? "",
        profilePhotoUrl: "",
        emergencyContactName: data.emergency_contact_name ?? "",
        emergencyContactNumber: data.emergency_contact_number ?? "",
        isApproved: false,
      })
      .returning();

    return Response.json({ success: true, id: player.id }, { status: 201 });
  } catch (err: unknown) {
    console.error("register error", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/register",
  method: ["POST"],
};
