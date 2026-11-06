"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "th" | "en";
const STORAGE_KEY = "gmck_language";
const translations: Record<string, string> = {
  "← กลับ": "← Back", "← หน้าแรก": "← Home", "← การตั้งค่า": "← Settings",
  "การตั้งค่า": "Settings", "ตั้งค่า": "Settings", "จัดการการใช้งานและความเป็นส่วนตัวของคุณ": "Manage your app preferences and privacy",
  "ตั้งค่าระยะค้นหา การแชร์ตำแหน่ง และอัปเดตตำแหน่ง": "Manage search radius, location sharing, and location updates",
  "สมัครหรือดูสถานะสมาชิกผู้ก่อตั้งตลอดชีพ": "Join or view your lifetime Founding membership",
  "แก้ไขโปรไฟล์": "Edit profile", "ข้อมูลส่วนตัว รูปภาพ และความสนใจ": "Personal details, photos, and interests",
  "อัลบั้มส่วนตัว": "Private album", "จัดการรูปภาพและสิทธิ์การเข้าถึง": "Manage photos and access permissions",
  "สมาชิกที่บล็อก": "Blocked members", "จัดการรายการสมาชิกที่คุณบล็อกไว้": "Manage your blocked members",
  "ออกจากระบบ": "Sign out", "ภาษา": "Language", "เลือกภาษาที่ใช้ในแอป GMCK": "Choose the language used in GMCK",
  "ไทย": "Thai", "English": "English", "บันทึกภาษาเรียบร้อยแล้ว": "Language preference saved",
  "Nearby": "Nearby", "ค้นหา": "Discover", "ข้อความ": "Messages", "แจ้งเตือน": "Notifications",
  "ใกล้ฉัน": "Nearby", "ค้นหาสมาชิก": "Discover members", "สมาชิกใกล้คุณ": "Members near you",
  "ตั้งค่า Nearby": "Nearby settings", "กำหนดระยะค้นหาและควบคุมการใช้ตำแหน่งได้จากที่นี่": "Set your search radius and control location sharing here",
  "กลับไปหน้าสมาชิกใกล้ฉัน": "Back to nearby members", "ตั้งค่าการค้นหาสมาชิกใกล้เคียง": "Nearby member search settings",
  "ระยะค้นหา": "Search radius", "เปิดใช้งาน": "Enabled", "ปิดใช้งาน": "Disabled",
  "กำลังโหลด": "Loading", "กำลังโหลด...": "Loading...", "กำลังดำเนินการ...": "Processing...",
  "ปิด Nearby และลบตำแหน่ง": "Turn off Nearby and delete location", "ยินยอมและเปิด Nearby": "Enable Nearby",
  "อัปเดตตำแหน่งตอนนี้": "Update location now", "ค้นหาชื่อเล่นหรือความสนใจ": "Search nickname or interests",
  "ยังไม่พบสมาชิก": "No members found", "ลองค้นหาด้วยคำอื่น หรือกลับมาดูอีกครั้งภายหลัง": "Try another search or check back later",
  "ดูโปรไฟล์": "View profile", "พิมพ์คำค้นหาแล้วกดค้นหาเพื่อเริ่มต้น": "Enter a search term and tap Discover to begin",
  "ข้อความ": "Messages", "คำขอข้อความและบทสนทนาของคุณ": "Your message requests and conversations",
  "คำขอใหม่": "New request", "ส่งรูป": "Sent a photo", "ยังไม่มีข้อความ": "No messages yet",
  "สนทนา": "Conversation", "รอการตอบรับจากคุณ": "Waiting for your response", "รออีกฝ่ายตอบรับ": "Waiting for their response",
  "คำขอถูกปฏิเสธ": "Request declined", "ยังไม่มีข้อความ เมื่อคุณพบคนที่สนใจ สามารถเปิดโปรไฟล์แล้วส่งข้อความแรกได้": "No messages yet. When you find someone you're interested in, open their profile and send the first message.",
  "สร้างโปรไฟล์ของคุณ": "Create your profile", "เริ่มต้นด้วยข้อมูลที่คุณสบายใจจะแบ่งปัน คุณสามารถกลับมาแก้ไขได้ภายหลัง": "Start with the details you're comfortable sharing. You can edit them later.",
  "ขั้นตอน 1 / 2": "Step 1 / 2", "สร้างโปรไฟล์": "Create profile", "บันทึก": "Save", "ยกเลิก": "Cancel",
  "ร่วมเป็นหนึ่งใน 300 ผู้บุกเบิก GMCK": "Become one of GMCK's first 300 pioneers",
  "ดูรายละเอียดและสิทธิ์สมาชิกผู้ก่อตั้ง": "View Founding membership details and benefits",
  "ร่วมเป็นหนึ่งในสมาชิกผู้ก่อตั้ง GMCK สถานะนี้เป็นเกียรติประวัติตลอดชีพ ไม่สามารถซื้อหรือโอนให้ผู้อื่นได้": "Become one of GMCK's Founding Members. This lifetime distinction cannot be purchased or transferred.",
  "การลบบัญชีจะทำให้สถานะ Founding ถูกเพิกถอนถาวร หมายเลขเดิมจะไม่ถูกนำกลับมาใช้ แม้สมัครใหม่ในภายหลัง": "Deleting your account permanently revokes Founding status. Your number will never be reused, even if you register again.",
  "สมาชิกที่บล็อกไว้": "Blocked members", "สมาชิกในรายการนี้จะไม่เห็นกันใน Discover หรือ Nearby และจะส่งข้อความหากันไม่ได้ คุณสามารถปลดบล็อกได้ทุกเมื่อ": "Members on this list cannot see each other in Discover or Nearby, or send messages. You can unblock them at any time.",
  "ต้องการปลดบล็อกสมาชิกคนนี้ใช่หรือไม่?": "Are you sure you want to unblock this member?",
  "ปลดบล็อกไม่สำเร็จ กรุณาลองใหม่": "Could not unblock member. Please try again.",
  "ปลดบล็อกเรียบร้อยแล้ว": "Member unblocked", "ยังไม่มีสมาชิกที่คุณบล็อกไว้": "You haven't blocked anyone",
  "ปลดบล็อก": "Unblock", "กำลังทำ...": "Working...", "บล็อกเมื่อ": "Blocked on",
  "พบคนใหม่": "Meet someone new", "ในแบบที่เป็นคุณ": "Be yourself",
  "พื้นที่ทำความรู้จักสำหรับผู้ชายเกย์และไบเซ็กชวล": "A space to connect for gay and bisexual men",
  "จะหาเพื่อน คนคุย หรือความสัมพันธ์ดี ๆ ก็เริ่มต้นได้ที่นี่": "Find friends, someone to talk to, or a meaningful relationship",
  "เริ่มจากคนใกล้คุณ": "Start with people nearby", "เลือกค้นหาตามระยะทาง โดยไม่เปิดเผยตำแหน่งจริง": "Discover people by distance without revealing your exact location",
  "ความสัมพันธ์ในแบบของคุณ": "Relationships on your terms", "เพื่อน คนคุย เดต หรือความสัมพันธ์ระยะยาว": "Friends, chat, dating, or a long-term relationship",
  "ความปลอดภัยต้องมาก่อน": "Safety comes first", "ควบคุมความเป็นส่วนตัว บล็อก และรายงานได้": "Control your privacy, block, and report members",
  "สมัครสมาชิก / เข้าสู่ระบบ": "Sign up / Log in", "สำหรับผู้มีอายุ 18 ปีขึ้นไป · เคารพความเป็นส่วนตัวของทุกคน": "For adults 18+ · Respect everyone's privacy",
  "สมาชิกใหม่": "New members", "แนะนำสมาชิกใหม่": "New members", "ทำความรู้จักสมาชิกที่เพิ่งเข้าร่วม GMCK": "Meet people who recently joined GMCK",
  "ค้นหาทั้งหมด →": "Discover all →", "สมาชิก GMCK": "GMCK member",
  "ยังโหลดคำแนะนำไม่ได้ กรุณาลองใหม่อีกครั้ง": "Recommendations couldn't load. Please try again.",
  "สมาชิกใหม่จะปรากฏที่นี่เมื่อมีผู้เข้าร่วม GMCK และเปิดให้ค้นพบโปรไฟล์": "New members will appear here when they join GMCK and make their profiles discoverable.",
  "ยังไม่พบสมาชิกในระยะนี้ ลองกลับมาดูอีกครั้ง": "No members found in this range. Please check again later.",
  "คุณยังไม่ได้เปิด Nearby": "Nearby is turned off", "คุณสามารถเปิดใช้งาน Nearby ได้จากเมนูการตั้งค่า": "You can enable Nearby from Settings.",
  "ตำแหน่งอัปเดตอัตโนมัติทุก 5 นาทีขณะเปิดหน้า Nearby เท่านั้น · ปิด Nearby เพื่อลบตำแหน่ง": "Location updates every 5 minutes only while Nearby is open · Turn off Nearby to delete your location",
  "กำลังค้นหาสมาชิกใกล้คุณ...": "Finding members near you...", "กำลังโหลดข้อมูลใกล้เคียง...": "Loading nearby members...",
  "ค้นหาจากชื่อเล่น ความสนใจ หรือคำแนะนำตัว ระบบจะแสดงเฉพาะสมาชิกที่อนุญาตให้ค้นพบโปรไฟล์": "Search by nickname, interests, or bio. Only members who allow profile discovery are shown.",
  "GMCK ไม่แสดงพิกัดจริงหรือระยะทางที่ระบุตำแหน่งได้": "GMCK never shows exact coordinates or location-identifying distances.",
  "ยังไม่มีตำแหน่งล่าสุด กรุณาอัปเดตตำแหน่งในการตั้งค่า": "No recent location. Please update your location in Settings.",
  "ค้นหาสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง": "Could not find members. Please try again.",
  "ยังไม่พบสมาชิกในระยะนี้ที่เปิด Nearby และเปิดให้ค้นพบโปรไฟล์": "No discoverable members with Nearby enabled were found in this range.",
  "ดึงลงเพื่อรีเฟรช": "Pull down to refresh", "ปล่อยเพื่อรีเฟรช": "Release to refresh",
  "อัปเดตตำแหน่งเรียบร้อย": "Location updated", "กำลังอ่าน GPS และอัปเดตตำแหน่ง...": "Reading GPS and updating location...",
  "PREFERENCES": "PREFERENCES", "MESSAGES": "MESSAGES", "DISCOVER MEMBERS": "DISCOVER MEMBERS",
  "BE PART OF THE BEGINNING": "BE PART OF THE BEGINNING", "YOUR PROFILE": "YOUR PROFILE",
  "ไม่ระบุ": "Prefer not to say", "ผอม": "Slim", "สมส่วน": "Average", "นักกีฬา": "Athletic",
  "มีกล้าม": "Muscular", "หุ่นใหญ่": "Stocky", "หาเพื่อน": "Friends", "พูดคุย": "Chat",
  "สบาย ๆ": "Casual", "เดต": "Dating", "จริงจัง": "Long-term", "เปิดใจ": "Open to all",
  "ซม.": "cm", "กม.": "km", "ดี": "Good", "พอใช้": "Fair", "คลาดเคลื่อนสูง": "Low accuracy",
  "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง": "This browser does not support geolocation",
  "กำลังขอตำแหน่งจากอุปกรณ์...": "Requesting your device location...",
  "บันทึกตำแหน่งไม่สำเร็จ กรุณาลองอีกครั้ง": "Could not save location. Please try again.",
  "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง": "Could not connect to server. Check your internet connection and try again.",
  "โหลดการตั้งค่า Nearby ไม่สำเร็จ": "Could not load Nearby settings",
  "กรุณาเข้าสู่ระบบอีกครั้ง": "Please sign in again",
  "อัปเดตตำแหน่งตอนนี้": "Update location now",
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);
export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}

function translateDocument(language: Language, originals: WeakMap<Text, string>) {
  if (typeof document === "undefined") return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (!parent || parent.closest("script,style,textarea,input,[contenteditable='true'],[data-no-translate]")) continue;
    if (!originals.has(textNode)) originals.set(textNode, textNode.nodeValue ?? "");
    const original = originals.get(textNode) ?? "";
    const trimmed = original.trim();
    if (!trimmed) continue;
    const translated = language === "en" ? (translations[trimmed] ?? trimmed) : original;
    if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
  }
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLElement>("[placeholder],[aria-label],[title]").forEach(element => {
    for (const attr of ["placeholder", "aria-label", "title"] as const) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const translated = language === "en" ? translations[value] : element.dataset["gmckOriginal" + attr];
      if (language === "en" && !element.dataset["gmckOriginal" + attr]) element.dataset["gmckOriginal" + attr] = value;
      if (translated && translated !== value) element.setAttribute(attr, translated);
      if (language === "th" && translated) element.setAttribute(attr, translated);
    }
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);
  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "th" || saved === "en") setLanguageState(saved);
  }, []);

  useEffect(() => {
    const originals = new WeakMap<Text, string>();
    const apply = () => translateDocument(language, originals);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
