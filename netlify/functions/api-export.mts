import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { players } from "../../db/schema.js";
import { and, or, ilike, eq, desc } from "drizzle-orm";
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
    const idsParam = url.searchParams.get("ids") ?? "";

    const conditions = [];
    if (idsParam) {
      // Only export specific IDs — do a simpler approach with a raw IN query
      const idList = idsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      if (idList.length === 0) {
        return new Response("id,full_name,mobile_number\r\n", {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="mpl2026_players.csv"',
          },
        });
      }
    }
    if (q) conditions.push(or(ilike(players.fullName, `%${q}%`), ilike(players.mobileNumber, `%${q}%`)));
    if (role) conditions.push(eq(players.playingRole, role));
    if (district) conditions.push(ilike(players.district, `%${district}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(players).where(where).orderBy(desc(players.createdAt));

    const header = [
      "id","full_name","mobile_number","email","date_of_birth","age","gender",
      "address","district","state","playing_role","batting_style","bowling_style",
      "profile_photo","emergency_contact_name","emergency_contact_number",
      "is_approved","created_at",
    ];

    const csvRows = [header.join(",")];
    for (const p of rows) {
      const row = [
        p.id,
        csvEscape(p.fullName),
        csvEscape(p.mobileNumber),
        csvEscape(p.email ?? ""),
        csvEscape(p.dateOfBirth ?? ""),
        p.age ?? "",
        genderLabel(p.gender ?? ""),
        csvEscape(p.address ?? ""),
        csvEscape(p.district ?? ""),
        csvEscape(p.state ?? ""),
        csvEscape(p.playingRole ?? ""),
        csvEscape(p.battingStyle ?? ""),
        csvEscape(p.bowlingStyle ?? ""),
        csvEscape(p.profilePhotoUrl ?? ""),
        csvEscape(p.emergencyContactName ?? ""),
        csvEscape(p.emergencyContactNumber ?? ""),
        p.isApproved ? "True" : "False",
        p.createdAt?.toISOString() ?? "",
      ];
      csvRows.push(row.join(","));
    }

    return new Response(csvRows.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="mpl2026_players.csv"',
      },
    });
  } catch (err: unknown) {
    console.error("export error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
};

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function genderLabel(g: string): string {
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  if (g === "O") return "Other";
  return g;
}

export const config: Config = {
  path: "/api/players/export",
  method: ["GET"],
};
