# 午餐小管家 (Lunch Duty Roster)

辦公室/團隊專用的午餐訂餐整理與值日生自動輪值系統。

- **線上執行網址 (Live URL)**：[https://site-creator-vinext-starter.etcc00.workers.dev](https://site-creator-vinext-starter.etcc00.workers.dev)
- **GitHub 專案**：[https://github.com/etctaichi/lunch-duty-roster](https://github.com/etctaichi/lunch-duty-roster)

---

## 🔐 身份驗證與存取權限說明

本系統具備安全的帳號存取限制與角色權限劃分：

1. **Email 登入限制**：
   * 只有被管理員加入 **「系統存取名單」** 中的 Email 帳號才可以登入系統。
   * 輸入未授權的 Email 會被系統攔截並拒絕登入。

2. **一般使用者 (Viewer)**：
   * 登入時**無須密碼**，只需輸入已授權的 Email 即可直接登入。
   * 登入後為 **唯讀模式**。可使用「今日訂餐」貼上整理及產出 LINE 公告與統計圖片，但無法修改排班設定與帳號名單。

3. **管理員 (Admin)**：
   * 登入時除了輸入管理員 Email，還需要輸入管理員密碼。
   * 管理員的初始預設密碼，可由專案部署時設定的環境變數或 Cloudflare Workers Secrets (`DEFAULT_PASSWORD`) 決定。
   * 登入後可使用完整功能，包含修改值日生順序、休假區間，以及在 **「帳號管理」** 頁面進行 **「系統存取名單管理」** 與 **「修改管理員密碼」**。
   * 管理員可新增其他管理員帳號。新建的管理員會以系統環境變數設定的密碼作為初始密碼，登入後可各自修改為個人專屬密碼。

---

## ☁️ 資料庫同步與雲端儲存

所有設定（包括輪值人員名單、起算日、跳過假期）皆已從本機快取升級為 **Cloudflare D1 雲端資料庫** 託管：
* 任何管理員修改設定時，都會自動即時同步至雲端（編輯文字時，輸入完畢點擊欄位外部失焦即可自動存檔）。
* 所有使用者在任何電腦、手機或無痕視窗開啟網頁，看到的都是最新、最一致的值日生狀態。
* 預設已內建 2026 年春節年假（2026-02-16 ~ 2026-02-22）扣除，即使重設回系統預設值，值日生計算依然精確。

---

## 📅 國定假日匯入（.ics 檔案）

管理員可上傳由 **行政院人事行政總處** 公布的官方假日行事曆（`.ics` 格式），系統會自動解析並整合至值日排班計算中。

### 功能說明

| 情境 | 系統行為 |
|---|---|
| 假日為平日（週一至週五） | 在假日清單以**灰色**標示，**照常安排值日生** |
| 整週（週一至週五）皆為假日 | 以**紅色**標示，**自動跳過該週輪值** |
| 假日落在週六、週日 | 忽略不處理（假日檔常含週末資料）|

> **注意**：`.ics` 假日檔主要涵蓋國定假日，**春假（學校假期）不含在內**，請另在「跳過日期區間」手動設定。

### 下載官方假日檔

1. 前往 [行政院人事行政總處－行事曆頁面](https://www.dgpa.gov.tw/informationlist?uid=27)
2. 下載當年行事曆的 `.ics` 格式檔案
3. 或透過 Google 日曆訂閱「台灣假日」後匯出 `.ics`

### 操作步驟

1. 以管理員帳號登入系統
2. 切換至 **「值日排班」** 頁籤
3. 找到右側「跳過日期區間」卡片下方的 **「國定假日檔案」** 區塊
4. 點擊上傳區塊，選擇 `.ics` 檔案
5. 上傳後假日資料自動存入雲端，所有裝置即時同步
6. 每年可重新上傳新年度的 `.ics` 覆蓋舊資料

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
