"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid credentials");
      }

      router.refresh();
      router.replace("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--black)",
        padding: "24px",
      }}
    >
      <div
        className="admin-login-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--near-black)",
          border: "1px solid rgba(212, 175, 55, 0.15)",
          borderRadius: "8px",
          padding: "48px 36px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.6rem",
              color: "var(--gold)",
              marginBottom: "8px",
            }}
          >
            Admin Login
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Chinni Treasure — <span className="brand-heart">❤</span> <span className="brand-tagline">Little Love</span> <span className="brand-heart">❤</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} aria-label="Admin login form">
          <div className="form-group">
            <label htmlFor="username" style={{ color: "var(--cream)" }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={{ background: "var(--dark-gray)", borderColor: "var(--charcoal)", color: "var(--cream)" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ color: "var(--cream)" }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ background: "var(--dark-gray)", borderColor: "var(--charcoal)", color: "var(--cream)" }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "rgba(231, 76, 60, 0.1)",
                color: "var(--error)",
                borderRadius: "4px",
                fontSize: "0.85rem",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", minHeight: "52px", position: "relative" }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(0,0,0,0.2)",
                    borderTopColor: "var(--black)",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                  }}
                ></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
