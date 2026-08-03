# 午餐小管家 (Lunch Duty Roster)

辦公室/團隊專用的午餐訂餐整理與值日生自動輪值系統。

- **線上正式執行網址 (Live URL)**：[https://lunch-duty-tw.etcc00ai.chatgpt.site](https://lunch-duty-tw.etcc00ai.chatgpt.site)
- **GitHub 專案**：[https://github.com/etctaichi/lunch-duty-roster](https://github.com/etctaichi/lunch-duty-roster)
- **系統管理員**：`etctaichi@gmail.com`

---

## 🔐 身份驗證與登入說明

1. **線上環境 (Production)**：
   * 開啟線上網址 [https://lunch-duty-tw.etcc00ai.chatgpt.site](https://lunch-duty-tw.etcc00ai.chatgpt.site) 時，透過 Sign in with ChatGPT 進行 Email 帳號驗證。
   * 登入後系統自動識別 Email，若為 `etctaichi@gmail.com` 則授予最高管理員權限。

2. **本地開發環境 (Local Dev)**：
   * 本地環境（例如 `http://localhost:3004/`）提供專屬的「💻 本地測試登入」區塊：
   * 可輸入任何 Email 帳號登入，或點選捷徑：
     * **`👑 以管理員登入`** (`etctaichi@gmail.com`)
     * **`👤 以一般使用者登入`** (`user@example.com`)

---

## 核心功能

1. **今日訂餐整理**：貼入試算表 `order` 頁籤內容，自動清理標頭、解析份數、統計店家，並可一鍵複製文字公告或下載 LINE 專用表格 PNG 圖片。
2. **值日生自動排班**：每週一自動輪替值日生，支援設定連續休假/連假區間（自動扣除中斷週數）。
3. **管理員權限控制**：
   * **系統管理員 (`etctaichi@gmail.com`)**：具備完整管理權限，可新增/修改/調整輪值人員順序、設定休假區間、維護常訂店家清單。
   * **一般登入使用者**：可使用今日訂餐整理與產出公告，值日排班與店家管理頁面為唯讀防誤觸模式。

---

## 開發與部署

```bash
# 安裝依賴
npm install

# 啟動本地開發服務
npm run dev

# 構建專案
npm run build
```
