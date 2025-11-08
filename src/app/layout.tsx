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
      <body className={`${shareTechMono.className} antialiased`}>
        {/* ✅ Full height layout */}
        <div className="flex h-screen overflow-hidden">
          {/* ✅ Sidebar fixed on the left */}
          <aside className="w-64 fixed top-0 left-0 h-full bg-[#111]">
            <Sidebar />
          </aside>

          {/* ✅ Scrollable main content with padding for sidebar */}
          <main className="ml-64 flex-1 overflow-y-auto bg-[#0a0a0a]">
            {children}
          </main>
        </div>

        <ToastNotificationProvider />
      </body>
    </html>
  );
}
