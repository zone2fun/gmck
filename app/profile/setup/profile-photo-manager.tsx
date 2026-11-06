"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Photo = { id: string; path: string; position: number; url: string };

export default function ProfilePhotoManager({
  userId,
  initialPhotos,
  onPrimaryChange,
}: {
  userId: string;
  initialPhotos: { id: string; path: string; position: number }[];
  onPrimaryChange: (path: string | null) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = [...initialPhotos].sort((a, b) => a.position - b.position);
      const resolved = await Promise.all(rows.map(async (row) => {
        const { data } = await supabase.storage.from("profile-photos").createSignedUrl(row.path, 3600);
        return data?.signedUrl ? { ...row, url: data.signedUrl } : null;
      }));
      if (!active) return;
      const valid = resolved.filter((item): item is Photo => !!item);
      setPhotos(valid);
      onPrimaryChange(valid[0]?.path ?? null);
    })();
    return () => { active = false; };
  }, [initialPhotos, onPrimaryChange, supabase]);

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError("");
    setNotice("");
    const files = Array.from(fileList);
    if (photos.length + files.length > 6) {
      setError("เพิ่มรูปได้สูงสุด 6 รูป กรุณาเลือกไม่เกิน " + (6 - photos.length) + " รูป");
      return;
    }
    const invalid = files.find(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setError("รองรับ JPG, PNG หรือ WebP และแต่ละรูปต้องไม่เกิน 5 MB");
      return;
    }

    setBusy(true);
    const added: Photo[] = [];
    try {
      for (const file of files) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = userId + "/" + crypto.randomUUID() + "." + extension;
        const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const usedPositions = new Set([...photos, ...added].map(item => item.position));
        const position = [0, 1, 2, 3, 4, 5].find(value => !usedPositions.has(value));
        if (position === undefined) throw new Error("เพิ่มรูปได้สูงสุด 6 รูป");
        const { data: row, error: insertError } = await supabase.from("profile_photos")
          .insert({ user_id: userId, path, position })
          .select("id,path,position")
          .single();
        if (insertError) {
          await supabase.storage.from("profile-photos").remove([path]);
          throw insertError;
        }
        const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 3600);
        if (signed?.signedUrl) added.push({ ...row, url: signed.signedUrl });
      }
      const next = [...photos, ...added].sort((a, b) => a.position - b.position);
      setPhotos(next);
      const primary = next[0]?.path ?? null;
      onPrimaryChange(primary);
      const { error: profileError } = await supabase.from("profiles").update({ avatar_path: primary }).eq("id", userId);
      if (profileError) throw profileError;
      setNotice("เพิ่มรูปภาพเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photo: Photo) {
    if (!window.confirm("ต้องการลบรูปนี้ใช่หรือไม่?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: rowError } = await supabase.from("profile_photos").delete().eq("id", photo.id).eq("user_id", userId);
      if (rowError) throw rowError;
      const { error: fileError } = await supabase.storage.from("profile-photos").remove([photo.path]);
      if (fileError) throw fileError;
      const next = photos.filter(item => item.id !== photo.id);
      setPhotos(next);
      const primary = next[0]?.path ?? null;
      onPrimaryChange(primary);
      const { error: profileError } = await supabase.from("profiles").update({ avatar_path: primary }).eq("id", userId);
      if (profileError) throw profileError;
      setNotice("ลบรูปภาพเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">รูปโปรไฟล์</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-400">เพิ่มได้สูงสุด 6 รูป รูปแรกจะแสดงเป็นรูปหลัก สมาชิกสามารถปัดดูรูปอื่นในหน้าโปรไฟล์ได้</p>
        </div>
        <span className="shrink-0 rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">{photos.length}/6</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img src={photo.url} alt={"รูปโปรไฟล์ " + (index + 1)} className="h-full w-full object-cover" />
            {index === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-fuchsia-600 px-2 py-1 text-[9px] font-bold text-white">รูปหลัก</span>}
            <button type="button" disabled={busy} onClick={() => void removePhoto(photo)} aria-label="ลบรูปภาพ"
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white disabled:opacity-50">×</button>
          </div>
        ))}
        {photos.length < 6 && (
          <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-purple-300/35 bg-purple-500/[.06] text-center text-purple-200 hover:bg-purple-500/10">
            <span className="text-3xl leading-none">＋</span>
            <span className="mt-2 text-xs font-semibold">เพิ่มรูป</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={busy}
              onChange={(event) => { void addFiles(event.target.files); event.currentTarget.value = ""; }} />
          </label>
        )}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB ต่อรูป</p>
      {busy && <p role="status" className="mt-3 text-xs text-purple-200">กำลังจัดการรูปภาพ...</p>}
      {notice && <p role="status" className="mt-3 text-xs text-emerald-300">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
    </section>
  );
}
