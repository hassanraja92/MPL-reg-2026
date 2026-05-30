import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { getAuthUser } from "./lib/auth.js";

export default async (req: Request, context: Context): Promise<Response> => {
  const secret = Netlify.env.get("JWT_SECRET") ?? "mpl2026-change-this-secret";
  const user = await getAuthUser(req, secret);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const id = parseInt(context.params.id, 10);
  if (isNaN(id)) return new Response("Invalid ID", { status: 400 });

  try {
    if (req.method === "GET") {
      const [player] = await db.select().from(players).where(eq(players.id, id));
      if (!player) return new Response("Not Found", { status: 404 });
      return Response.json({
        ...player,
        createdAt: player.createdAt?.toISOString() ?? null,
        updatedAt: player.updatedAt?.toISOString() ?? null,
      });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json() as Record<string, unknown>;

      const updates: Partial<typeof players.$inferInsert> = {};
      if (typeof body.full_name === "string") updates.fullName = body.full_name;
      if (typeof body.mobile_number === "string") updates.mobileNumber = body.mobile_number;
      if (typeof body.email === "string") updates.email = body.email;
      if (typeof body.date_of_birth === "string") updates.dateOfBirth = body.date_of_birth;
      if (typeof body.age === "number") updates.age = body.age;
      if (typeof body.gender === "string") updates.gender = body.gender;
      if (typeof body.address === "string") updates.address = body.address;
      if (typeof body.district === "string") updates.district = body.district;
      if (typeof body.state === "string") updates.state = body.state;
      if (typeof body.playing_role === "string") updates.playingRole = body.playing_role;
      if (typeof body.batting_style === "string") updates.battingStyle = body.batting_style;
      if (typeof body.bowling_style === "string") updates.bowlingStyle = body.bowling_style;
      if (typeof body.emergency_contact_name === "string") updates.emergencyContactName = body.emergency_contact_name;
      if (typeof body.emergency_contact_number === "string") updates.emergencyContactNumber = body.emergency_contact_number;
      if (typeof body.is_approved === "boolean") updates.isApproved = body.is_approved;

      if (Object.keys(updates).length === 0) {
        return Response.json({ error: "No fields to update" }, { status: 400 });
      }

      const [updated] = await db.update(players).set(updates).where(eq(players.id, id)).returning();
      if (!updated) return new Response("Not Found", { status: 404 });
      return Response.json({
        ...updated,
        createdAt: updated.createdAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt?.toISOString() ?? null,
      });
    }

    if (req.method === "DELETE") {
      const result = await db.delete(players).where(eq(players.id, id)).returning({ id: players.id });
      if (result.length === 0) return new Response("Not Found", { status: 404 });
      return Response.json({ success: true });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (err: unknown) {
    console.error("player error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/players/:id",
  method: ["GET", "PUT", "PATCH", "DELETE"],
};
