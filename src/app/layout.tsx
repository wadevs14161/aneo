import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aneo",
  description: "A modern platform for learning and collaboration",
};

import Navbar from "@/components/Navbar";
import AppProvider from "@/components/AppProvider";
// import DatabaseDebug from "@/components/DatabaseDebug"; // 🧪 Debug panel - uncomment when needed

function Footer() {
  return (
    <footer style={{ width: "100%", padding: "16px 0", borderTop: "1px solid #eee", textAlign: "center", marginTop: "auto" }}>
      <span style={{ color: "#888" }}>© {new Date().getFullYear()} Aneo. All rights reserved.</span>
      <div style={{ marginTop: 8, fontSize: 14 }}>
        <a href="/legal/terms" style={{ margin: "0 8px", color: "#555" }}>Terms</a>
        <a href="/legal/privacy" style={{ margin: "0 8px", color: "#555" }}>Privacy</a>
        <a href="/legal/refund" style={{ margin: "0 8px", color: "#555" }}>Refund</a>
        <a href="/legal/faqs" style={{ margin: "0 8px", color: "#555" }}>FAQs</a>
        <a href="/legal/customer-agreement" style={{ margin: "0 8px", color: "#555" }}>Customer Agreement</a>
        <a href="/legal/service-delivery-policy" style={{ margin: "0 8px", color: "#555" }}>Service Delivery Policy</a>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <AppProvider>
          <Navbar />
          <div style={{ flex: 1, width: "100%" }}>{children}</div>
          <Footer />
          {/* <DatabaseDebug /> */} {/* 🧪 Debug panel - uncomment when needed */}
        </AppProvider>
      </body>
    </html>
  );
}
