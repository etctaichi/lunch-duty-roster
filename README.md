# 午餐小管家 (Lunch Duty Roster)

辦公室/團隊專用的午餐訂餐整理與值日生自動輪值系統。

- **線上執行網址 (Live URL)**：[https://site-creator-vinext-starter.etcc00.workers.dev](https://site-creator-vinext-starter.etcc00.workers.dev)
- **GitHub 專案**：[https://github.com/etctaichi/lunch-duty-roster](https://github.com/etctaichi/lunch-duty-roster)
- **預設系統管理員**：`etctaichi@gmail.com`

---

## 🔐 身份驗證與存取權限說明

本系統具備安全的帳號存取限制與角色權限劃分：

1. **Email 登入限制**：
   * 只有被管理員加入 **「系統存取名單」** 中的 Email 帳號才可以登入系統。
   * 輸入未授權的 Email 會被系統攔截並拒絕登入。

2. **一般使用者 (Viewer)**：
   * 登入時**無須密碼**，只需輸入已授權的 Email 即可直接登入。
   * 登入後為 **唯讀模式**。可使用「今日訂餐」貼上整理及產出 LINE 公告/圖片，但無法修改排班設定與店家清單。

3. **管理員 (Admin)**：
   * 預設管理員帳號為 `etctaichi@gmail.com`，初始預設密碼為 **`etc14101850`**。
   * 登入時需輸入管理員密碼。
   * 登入後可使用完整功能，包含修改值日生順序、休假區間、維護常訂店家，以及在「值日排班」頁面底部進行 **「系統存取名單管理」** 與 **「修改管理員密碼」**。
   * 管理員可新增其他管理員帳號。新建的管理員初始密碼同樣為 `etc14101850`，登入後可各自修改密碼。

---

## ☁️ 資料庫同步與雲端儲存

所有設定（包括輪值人員名單、店家管理、起算日、跳過假期）皆已從本機快取升級為 **Cloudflare D1 雲端資料庫** 託管：
* 任何管理員修改設定時，都會自動即時同步至雲端（編輯文字時，輸入完畢點擊欄位外部失焦即可自動存檔）。
* 所有使用者在任何電腦、手機或無痕視窗開啟網頁，看到的都是最新、最一致的值日生狀態。
* 預設已內建 2026 年春節年假（2026-02-16 ~ 2026-02-22）扣除，即使重設回系統預設值，值日生計算依然精確。

---

## 🛠️ 開發與部署指引

本專案使用 Next.js (App Router) + Vite (Vinext) + Drizzle ORM 建置，部署於 Cloudflare Workers (D1 SQL 資料庫)。

### 1. 本地開發與資料庫初始化
```bash
# 安裝相依套件
npm install

# 產生資料庫遷移檔 (Migrations)
npm run db:generate

# 初始化本地 D1 測試資料庫
npx wrangler d1 migrations apply lunch-db --local

# 啟動本地開發伺服器
npm run dev
```

### 2. 線上部署步驟
當您修改了資料庫 Schema 或程式碼後，請依序執行：
```bash
# 1. 提交並推送代碼
git add -A
git commit -m "your commit message"
git push origin main

# 2. 將新的資料庫結構套用至線上正式庫
npx wrangler d1 migrations apply lunch-db --remote

# 3. 建置並部署至 Cloudflare Workers
npm run deploy
```
