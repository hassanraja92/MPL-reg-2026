import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobileNumber: text("mobile_number").notNull().unique(),
  email: text("email").default(""),
  dateOfBirth: text("date_of_birth").default(""),
  age: integer("age"),
  gender: text("gender").default(""),
  address: text("address").default(""),
  district: text("district").default(""),
  state: text("state").default(""),
  playingRole: text("playing_role").default(""),
  battingStyle: text("batting_style").default(""),
  bowlingStyle: text("bowling_style").default(""),
  profilePhotoUrl: text("profile_photo_url").default(""),
  emergencyContactName: text("emergency_contact_name").default(""),
  emergencyContactNumber: text("emergency_contact_number").default(""),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
