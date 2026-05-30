import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { admins } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken } from "./lib/auth.js";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { username, password } = await req.json() as { username: string; password: string };
    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }

    const secret = Netlify.env.get("JWT_SECRET") ?? "mpl2026-change-this-secret";

    // Auto-seed first admin from environment variables if no admins exist
    const allAdmins = await db.select({ id: admins.id }).from(admins);
    if (allAdmins.length === 0) {
      const seedUsername = Netlify.env.get("ADMIN_USERNAME");
      const seedPassword = Netlify.env.get("ADMIN_PASSWORD");
      if (seedUsername && seedPassword) {
        const hash = await hashPassword(seedPassword);
        await db.insert(admins).values({ username: seedUsername, passwordHash: hash });
      }
    }

    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    if (!admin) {
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signToken(
      { id: admin.id, username: admin.username, exp: Date.now() + 86_400_000 },
      secret
    );

    return Response.json({ token, username: admin.username });
  } catch (err: unknown) {
    console.error("auth error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/auth/login",
  method: ["POST"],
};
