"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createUserProfile } from "@/lib/profileUtils";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    dateOfBirth: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the redirect URL from query params (where user came from)
  const redirectTo = searchParams?.get('redirectTo') || '/';

  const handleInputChange = (field: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }
    
    try {
      // Store redirect path for later use
      if (redirectTo !== '/') {
        sessionStorage.setItem('authRedirectTo', redirectTo);
      }
      
      // Sign up user with auth and metadata
      const { data, error } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone || null,
            date_of_birth: formData.dateOfBirth || null
          }
        }
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      if (data.user) {
        console.log('✅ User created:', data.user.id);
        
        // Wait a moment for the database trigger to create the profile
        console.log('⏱️ Waiting for database trigger to create profile...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify/ensure profile exists (database trigger should have created it)
        const profileSuccess = await createUserProfile({
          id: data.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone || undefined,
          date_of_birth: formData.dateOfBirth || undefined
        });
        
        if (profileSuccess) {
          console.log('✅ Profile verification/creation completed');
        } else {
          console.warn('⚠️ Profile verification failed - but registration succeeded');
        }
        
        // Proceed with registration success
        setRegistered(true);
        setSuccess("Account created successfully! Please check your email to verify your account.");
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push(redirectTo);
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("An unexpected error occurred. Please try again.");
    }
    
    setLoading(false);
  }

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: "40px auto", 
      padding: 32, 
      border: "1px solid #eee", 
      borderRadius: 12,
      backgroundColor: "white",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 24, color: "#333" }}>Create Your Account</h2>
      <form onSubmit={handleRegister}>
        {/* Full Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Full Name *
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Email Address *
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Date of Birth */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Date of Birth (Optional)
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange('dateOfBirth')}
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Password *
          </label>
          <input
            type="password"
            placeholder="Enter your password (min 6 characters)"
            value={formData.password}
            onChange={handleInputChange('password')}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: "500", color: "#555" }}>
            Confirm Password *
          </label>
          <input
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            required
            style={{ 
              width: "100%", 
              padding: "12px", 
              border: "1px solid #ddd", 
              borderRadius: "6px",
              fontSize: "14px"
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
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <a href={`/login${redirectTo !== '/' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}>
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
            Already have an account? Sign In
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
      
      {success && (
        <div style={{ 
          color: "#155724", 
          marginTop: 16, 
          padding: "12px",
          backgroundColor: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: "6px",
          fontSize: "14px"
        }}>
          {success}
        </div>
      )}
    </div>
  );
}
