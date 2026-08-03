import { eq } from "drizzle-orm";
import { getDb, initDb } from "../../../db";
import { allowedUsers, systemSettings } from "../../../db/schema";

const INITIAL_PEOPLE = [
  "林 詩 怡","陳 怡 樺","游 家 林","王 煜 詔","林 賢 明","陳 恩 平","汪 柏 州","蔡 哲 霖","吳 建 成","李 權 峻","賀 冠 傑","許 峻 銘","王 介 武","陳 英 孜","王 鈺 棋","邱 宇 昕"
].map((name, i) => ({ id: String(i + 1), name }));
const INITIAL_SHOPS = ["P劉媽", "L八方", "B華園", "I菩提心", "R今今", "F健康園"];
const DEFAULT_SKIP_RANGES = [
  { id: "default-cny-2026", start: "2026-02-16", end: "2026-02-22" }
];
const DEFAULT_ANCHOR = "2025-10-27";

async function ensureDefaultSettings(db: ReturnType<typeof getDb>) {
  try {
    const row = await db.select().from(systemSettings).where(eq(systemSettings.id, 1)).get();
    if (!row) {
      await db.insert(systemSettings).values({
        id: 1,
        people: JSON.stringify(INITIAL_PEOPLE),
        shops: JSON.stringify(INITIAL_SHOPS),
        skipRanges: JSON.stringify(DEFAULT_SKIP_RANGES),
        anchor: DEFAULT_ANCHOR,
        holidays: JSON.stringify([]),
      });
    }
  } catch (err) {
    // Schema may not be migrated yet
  }
}

export async function GET(request: Request) {
  try {
    await initDb();
    const db = getDb();
    await ensureDefaultSettings(db);

    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 1)).get();
    if (!settings) {
      return Response.json({ error: "無法讀取系統設定，請確認已執行 database migration。" }, { status: 500 });
    }

    return Response.json({
      success: true,
      people: JSON.parse(settings.people),
      shops: JSON.parse(settings.shops),
      skipRanges: JSON.parse(settings.skipRanges),
      anchor: settings.anchor,
      holidays: JSON.parse(settings.holidays ?? "[]"),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterEmail, people, shops, skipRanges, anchor, holidays } = body;

    await initDb();
    const db = getDb();

    // Verify requester is admin
    const requester = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.email, requesterEmail?.trim().toLowerCase()))
      .get();

    if (!requester || requester.role !== "admin") {
      return Response.json({ error: "無權限執行此操作" }, { status: 403 });
    }

    // Save settings
    await db
      .update(systemSettings)
      .set({
        people: JSON.stringify(people),
        shops: JSON.stringify(shops),
        skipRanges: JSON.stringify(skipRanges),
        anchor: anchor,
        ...(holidays !== undefined ? { holidays: JSON.stringify(holidays) } : {}),
      })
      .where(eq(systemSettings.id, 1));

    return Response.json({ success: true, message: "設定儲存成功" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500 });
  }
}
