import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileTabBar from "@/components/mobile-tab-bar";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "GMCK — Meet nearby, connect genuinely",
  description: "พื้นที่พบปะและทำความรู้จักสำหรับผู้ชายเกย์และไบเซ็กชวล",
  applicationName: "GMCK",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GMCK" },
  icons: { icon: "/gmck-icon.svg", shortcut: "/gmck-icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#09090f", width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}<MobileTabBar /><PwaRegister /></body></html>;
}
