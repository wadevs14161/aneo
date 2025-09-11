// Authentication-aware navbar component
'use client'
import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import CartIcon from './CartIcon';

export default function Navbar() {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <nav style={{ 
      width: "100%", 
      padding: "16px 20px", 
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #eee", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between" 
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href="/">
          <Image 
            src="/Aneo-logo.png" 
            alt="Aneo Logo" 
            width={120} 
            height={40} 
            style={{ cursor: "pointer" }} 
          />
        </Link>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link href="/about" style={{ 
          textDecoration: "none", 
          color: "#333", 
          fontSize: "16px",
          fontWeight: "500",
          cursor: "pointer"
        }}>
          About
        </Link>
        
        {loading ? (
          <div style={{ color: "#666" }}>Loading...</div>
        ) : isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <CartIcon />
            {profile?.full_name && (
              <span style={{ 
                color: "#333", 
                fontSize: "14px",
                fontWeight: "500"
              }}>
                Hi, {profile.full_name}
              </span>
            )}
            <button
              onClick={handleSignOut}
              style={{ 
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/login">
              <button style={{ 
                padding: "8px 16px",
                backgroundColor: "transparent",
                color: "#007bff",
                border: "1px solid #007bff",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}>
                Login
              </button>
            </Link>
            <Link href="/register">
              <button style={{ 
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "1px solid #007bff",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}>
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}