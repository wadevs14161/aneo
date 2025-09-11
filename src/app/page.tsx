import React from "react";
import Link from "next/link";

function TopRightButtons() {
  const buttonStyle: React.CSSProperties = {
    marginRight: 12,
    cursor: "pointer"
  };
  const buttonStyleNoMargin: React.CSSProperties = {
    cursor: "pointer"
  };
  return (
    <div style={{ position: "absolute", top: 24, right: 24 }}>
      <Link href="/login">
        <button style={buttonStyle}>Login</button>
      </Link>
      <Link href="/register">
        <button style={buttonStyleNoMargin}>Register</button>
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <TopRightButtons />
    </main>
  );
}
