"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const interestOptions = ["ออกกำลังกาย", "ท่องเที่ยว", "ดูหนัง/ซีรีส์", "เกม", "ดนตรี", "อาหาร", "ธรรมชาติ", "คาเฟ่", "เทคโนโลยี"];
const bodyOptions = [
  ["slim", "ผอม"], ["average", "สมส่วน"], ["athletic", "นักกีฬา"], ["muscular", "มีกล้าม"],
  ["stocky", "หุ่นใหญ่"], ["prefer_not_say", "ไม่ระบุ"],
];
const goalOptions = [
  ["friends", "หาเพื่อน"], ["chat", "พูดคุย"], ["casual", "ความสัมพันธ์แบบสบาย ๆ"],
  ["dating", "เดต"], ["long_term", "ความสัมพันธ์จริงจัง"], ["open_to_all", "ยังไม่แน่ใจ"],
];

type ExistingProfile = {
  nickname: string;
  birth_date: string;
  height_cm: number | null;
  body_type: string | null;
  interests: string[];
  relationship_goal: string | null;
  bio: string;
  avatar_path: string | null;
};

export default function ProfileForm({ userId, initialProfile }: { userId: string; initialProfile: ExistingProfile | null }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(initialProfile?.birth_date ?? "");
  const [height, setHeight] = useState(initialProfile?.height_cm?.toString() ?? "");
  const [bodyType, setBodyType] = useState(initialProfile?.body_type ?? "");
  const [interests, setInterests] = useState<string[]>(initialProfile?.interests ?? []);
  const [goal, setGoal] = useState(initialProfile?.relationship_goal ?? "");
  const [about, setAbout] = useState(initialProfile?.bio ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [avatarPath, setAvatarPath] = useState(initialProfile?.avatar_path ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadPhoto() {
      if (!avatarPath) { setPhotoPreview(""); return; }
      const { data } = await supabase.storage.from("profile-photos").createSignedUrl(avatarPath, 3600);
      if (active && data?.signedUrl) setPhotoPreview(data.signedUrl);
    }
    void loadPhoto();
    return () => { active = false; };
  }, [avatarPath, supabase]);

  function toggleInterest(value: string) {
    setInterests((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (nickname.trim().length < 2 || nickname.trim().length > 24) {
      setError("ชื่อเล่นต้องมีความยาว 2–24 ตัวอักษร");
      return;
    }
    if (!birthDate) { setError("กรุณาระบุวันเกิด"); return; }
    const birth = new Date(`${birthDate}T00:00:00`);
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (birth > cutoff) { setError("GMCK เปิดให้สมาชิกอายุ 18 ปีขึ้นไปเท่านั้น"); return; }
    if (about.length > 500) { setError("คำแนะนำตัวต้องไม่เกิน 500 ตัวอักษร"); return; }

    setSaving(true);
    try {
      let nextAvatarPath = avatarPath || null;
      if (photo) {
        const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, photo, {
          contentType: photo.type, upsert: false,
        });
        if (uploadError) throw uploadError;
        nextAvatarPath = path;
      }

      const { error: saveError } = await supabase.from("profiles").upsert({
        id: userId,
        nickname: nickname.trim(),
        birth_date: birthDate,
        height_cm: height ? Number(height) : null,
        body_type: bodyType || null,
        interests,
        relationship_goal: goal || null,
        bio: about.trim(),
        avatar_path: nextAvatarPath,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      setAvatarPath(nextAvatarPath ?? "");
      setPhoto(null);
      setMessage("บันทึกโปรไฟล์เรียบร้อยแล้ว กำลังไปหน้าแรก...");
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-6">
      <section className="panel p-5">
        <h2 className="text-base font-semibold">รูปโปรไฟล์</h2>
        <p className="mt-1 text-xs text-zinc-400">ใช้รูปที่เห็นใบหน้าหรือบุคลิกของคุณได้ชัดเจน ขนาดไม่เกิน 5 MB</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-2xl text-purple-200">
            {photoPreview ? <img src={photoPreview} alt="รูปโปรไฟล์" className="h-full w-full object-cover" /> : "G"}
          </div>
          <label className="cursor-pointer rounded-xl border border-purple-300/30 px-4 py-2.5 text-sm text-purple-200">
            เลือกรูปภาพ
            <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > 5 * 1024 * 1024) { setError("รูปภาพต้องมีขนาดไม่เกิน 5 MB"); return; }
              setPhoto(file);
              if (file) setPhotoPreview(URL.createObjectURL(file));
            }} />
          </label>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <div><h2 className="text-base font-semibold">ข้อมูลพื้นฐาน</h2><p className="mt-1 text-xs text-zinc-400">ชื่อเล่นจะแสดงแทนชื่อจริง</p></div>
        <label className="block text-sm">ชื่อเล่น <span className="text-purple-300">*</span>
          <input required minLength={2} maxLength={24} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ชื่อที่อยากให้คนอื่นเรียก" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-400" />
        </label>
        <label className="block text-sm">วันเกิด <span className="text-purple-300">*</span>
          <input required type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0,10)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-400" />
          <span className="mt-1 block text-xs text-zinc-500">ข้อมูลวันเกิดไม่แสดงบนโปรไฟล์สาธารณะ อายุจะคำนวณจากวันเกิด</span>
        </label>
        <label className="block text-sm">ส่วนสูง (ซม.) <span className="text-zinc-500">— ไม่บังคับ</span>
          <input type="number" min={120} max={230} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="เช่น 175" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-400" />
        </label>
        <div><p className="mb-2 text-sm">รูปร่าง <span className="text-zinc-500">— ไม่บังคับ</span></p><div className="flex flex-wrap gap-2">
          {bodyOptions.map(([value, label]) => <button type="button" key={value} onClick={() => setBodyType(bodyType === value ? "" : value)} className={`rounded-full border px-3 py-2 text-xs ${bodyType === value ? "border-purple-300 bg-purple-500/20 text-purple-100" : "border-white/10 text-zinc-300"}`}>{label}</button>)}
        </div></div>
      </section>

      <section className="panel space-y-4 p-5">
        <div><h2 className="text-base font-semibold">ความสนใจและเป้าหมาย</h2><p className="mt-1 text-xs text-zinc-400">เลือกเฉพาะข้อมูลที่คุณต้องการเปิดเผย</p></div>
        <div><p className="mb-2 text-sm">สิ่งที่สนใจ</p><div className="flex flex-wrap gap-2">
          {interestOptions.map((item) => <button type="button" key={item} onClick={() => toggleInterest(item)} className={`rounded-full border px-3 py-2 text-xs ${interests.includes(item) ? "border-purple-300 bg-purple-500/20 text-purple-100" : "border-white/10 text-zinc-300"}`}>{item}</button>)}
        </div></div>
        <label className="block text-sm">กำลังมองหาอะไร
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 outline-none focus:border-purple-400">
            <option value="">ยังไม่ระบุ</option>{goalOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-sm">แนะนำตัว <span className="text-zinc-500">— ไม่บังคับ</span>
          <textarea rows={4} maxLength={500} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="เล่าเกี่ยวกับตัวคุณในแบบที่สบายใจ..." className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-purple-400" />
          <span className="mt-1 block text-right text-xs text-zinc-500">{about.length}/500</span>
        </label>
      </section>

      <p className="text-xs leading-6 text-zinc-500">การระบุวันเกิดเป็นการยืนยันด้วยตนเองเท่านั้น ยังไม่ใช่การตรวจสอบอายุหรือยืนยันตัวตนโดยอิสระ GMCK จะต้องเพิ่มระบบตรวจสอบอายุก่อนเปิดให้บริการสาธารณะ</p>
      {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
      <button disabled={saving} type="submit" className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}</button>
    </form>
  );
}
