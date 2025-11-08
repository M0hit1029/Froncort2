import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { Share_Tech_Mono } from "next/font/google";
import { ToastNotificationProvider } from "@/components/ToastNotificationProvider";

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Froncort - Project Management",
  description: "Project management with Kanban, Documents, and Activity Feed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ✅ Apply the font here */}
      <body className={`${shareTechMono.className} antialiased`}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
        <ToastNotificationProvider />
      </body>
    </html>
  );
}
