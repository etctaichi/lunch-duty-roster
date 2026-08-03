import { eq } from "drizzle-orm";
import { getDb, initDb } from "../../../db";
import { allowedUsers } from "../../../db/schema";

const DEFAULT_ADMIN = "etctaichi@gmail.com";

async function getDefaultPassword(): Promise<string> {
  try {
    const { env } = await import("cloudflare:workers");
    if (env.DEFAULT_PASSWORD) {
      return env.DEFAULT_PASSWORD;
    }
  } catch {}
  if (typeof process !== "undefined" && process.env.DEFAULT_PASSWORD) {
    return process.env.DEFAULT_PASSWORD;
  }
  throw new Error("DEFAULT_PASSWORD environment variable or secret is not set.");
}

async function ensureDefaultAdmin(db: any, defaultPassword: string) {
  try {
    const admin = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.email, DEFAULT_ADMIN))
      .get();

    if (!admin) {
      // Seed default admin
      await db.insert(allowedUsers).values({
        email: DEFAULT_ADMIN,
        role: "admin",
        password: defaultPassword,
      });
    }
  } catch (err) {
    // Table might not exist yet, we will let the main handler catch it
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    await initDb();
    const db = getDb();
    const defaultPassword = await getDefaultPassword();
    await ensureDefaultAdmin(db, defaultPassword);

    if (action === "login") {
      const { email, password } = body;
      const targetEmail = email?.trim().toLowerCase();

      if (!targetEmail) {
        return Response.json({ error: "請輸入 Email" }, { status: 400 });
      }

      // Check if user exists
      const user = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, targetEmail))
        .get();

      if (!user) {
        return Response.json(
          { error: "❌ 您的帳號不在允許登入的清單中，請聯絡管理員。" },
          { status: 403 }
        );
      }

      if (user.role === "admin") {
        if (!password) {
          return Response.json({ error: "請輸入管理員密碼", requirePassword: true }, { status: 400 });
        }
        if (user.password !== password) {
          return Response.json({ error: "❌ 管理員密碼錯誤" }, { status: 401 });
        }
      }

      return Response.json({
        success: true,
        user: {
          userId: user.email,
          email: user.email,
          displayName: user.email,
          role: user.role,
        },
      });
    }

    if (action === "change-password") {
      const { adminEmail, oldPassword, newPassword } = body;
      const targetEmail = adminEmail?.trim().toLowerCase();

      if (!newPassword || newPassword.trim().length < 4) {
        return Response.json({ error: "新密碼長度至少需要 4 個字元" }, { status: 400 });
      }

      const admin = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, targetEmail))
        .get();

      if (!admin || admin.role !== "admin") {
        return Response.json({ error: "找不到管理員帳號" }, { status: 404 });
      }

      if (admin.password !== oldPassword) {
        return Response.json({ error: "舊密碼輸入錯誤" }, { status: 401 });
      }

      await db
        .update(allowedUsers)
        .set({ password: newPassword })
        .where(eq(allowedUsers.email, targetEmail));

      return Response.json({ success: true, message: "密碼修改成功" });
    }

    if (action === "list-users") {
      const { requesterEmail } = body;
      const requester = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, requesterEmail?.trim().toLowerCase()))
        .get();

      if (!requester || requester.role !== "admin") {
        return Response.json({ error: "無權限執行此操作" }, { status: 403 });
      }

      const list = await db.select().from(allowedUsers);
      return Response.json({ success: true, users: list });
    }

    if (action === "add-user") {
      const { requesterEmail, email, role, password } = body;
      const requester = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, requesterEmail?.trim().toLowerCase()))
        .get();

      if (!requester || requester.role !== "admin") {
        return Response.json({ error: "無權限執行此操作" }, { status: 403 });
      }

      const targetEmail = email?.trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes("@")) {
        return Response.json({ error: "請輸入有效的 Email" }, { status: 400 });
      }

      // Check if already exists
      const existing = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, targetEmail))
        .get();

      if (existing) {
        return Response.json({ error: "該帳號已在清單中" }, { status: 400 });
      }

      await db.insert(allowedUsers).values({
        email: targetEmail,
        role: role || "viewer",
        password: role === "admin" ? (password || defaultPassword) : null,
      });

      const list = await db.select().from(allowedUsers);
      return Response.json({ success: true, users: list });
    }

    if (action === "delete-user") {
      const { requesterEmail, emailToDelete } = body;
      const requester = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, requesterEmail?.trim().toLowerCase()))
        .get();

      if (!requester || requester.role !== "admin") {
        return Response.json({ error: "無權限執行此操作" }, { status: 403 });
      }

      const targetDelete = emailToDelete?.trim().toLowerCase();
      if (targetDelete === DEFAULT_ADMIN) {
        return Response.json({ error: "不能刪除預設的管理員帳號" }, { status: 400 });
      }

      await db.delete(allowedUsers).where(eq(allowedUsers.email, targetDelete));

      const list = await db.select().from(allowedUsers);
      return Response.json({ success: true, users: list });
    }

    return Response.json({ error: "未知的 action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message.includes("no such table")) {
      return Response.json(
        {
          error: "資料庫尚未初始化。請確保已建立 D1 資料庫，且執行了 `npx wrangler d1 migrations apply`。",
        },
        { status: 500 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
