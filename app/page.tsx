"use client";

import { useEffect, useMemo, useState } from "react";

type Order = { id: string; name: string; shop: string; meal: string; qty: number };
type Person = { id: string; name: string };
type SkipRange = { id: string; start: string; end: string };

const initialPeople: Person[] = [
  "林 詩 怡","陳 怡 樺","游 家 林","王 煜 詔","林 賢 明","陳 恩 平","汪 柏 州","蔡 哲 霖","吳 建 成","李 權 峻","賀 冠 傑","許 峻 銘","王 介 武","陳 英 孜","王 鈺 棋","邱 宇 昕"
].map((name, i) => ({ id: String(i + 1), name }));
const initialShops = ["P劉媽", "L八方", "B華園", "I菩提心", "R今今", "F健康園"];
const sample = `571\t林 詩 怡\tP劉媽\t菜飯(7樣配菜)\t1
612\t陳 國 賢\tF健康園\t每日特餐\t1
960\t陳 怡 樺\tF健康園\t滷排骨\t1
987\t葉 錫 勳\tF健康園\t每日特餐\t1
1011\t林 昀 緯\tL八方\t韓式辣味水餃*9+玉米\t1
1069\t游 家 林\tB華園\t合菜便當\t1`;

const mondayOf = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
};
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const labelDate = (value: string) => {
  const d = new Date(value + "T12:00:00");
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}（${"日一二三四五六"[d.getDay()]}）`;
};

export default function Home() {
  const [tab, setTab] = useState<"orders"|"roster"|"shops">("orders");
  const [date, setDate] = useState(ymd(new Date()));
  const [raw, setRaw] = useState(sample);
  const [orders, setOrders] = useState<Order[]>([]);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [shops, setShops] = useState(initialShops);
  const [skipRanges, setSkipRanges] = useState<SkipRange[]>([]);
  const [anchor, setAnchor] = useState("2025-10-27");
  const [notice, setNotice] = useState("");
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lunch-admin-settings-v1");
    if (saved) try {
      const s=JSON.parse(saved);
      setPeople(s.people||initialPeople); setShops(s.shops||initialShops); setAnchor(s.anchor||"2025-10-27");
      if(Array.isArray(s.skipRanges)) setSkipRanges(s.skipRanges);
      else if(Array.isArray(s.skipWeeks)) setSkipRanges(s.skipWeeks.map((x:string,i:number)=>({id:`legacy-${i}`,start:x,end:x})));
    } catch {}
    setSettingsReady(true);
  }, []);
  useEffect(() => {
    if(settingsReady) localStorage.setItem("lunch-admin-settings-v1", JSON.stringify({people,shops,skipRanges,anchor}));
  }, [people,shops,skipRanges,anchor,settingsReady]);

  const duty = useMemo(() => {
    if (!settingsReady) return "載入中…";
    if (!people.length) return "尚未設定";
    const target = mondayOf(new Date(date+"T12:00:00"));
    const start = mondayOf(new Date(anchor+"T12:00:00"));
    let weeks = Math.floor((target.getTime()-start.getTime())/604800000);
    const skippedMondays=new Set<string>();
    skipRanges.forEach(range=>{
      let m=mondayOf(new Date(range.start+"T12:00:00"));
      const end=mondayOf(new Date(range.end+"T12:00:00"));
      while(m<=end){skippedMondays.add(ymd(m));m=new Date(m.getFullYear(),m.getMonth(),m.getDate()+7)}
    });
    if(skippedMondays.has(ymd(target))) return "本週暫停輪值";
    weeks -= [...skippedMondays].filter(x=>{const m=new Date(x+"T12:00:00");return m>=start&&m<target}).length;
    return people[((weeks % people.length) + people.length) % people.length]?.name || "尚未設定";
  }, [date, people, skipRanges, anchor, settingsReady]);

  const shopSummary = useMemo(() => orders.reduce<Record<string,number>>((a,o)=>(a[o.shop]=(a[o.shop]||0)+o.qty,a),{}),[orders]);
  const total = orders.reduce((n,o)=>n+o.qty,0);

  function parse() {
    const lines=raw.trim().split(/\r?\n/).filter(Boolean); const result:Order[]=[];
    for (const line of lines) {
      const cells=line.split("\t").map(x=>x.trim()).filter((x,i,a)=>x!=="" || (i>0&&i<a.length-1));
      if (/工號/.test(cells.join("")) || /訂餐日期|總計|製表人/.test(cells[0]||"")) continue;
      let id=cells[0]||"", name=cells[1]||"", shop=cells[2]||"", meal=cells[3]||"", qty=Number(cells[4]||1);
      if (cells.length>=11) { id=cells[0]; name=cells[1]; shop=cells[3]; meal=cells[6]; qty=Number(cells[10]||1); }
      if (/^\d+$/.test(id) && name && shop) result.push({id,name,shop,meal,qty:Number.isFinite(qty)&&qty>0?qty:1});
    }
    setOrders(result); setNotice(result.length?`已整理 ${result.length} 筆訂餐資料`:`沒有讀到資料，請確認是從 order 頁籤複製。`); setTimeout(()=>setNotice(""),3500);
  }
  async function copyNotice() {
    const details=orders.map(o=>`${o.name.replaceAll(" ","")}｜${o.shop}｜${o.meal}${o.qty>1?` × ${o.qty}`:""}`).join("\n");
    const sums=Object.entries(shopSummary).map(([s,n])=>`${s} ${n} 份`).join("、");
    await navigator.clipboard.writeText(`今日午餐 ${labelDate(date)}\n值日生：${duty}\n\n${details}\n\n店家統計：${sums}\n共 ${total} 份`);
    setNotice("已複製 LINE 公告"); setTimeout(()=>setNotice(""),2500);
  }
  function downloadLineTable() {
    const width=900, rowH=76, headerH=170, tableHeadH=58;
    const shopRows=Math.ceil(Object.keys(shopSummary).length/2);
    const summaryH=112+shopRows*52;
    const canvas=document.createElement("canvas");
    canvas.width=width; canvas.height=headerH+tableHeadH+rowH*orders.length+summaryH;
    const c=canvas.getContext("2d"); if(!c) return;
    c.fillStyle="#f6f3eb"; c.fillRect(0,0,width,canvas.height);
    c.fillStyle="#275f51"; c.fillRect(0,0,width,headerH);
    c.fillStyle="#ffffff"; c.font='700 42px "Microsoft JhengHei", sans-serif'; c.fillText("今日午餐",40,58);
    c.font='500 25px "Microsoft JhengHei", sans-serif'; c.fillText(labelDate(date),40,103);
    c.fillStyle="#e88958"; c.fillRect(40,126,280,5);
    c.fillStyle="#dcebe6"; c.font='700 27px "Microsoft JhengHei", sans-serif'; c.textAlign="right"; c.fillText(`值日生｜${duty.replaceAll(" ","")}`,860,92); c.textAlign="left";
    const xs=[32,170,292,804]; const heads=["姓名","店家","餐點","數量"];
    c.fillStyle="#dcebe6"; c.fillRect(24,headerH+12,width-48,tableHeadH-12);
    c.fillStyle="#275f51"; c.font='700 22px "Microsoft JhengHei", sans-serif'; heads.forEach((h,i)=>c.fillText(h,xs[i]+10,headerH+44));
    orders.forEach((o,i)=>{
      const y=headerH+tableHeadH+rowH*i; c.fillStyle=i%2===0?"#ffffff":"#f8faf8"; c.fillRect(24,y,width-48,rowH);
      c.fillStyle="#17342d"; c.font='500 21px "Microsoft JhengHei", sans-serif';
      c.fillText(o.name.replaceAll(" ",""),xs[0]+10,y+43); c.fillText(o.shop,xs[1]+10,y+43); c.fillText(String(o.qty),xs[3]+10,y+43);
      const first=o.meal.slice(0,24), second=o.meal.length>24?o.meal.slice(24,46)+(o.meal.length>46?"…":""):"";
      c.fillText(first,xs[2]+10,y+(second?30:43)); if(second){c.font='500 18px "Microsoft JhengHei", sans-serif';c.fillText(second,xs[2]+10,y+57)}
      c.strokeStyle="#dfe5df"; c.beginPath(); c.moveTo(24,y+rowH); c.lineTo(width-24,y+rowH); c.stroke();
    });
    const sy=headerH+tableHeadH+rowH*orders.length;
    c.fillStyle="#edf3f0"; c.fillRect(24,sy+20,width-48,summaryH-40);
    c.fillStyle="#275f51"; c.font='700 25px "Microsoft JhengHei", sans-serif'; c.fillText("店家統計",44,sy+58);
    Object.entries(shopSummary).forEach(([s,n],i)=>{const col=i%2,row=Math.floor(i/2);c.font='600 21px "Microsoft JhengHei", sans-serif';c.fillStyle="#17342d";c.fillText(`${s}　${n} 份`,44+col*410,sy+102+row*52)});
    c.fillStyle="#e88958"; c.font='700 28px "Microsoft JhengHei", sans-serif'; c.textAlign="right"; c.fillText(`合計 ${total} 份`,856,sy+58); c.textAlign="left";
    const link=document.createElement("a"); link.download=`午餐公告-${date}.png`; link.href=canvas.toDataURL("image/png"); link.click();
    setNotice("已下載 LINE 表格圖片"); setTimeout(()=>setNotice(""),2500);
  }
  function move(i:number, dir:number){ const n=i+dir;if(n<0||n>=people.length)return;const next=[...people];[next[i],next[n]]=[next[n],next[i]];setPeople(next); }

  return <main>
    <header className="topbar"><div className="brand"><span className="brandmark">午</span><span>午餐小管家</span></div><nav>
      <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>今日訂餐</button>
      <button className={tab==="roster"?"active":""} onClick={()=>setTab("roster")}>值日排班</button>
      <button className={tab==="shops"?"active":""} onClick={()=>setTab("shops")}>店家管理</button>
    </nav><div className="admin"><span>行政人員</span><span className="avatar">管</span></div></header>
    {notice&&<div className="toast">✓ {notice}</div>}

    {tab==="orders" && <section className="page">
      <div className="title-row"><div><p className="eyebrow">DAILY LUNCH</p><h1>今日訂餐</h1><p className="subtitle">貼上 order 頁籤資料，系統會自動整理餐點與值日生。</p></div><label className="datebox"><span>訂餐日期</span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
      <div className="workflow"><span className="on"><b>1</b> 貼上資料</span><i></i><span className={orders.length?"on":""}><b>2</b> 確認結果</span><i></i><span className={orders.length?"on":""}><b>3</b> 複製公告</span></div>
      <div className="grid">
        <div className="card input-card"><div className="card-head"><div><h2>貼上 order 資料</h2><p>直接從試算表複製整個資料區塊</p></div><button className="text-btn" onClick={()=>setRaw(sample)}>填入範例</button></div>
          <textarea aria-label="訂餐資料" value={raw} onChange={e=>setRaw(e.target.value)} placeholder={'請貼上 order 頁籤內容\n工號　姓名　店名　餐名　數量'} />
          <div className="hint"><span>支援從 Excel 或 Google 試算表直接貼上</span><span>{raw.trim()?raw.trim().split(/\n/).length:0} 列</span></div>
          <button className="primary" onClick={parse}>整理訂餐資料 <span>→</span></button>
        </div>
        <aside className="duty-card"><p>本週值日生</p><div className="duty-name"><span className="person-icon">人</span><strong>{duty.replaceAll(" ","")}</strong></div><div className="week">{labelDate(ymd(mondayOf(new Date(date+"T12:00:00"))))} 起</div><p className="duty-note">每週一自動輪替，週一至週五由同一人值日。</p><button className="outline" onClick={()=>setTab("roster")}>查看排班設定</button></aside>
      </div>
      {orders.length>0 && <div className="result-grid"><section className="card results"><div className="card-head"><div><p className="eyebrow">PREVIEW</p><h2>今日午餐・{labelDate(date)}</h2></div><span className="count">{total} 份</span></div><div className="table-wrap"><table><thead><tr><th>姓名</th><th>店家</th><th>餐點</th><th>數量</th></tr></thead><tbody>{orders.map((o,i)=><tr key={i}><td>{o.name}</td><td><span className="shop-pill">{o.shop}</span></td><td>{o.meal}</td><td>{o.qty}</td></tr>)}</tbody></table></div></section>
      <aside className="card summary"><p className="eyebrow">SHOP SUMMARY</p><h2>店家統計</h2>{Object.entries(shopSummary).map(([s,n])=><div className="sum-row" key={s}><span>{s}</span><strong>{n} 份</strong></div>)}<div className="total"><span>合計</span><strong>{total} 份</strong></div><button className="line-btn" onClick={downloadLineTable}>下載 LINE 表格圖片</button><button className="copy-btn" onClick={copyNotice}>複製純文字公告</button><p className="shot-tip">下載後可直接將 PNG 圖片傳到 LINE</p></aside></div>}
    </section>}

    {tab==="roster" && <section className="page narrow"><div className="title-row"><div><p className="eyebrow">WEEKLY ROSTER</p><h1>值日排班</h1><p className="subtitle">拖曳概念改為明確的上下調整，手機也好操作。</p></div></div>
      <div className="settings-grid"><section className="card"><div className="card-head"><div><h2>輪值順序</h2><p>每人輪值一週，從週一開始</p></div><button className="text-btn" onClick={()=>setPeople(p=>[...p,{id:crypto.randomUUID(),name:"新同仁"}])}>＋ 新增人員</button></div>
      <label className="field"><span>輪值起算週一</span><input type="date" value={anchor} onChange={e=>setAnchor(e.target.value)}/></label>
      <div className="roster">{people.map((p,i)=><div className="roster-row" key={p.id}><span className="num">{i+1}</span><input value={p.name} onChange={e=>setPeople(a=>a.map(x=>x.id===p.id?{...x,name:e.target.value}:x))}/><div><button onClick={()=>move(i,-1)} aria-label="往上">↑</button><button onClick={()=>move(i,1)} aria-label="往下">↓</button><button className="delete" onClick={()=>setPeople(a=>a.filter(x=>x.id!==p.id))} aria-label="刪除">×</button></div></div>)}</div></section>
      <aside className="card"><h2>跳過日期區間</h2><p>設定春節或連續休假期間；跨到兩週時，兩週都會停止輪值且不重複計算。</p><div className="skip-range-add"><label><span>起始日</span><input type="date" id="skipStart"/></label><label><span>結束日</span><input type="date" id="skipEnd"/></label><button onClick={()=>{const s=document.getElementById("skipStart") as HTMLInputElement,e=document.getElementById("skipEnd") as HTMLInputElement;if(s.value&&e.value){const start=s.value<=e.value?s.value:e.value,end=s.value<=e.value?e.value:s.value;setSkipRanges(a=>[...a,{id:crypto.randomUUID(),start,end}]);s.value="";e.value=""}}}>加入區間</button></div>{skipRanges.length===0?<div className="empty">目前沒有跳過日期</div>:skipRanges.map(x=><div className="skip-row" key={x.id}><span>{labelDate(x.start)} ～ {labelDate(x.end)}</span><button onClick={()=>setSkipRanges(a=>a.filter(v=>v.id!==x.id))}>移除</button></div>)}</aside></div>
    </section>}

    {tab==="shops" && <section className="page narrow"><div className="title-row"><div><p className="eyebrow">VENDORS</p><h1>店家管理</h1><p className="subtitle">增減可辨識的店名，貼上資料時仍會保留清單外的新店家。</p></div></div><section className="card shop-manager"><div className="card-head"><div><h2>店家清單</h2><p>{shops.length} 間店家</p></div><button className="text-btn" onClick={()=>setShops(a=>[...a,"新店家"])}>＋ 新增店家</button></div>{shops.map((s,i)=><div className="shop-edit" key={i}><span className="shop-dot"></span><input value={s} onChange={e=>setShops(a=>a.map((x,j)=>j===i?e.target.value:x))}/><button onClick={()=>setShops(a=>a.filter((_,j)=>j!==i))}>刪除</button></div>)}</section></section>}
  </main>;
}
