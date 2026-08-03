import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const allowedUsers = sqliteTable("allowed_users", {
  email: text("email").primaryKey(), // lowercase email
  role: text("role").notNull().default("viewer"), // 'admin' | 'viewer'
  password: text("password"), // Only used for admins, plain text or hash
});
