'use client'
import { usePathname } from 'next/navigation'
import Navbar from "@/components/Navbar"

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
  )
}

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  if (isAdminRoute) {
    // Admin routes: no navbar or footer, just the content
    return <div style={{ width: "100%" }}>{children}</div>
  }

  // Regular routes: include navbar and footer
  return (
    <>
      <Navbar />
      <div style={{ flex: 1, width: "100%" }}>{children}</div>
      <Footer />
    </>
  )
}