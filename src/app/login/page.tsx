"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the redirect URL from query params (where user came from)
  const redirectTo = searchParams?.get('redirectTo') || '/';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Store redirect path for later use
    if (redirectTo !== '/') {
      sessionStorage.setItem('authRedirectTo', redirectTo);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Redirect back to where user came from
      router.push(redirectTo);
      return;
    }
    
    setLoading(false);
  }

  return (
    <div style={{ 
      maxWidth: 450, 
      margin: "40px auto", 
      padding: 32, 
      border: "1px solid #eee", 
      borderRadius: 12,
      backgroundColor: "white",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#333" }}>Welcome Back</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px",
              color: "#333",
              backgroundColor: "#fff"
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px",
              color: "#333",
              backgroundColor: "#fff"
            }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "14px", 
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "500"
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a href={`/register${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}>
          <button style={{ 
            width: "100%", 
            padding: "12px", 
            cursor: "pointer",
            backgroundColor: "transparent",
            color: "#007bff",
            border: "1px solid #007bff",
            borderRadius: "6px",
            fontSize: "14px"
          }}>
            Don't have an account? Create one
          </button>
        </a>
      </div>
      
      {error && (
        <div style={{ 
          color: "#dc3545", 
          marginTop: 16, 
          padding: "12px",
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "6px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <div style={{ 
      maxWidth: 450, 
      margin: "40px auto", 
      padding: 32, 
      border: "1px solid #eee", 
      borderRadius: 12,
      backgroundColor: "white",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      textAlign: "center"
    }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p style={{ marginTop: 16, color: "#666" }}>Loading...</p>
    </div>
  );
}

// Main export with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
