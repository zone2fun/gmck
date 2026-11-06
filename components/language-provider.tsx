"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "th" | "en";
const STORAGE_KEY = "gmck_language";
const originalTextNodes = new WeakMap<Text, string>();
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

  "อีเมล": "Email", "รหัสผ่าน": "Password", "หรือใช้อีเมล": "Or continue with email",
  "อย่างน้อย 8 ตัวอักษร": "At least 8 characters", "สมัครสมาชิก": "Sign up", "เข้าสู่ระบบ": "Log in",
  "มีบัญชีอยู่แล้ว?": "Already have an account?", "ยังไม่มีบัญชี?": "Don't have an account?",
  "กำลังดำเนินการ...": "Processing...", "รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB": "JPG, PNG, or WebP up to 5 MB",
  "● เชื่อมต่อแบบเรียลไทม์": "● Connected in real time", "กำลังเชื่อมต่อ...": "Connecting...",
  "ขยายดูรูปภาพ": "View image", "รูปภาพที่ส่งในแชต": "Image sent in chat", "ส่ง": "Send",
  "กำลังส่งรูปภาพ...": "Sending image...", "รูปภาพ JPG, PNG หรือ WebP ไม่เกิน 5 MB": "JPG, PNG, or WebP images up to 5 MB",
  "ส่งคำขอแล้ว รออีกฝ่ายยอมรับก่อนจึงจะส่งข้อความเพิ่มเติมได้": "Request sent. Wait for the other person to accept before sending more messages.",
  "คำขอนี้ถูกปฏิเสธแล้ว": "This request was declined", "ปิด ✕": "Close ✕",
  "ส่งคำขอไม่สำเร็จ": "Could not send request", "ได้รับอนุญาตแล้ว": "Access granted",
  "ส่งคำขอแล้ว": "Request sent", "อนุมัติแล้ว": "Approved", "เพิกถอนสิทธิ์เข้าถึงอัลบั้มแล้ว": "Album access revoked",
  "ปฏิเสธคำขอแล้ว": "Request declined", "คำขอที่ส่งถึงคุณ": "Requests sent to you",
  "ปฏิเสธ": "Decline", "อนุมัติดูอัลบั้ม": "Approve album access", "ยกเลิกการเข้าถึงอัลบั้ม": "Revoke album access",
  "คำขอของคุณ": "Your requests", "ยกเลิก": "Cancel", "ขอดูอัลบั้ม": "Request album access",
  "เปิดอัลบั้ม": "Open album", "ต้องยอมรับคำขอข้อความก่อน จึงจะใช้ระบบอัลบั้มส่วนตัวได้": "You must accept the message request before using the private album feature.",
  "เพิกถอนสิทธิ์ดูอัลบั้มของสมาชิกคนนี้ใช่หรือไม่?": "Revoke this member's album access?",
  "เพิกถอนสิทธิ์ไม่สำเร็จ": "Could not revoke access", "เพิกถอนสิทธิ์แล้ว": "Access revoked",
  "＋ เพิ่มรูปภาพ": "＋ Add photos", "JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อรูป": "JPG, PNG, or WebP up to 5 MB per image",
  "ลบรูป": "Delete photo", "ยังไม่มีรูปในอัลบั้ม": "No photos in this album yet",
  "คำขอเข้าดูอัลบั้ม": "Album access requests", "ขอเข้าถึงอัลบั้ม": "Request access to album",
  "อนุมัติ": "Approve", "ไม่มีคำขอใหม่": "No new requests", "สมาชิกที่อนุมัติแล้ว": "Approved members",
  "เพิกถอนสิทธิ์": "Revoke access", "ยังไม่มีสมาชิกที่ได้รับอนุมัติ": "No members have been approved yet",
  "คุณได้รับข้อความใหม่": "You received a new message", "คุณได้รับคำขอข้อความใหม่": "You received a new message request",
  "คำขอข้อความของคุณได้รับการตอบรับ": "Your message request was accepted",
  "คำขอข้อความของคุณไม่ได้รับการตอบรับ": "Your message request was not accepted",
  "มีสมาชิกขอเข้าดูอัลบั้มส่วนตัว": "A member requested access to your private album",
  "คำขอเข้าดูอัลบั้มส่วนตัวได้รับอนุมัติ": "Your private album access request was approved",
  "สิทธิ์เข้าดูอัลบั้มส่วนตัวมีการเปลี่ยนแปลง": "Your private album access has changed",
  "มีกิจกรรมใหม่": "New activity",
  "เกี่ยวกับฉัน": "About me", "ความสนใจ": "Interests", "รูปโปรไฟล์": "Profile photo",
  "ออกกำลังกาย": "Fitness", "ท่องเที่ยว": "Travel", "ดูหนัง/ซีรีส์": "Movies / TV",
  "เกม": "Gaming", "ดนตรี": "Music", "อาหาร": "Food", "ธรรมชาติ": "Nature",
  "คาเฟ่": "Cafes", "เทคโนโลยี": "Technology", "ความสัมพันธ์แบบสบาย ๆ": "Casual",
  "ความสัมพันธ์จริงจัง": "Long-term relationship", "ยังไม่แน่ใจ": "Not sure yet",
  "ใช้รูปที่เห็นใบหน้าหรือบุคลิกของคุณได้ชัดเจน ขนาดไม่เกิน 5 MB": "Use a photo that clearly shows your face or personality, up to 5 MB.",
  "เลือกรูปภาพ": "Choose photo", "ข้อมูลพื้นฐาน": "Basic information",
  "ชื่อเล่นจะแสดงแทนชื่อจริง": "Your nickname will be shown instead of your real name",
  "ชื่อเล่น": "Nickname", "วันเกิด": "Date of birth",
  "ข้อมูลวันเกิดไม่แสดงบนโปรไฟล์สาธารณะ อายุจะคำนวณจากวันเกิด": "Your date of birth is private. Your age is calculated from it.",
  "ส่วนสูง (ซม.)": "Height (cm)", "— ไม่บังคับ": "— Optional",
  "รูปร่าง": "Body type", "ความสนใจและเป้าหมาย": "Interests and goals",
  "เลือกเฉพาะข้อมูลที่คุณต้องการเปิดเผย": "Choose only the information you want to share",
  "สิ่งที่สนใจ": "Interests", "กำลังมองหาอะไร": "What are you looking for?",
  "ยังไม่ระบุ": "Not specified", "แนะนำตัว": "About me",
  "การค้นพบโปรไฟล์": "Profile discoverability",
  "อนุญาตให้สมาชิกที่เข้าสู่ระบบค้นพบโปรไฟล์ของฉัน": "Allow signed-in members to discover my profile",
  "หากไม่เลือก โปรไฟล์ของคุณจะไม่ปรากฏในหน้าค้นหาสมาชิก การตั้งค่านี้ไม่เปิดเผยวันเกิด วันเกิดเต็ม หรือพิกัดตำแหน่ง": "If disabled, your profile won't appear in member search. This setting never reveals your full birth date or exact location.",
  "การระบุวันเกิดเป็นการยืนยันด้วยตนเองเท่านั้น ยังไม่ใช่การตรวจสอบอายุหรือยืนยันตัวตนโดยอิสระ GMCK จะต้องเพิ่มระบบตรวจสอบอายุก่อนเปิดให้บริการสาธารณะ": "Entering a birth date is self-declaration, not independent age or identity verification. GMCK must add age verification before public launch.",
  "30 ที่นั่ง": "30 seats", "70 ที่นั่ง": "70 seats", "200 ที่นั่ง": "200 seats", "300 ที่นั่ง": "300 seats",
  "ร่วมให้คำแนะนำ ทดสอบฟีเจอร์ และสะท้อนเสียงของสมาชิกต่อทีม GMCK": "Advise, test features, and represent member feedback to the GMCK team",
  "ช่วยแนะนำ GMCK ให้คนที่สนใจและร่วมสร้างชุมชนอย่างเป็นมิตร": "Introduce GMCK to others and help build a welcoming community",
  "เป็นสมาชิกกลุ่มแรก ทดลองใช้งาน และแบ่งปันความคิดเห็นเพื่อพัฒนาแอป": "Join the first members, test the app, and share feedback",
  "คุณเป็นหนึ่งในผู้ร่วมก่อตั้ง GMCK สถานะนี้ผูกกับบัญชีนี้ตลอดชีพและไม่สามารถโอนสิทธิ์ได้": "You are a GMCK Founding Member. This lifetime status is tied to this account and cannot be transferred.",
  "เลือกบทบาทที่คุณอยากร่วมสร้าง": "Choose how you'd like to contribute",
  "เลือกบทบาทนี้แล้ว": "Selected", "การสมัครจะยืนยันเมื่อระบบจัดสรรหมายเลขให้สำเร็จเท่านั้น หนึ่งบัญชีรับได้หนึ่งหมายเลข": "Your application is confirmed only after a number is assigned. Each account can claim one number.",
  "กำหนดรัศมีสมาชิกที่จะแสดงในหน้า Nearby": "Set the member radius shown on Nearby",
  "เมื่อเปิด Nearby ระบบจะอัปเดตตำแหน่งทุก 5 นาทีขณะเปิดหน้า Nearby เท่านั้น พิกัดเก็บเป็นส่วนตัวและหมดอายุภายใน 24 ชั่วโมง สมาชิกอื่นเห็นเพียงระยะทางโดยประมาณ": "When Nearby is enabled, your location updates every 5 minutes only while the page is open. Coordinates stay private and expire within 24 hours. Other members see only an approximate distance.",
  "GPS Accuracy: ประมาณ": "GPS accuracy: about", "เมตร": "meters", "บันทึกการตั้งค่าไม่สำเร็จ": "Could not save settings",
  "ปิด Nearby แล้ว และลบตำแหน่งที่บันทึกไว้": "Nearby turned off and saved location deleted",
  "ปิด Nearby แล้ว แต่ลบตำแหน่งไม่สำเร็จ กรุณาลองใหม่": "Nearby is off, but the saved location could not be deleted. Please try again.",
  "อัปเดตตำแหน่งเรียบร้อย ความแม่นยำประมาณ": "Location updated. Accuracy about",
  "เพิ่งอัปเดตตำแหน่งไป กรุณารออย่างน้อย 2 นาที": "Location was recently updated. Please wait at least 2 minutes.",
  "ยังไม่ได้รับอนุญาต Location ให้เว็บไซต์ GMCK": "GMCK has not been granted location permission",
  "อุปกรณ์ระบุตำแหน่งไม่ได้ในขณะนี้ กรุณาเปิด Location Services แล้วลองอีกครั้ง": "Your device can't determine your location. Enable Location Services and try again.",
  "ใช้เวลาระบุตำแหน่งนานเกินไป ลองอีกครั้งในที่โล่ง": "Location request timed out. Try again in an open area.",
  "ตำแหน่งคลาดเคลื่อนสูง": "Location accuracy is low",
  "ยังไม่มีสมาชิกในระยะนี้": "No members in this range",

  "เมนูหลัก": "Main navigation", "การแจ้งเตือน": "Notifications", "แจ้งเตือนกิจกรรมในบัญชีของคุณ": "Activity notifications for your account",
  "ยังไม่มีการแจ้งเตือน": "No notifications yet", "สร้างบัญชี GMCK": "Create your GMCK account",
  "ยินดีต้อนรับกลับ": "Welcome back", "เริ่มต้นทำความรู้จักผู้คนใหม่ ๆ อย่างเป็นส่วนตัว": "Start meeting new people privately",
  "เข้าสู่ระบบเพื่อใช้งานบัญชีของคุณ": "Log in to access your account",
  "กำลังเชื่อมต่อ Google...": "Connecting to Google...", "ดำเนินการต่อด้วย Google": "Continue with Google",
  "ไม่สามารถเข้าสู่ระบบด้วย Google ได้": "Unable to sign in with Google",
  "สมัครสมาชิกเรียบร้อยแล้ว กรุณาเปิดอีเมลเพื่อกดยืนยันบัญชีก่อนเข้าสู่ระบบ": "Registration successful. Please confirm your account using the link sent to your email.",
  "เกิดข้อผิดพลาด กรุณาลองใหม่": "Something went wrong. Please try again.",
  "กำลังพิมพ์...": "Typing...", "อยู่ในห้องแชต": "In chat",
  "กำลังโหลดรูปภาพ...": "Loading image...", "สมาชิกส่งคำขอข้อความถึงคุณ คุณสามารถยอมรับเพื่อเริ่มสนทนา หรือปฏิเสธได้": "This member sent you a message request. Accept to start chatting or decline the request.",
  "ยอมรับคำขอ": "Accept request", "ดำเนินการไม่สำเร็จ กรุณาลองใหม่": "Action failed. Please try again.",
  "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่": "Image upload failed. Please try again.",
  "ส่งรูปภาพไม่สำเร็จ กรุณาลองใหม่": "Could not send image. Please try again.",
  "ส่งข้อความไม่สำเร็จ กรุณาลองใหม่": "Could not send message. Please try again.",
  "แนบรูปภาพ": "Attach image", "พิมพ์ข้อความ...": "Type a message...",
  "ดูรูปภาพขนาดใหญ่": "View full-size image", "ได้รับอนุมัติ": "Approved",
  "รออนุมัติ": "Pending approval", "ยกเลิกแล้ว": "Cancelled", "ยังไม่มีคำขอ": "No requests yet",
  "ต้องยอมรับคำขอข้อความก่อนจึงจะขออัลบั้มได้": "Accept the message request before requesting album access.",
  "ดำเนินการไม่สำเร็จ": "Action failed", "ยกเลิกคำขอไม่สำเร็จ": "Could not cancel request",
  "ยกเลิกคำขอแล้ว": "Request cancelled", "รูปในอัลบั้มนี้เป็นส่วนตัว คนอื่นจะดูได้เฉพาะเมื่อคุณอนุมัติเท่านั้น": "Photos in this album are private. Others can view them only after you approve access.",
  "กรุณาเข้าสู่ระบบใหม่": "Please sign in again", "อัปโหลดไม่สำเร็จ": "Upload failed",
  "บันทึกรูปไม่สำเร็จ": "Could not save photo", "เพิ่มรูปในอัลบั้มแล้ว": "Photo added to album",
  "ลบรูปนี้ออกจากอัลบั้มใช่หรือไม่?": "Delete this photo from the album?",
  "ลบรูปไม่สำเร็จ": "Could not delete photo", "ลบไฟล์แล้ว แต่ไม่สามารถอัปเดตรายการได้": "File deleted, but the list could not be updated",
  "ลบรูปแล้ว": "Photo deleted", "อนุมัติให้ดูอัลบั้มแล้ว": "Album access approved",
  "← กลับไปค้นหา": "← Back to Discover", "ส่งข้อความแรกได้ 1 ข้อความ สมาชิกอีกฝ่ายต้องยอมรับคำขอก่อนจึงจะสนทนาต่อได้": "You can send one introductory message. The other member must accept before you can continue chatting.",
  "จัดการรูปภาพและเลือกสมาชิกที่สามารถเข้าดูอัลบั้มของคุณได้": "Manage photos and choose who can view your album",
  "สมัคร Founding 300 เรียบร้อยแล้ว": "Successfully joined Founding 300",
  "เต็มแล้ว": "Full", "กำลังยืนยันสิทธิ์...": "Confirming your membership...",
  "ชื่อเล่นต้องมีความยาว 2–24 ตัวอักษร": "Nickname must be 2–24 characters",
  "กรุณาระบุวันเกิด": "Please enter your date of birth",
  "GMCK เปิดให้สมาชิกอายุ 18 ปีขึ้นไปเท่านั้น": "GMCK is for members aged 18 and over only",
  "คำแนะนำตัวต้องไม่เกิน 500 ตัวอักษร": "Your bio must be 500 characters or fewer",
  "บันทึกโปรไฟล์เรียบร้อยแล้ว กำลังไปหน้าแรก...": "Profile saved. Redirecting to home...",
  "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง": "Could not save. Please try again",
  "รูปภาพต้องมีขนาดไม่เกิน 5 MB": "Image must be 5 MB or smaller",
  "บันทึกโปรไฟล์": "Save profile", "ชื่อที่อยากให้คนอื่นเรียก": "The name you'd like others to use",
  "เช่น 175": "e.g. 175", "เล่าเกี่ยวกับตัวคุณในแบบที่สบายใจ...": "Tell others about yourself...",
  "เลือกบทบาทที่คุณอยากร่วมสร้าง": "Choose how you'd like to contribute",
  "ข้อมูลพื้นฐาน": "Basic information", "กำลังบันทึก...": "Saving...",
  "สมาชิกใกล้ฉัน": "Nearby members", "สมาชิกใกล้คุณ": "Members near you",
  "ตำแหน่งคลาดเคลื่อนสูง (": "Location accuracy is low (",
  "เมตร) ระบบจึงไม่บันทึกพิกัดใหม่นี้ เพื่อป้องกันตำแหน่งผิดพลาด กรุณาเปิด Precise Location หรือทดลองกลางแจ้ง": " meters). This location was not saved to avoid inaccurate results. Enable Precise Location or try outdoors.",

  "เลือกภาษาไทยหรือ English สำหรับทั้งแอป": "Choose Thai or English for the entire app",
  "เหลือ": "Remaining", "คน": "members", "ยินดีต้อนรับ": "Welcome",
  "สถานะ": "Status", "รูปภาพ": "Photos", "บันทึก": "Save",
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
    const apply = () => translateDocument(language, originalTextNodes);
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
