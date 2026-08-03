import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:"午餐小管家｜訂餐統計與值日排班",
  description:"貼上訂餐資料，自動統計店家與安排每週值日生。",
  openGraph:{title:"午餐小管家",description:"訂餐統計 × 值日排班",images:["/og.png"]},
  twitter:{card:"summary_large_image",title:"午餐小管家",description:"訂餐統計 × 值日排班",images:["/og.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>}
