import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";
import { eq, count } from "drizzle-orm";
import { getAuthUser } from "./lib/auth.js";

export default async (req: Request): Promise<Response> => {
  const secret = Netlify.env.get("JWT_SECRET") ?? "mpl2026-change-this-secret";
  const user = await getAuthUser(req, secret);
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const [{ total }] = await db.select({ total: count() }).from(players);
    const [{ approved }] = await db.select({ approved: count() }).from(players).where(eq(players.isApproved, true));
    const recent = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        mobileNumber: players.mobileNumber,
        createdAt: players.createdAt,
      })
      .from(players)
      .orderBy(players.createdAt)
      .limit(5);

    return Response.json({
      total: Number(total),
      approved: Number(approved),
      pending: Number(total) - Number(approved),
      recent: recent.map((p) => ({
        ...p,
        createdAt: p.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (err: unknown) {
    console.error("dashboard error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/dashboard",
  method: ["GET"],
};
