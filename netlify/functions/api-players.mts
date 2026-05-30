import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";
import { and, or, ilike, eq, desc, sql } from "drizzle-orm";
import { getAuthUser } from "./lib/auth.js";

export default async (req: Request): Promise<Response> => {
  const secret = Netlify.env.get("JWT_SECRET") ?? "mpl2026-change-this-secret";
  const user = await getAuthUser(req, secret);
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const role = url.searchParams.get("role") ?? "";
    const district = url.searchParams.get("district") ?? "";
    const approvedParam = url.searchParams.get("approved") ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "10", 10)));

    const conditions = [];
    if (q) {
      conditions.push(or(ilike(players.fullName, `%${q}%`), ilike(players.mobileNumber, `%${q}%`)));
    }
    if (role) conditions.push(eq(players.playingRole, role));
    if (district) conditions.push(ilike(players.district, `%${district}%`));
    if (approvedParam === "true") conditions.push(eq(players.isApproved, true));
    if (approvedParam === "false") conditions.push(eq(players.isApproved, false));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(players)
      .where(where);

    const totalCount = Number(total);
    const numPages = Math.max(1, Math.ceil(totalCount / perPage));
    const offset = (page - 1) * perPage;

    const rows = await db
      .select()
      .from(players)
      .where(where)
      .orderBy(desc(players.createdAt))
      .limit(perPage)
      .offset(offset);

    return Response.json({
      players: rows.map((p) => ({
        ...p,
        createdAt: p.createdAt?.toISOString() ?? null,
        updatedAt: p.updatedAt?.toISOString() ?? null,
      })),
      total: totalCount,
      page,
      per_page: perPage,
      num_pages: numPages,
    });
  } catch (err: unknown) {
    console.error("players list error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/players",
  method: ["GET"],
};
