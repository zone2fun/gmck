"use client";

import { useState } from "react";

export default function ProfilePhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minimumSwipe = 45;

  function goTo(index: number) {
    if (!photos.length) return;
    setActive((index + photos.length) % photos.length);
  }

  function finishSwipe() {
    if (touchStart !== null && touchEnd !== null) {
      const distance = touchStart - touchEnd;
      if (Math.abs(distance) > minimumSwipe) goTo(active + (distance > 0 ? 1 : -1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  }

  if (!photos.length) {
    return <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_35%,rgba(168,85,247,.45),transparent_55%),linear-gradient(145deg,#32104b,#100d18_70%)]"><span className="text-8xl font-black text-white/80">{name.slice(0,1)}</span></div>;
  }

  return (
    <div className="absolute inset-0 select-none" onTouchStart={event => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
      onTouchMove={event => setTouchEnd(event.changedTouches[0]?.clientX ?? null)} onTouchEnd={finishSwipe}>
      <img key={photos[active]} src={photos[active]} alt={"รูปที่ " + (active + 1) + " ของ " + name}
        draggable={false} className="h-full w-full object-cover object-center" />
      {photos.length > 1 && <>
        <button type="button" onClick={() => goTo(active - 1)} aria-label="รูปก่อนหน้า"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-2xl text-white backdrop-blur">‹</button>
        <button type="button" onClick={() => goTo(active + 1)} aria-label="รูปถัดไป"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-2xl text-white backdrop-blur">›</button>
        <span className="absolute right-4 top-16 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{active + 1}/{photos.length}</span>
        <div className="absolute inset-x-0 top-0 flex gap-1.5 px-4 pt-3">
          {photos.map((_, index) => <button key={index} type="button" onClick={() => goTo(index)} aria-label={"ดูรูปที่ " + (index + 1)}
            className={"h-1 flex-1 rounded-full " + (index === active ? "bg-white" : "bg-white/35")} />)}
        </div>
      </>}
    </div>
  );
}
