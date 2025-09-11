"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      setSuccess("Login successful!");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Sign In</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
          <button type="submit" style={{ width: "100%", padding: 10, cursor: "pointer" }}>Sign In</button>
      </form>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a href="/register">
            <button style={{ width: "100%", padding: 10, cursor: "pointer" }}>Not a member? Register</button>
          </a>
        </div>
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 12 }}>{success}</div>}
    </div>
  );
}
