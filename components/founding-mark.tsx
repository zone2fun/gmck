"use client";

type FounderRole = "founding_council" | "community_ambassador" | "founding_member";
const roleNames: Record<FounderRole, string> = {
  founding_council: "Founding Council",
  community_ambassador: "Community Ambassador",
  founding_member: "Founding Member",
};
export function FoundingNameMark({ founderNumber, founderRole }: { founderNumber: number; founderRole: FounderRole }) {
  const label = `${roleNames[founderRole]} · Founding Member #${String(founderNumber).padStart(3, "0")}`;
  return <span title={label} aria-label={label} className="mr-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-purple-200/60 bg-purple-500/20 align-middle text-[11px] leading-none text-purple-200 shadow-[0_0_12px_rgba(168,85,247,.25)]">♛</span>;
}
export function FoundingAvatarMark({ founderNumber, founderRole }: { founderNumber: number; founderRole: FounderRole }) {
  const label = `${roleNames[founderRole]} · #${String(founderNumber).padStart(3, "0")}`;
  return <span title={label} aria-label={label} className="absolute bottom-1 right-1 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-950 bg-gradient-to-br from-purple-400 to-fuchsia-600 text-sm text-white shadow-lg">♛</span>;
}
