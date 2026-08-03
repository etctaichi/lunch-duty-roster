import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const allowedUsers = sqliteTable("allowed_users", {
  email: text("email").primaryKey(), // lowercase email
  role: text("role").notNull().default("viewer"), // 'admin' | 'viewer'
  password: text("password"), // Only used for admins, plain text
});

export const systemSettings = sqliteTable("system_settings", {
  id: integer("id").primaryKey(),
  people: text("people").notNull(), // JSON string
  shops: text("shops").notNull(), // JSON string
  skipRanges: text("skip_ranges").notNull(), // JSON string
  anchor: text("anchor").notNull(),
});
