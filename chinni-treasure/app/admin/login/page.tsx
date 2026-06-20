"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch, ApiError } from "@/src/lib/api/client";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: { username: username.trim(), password },
      });
      window.location.href = "/admin";
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-title">
          <h1 className="login-heading">
            Admin Login
          </h1>
          <p className="login-subtitle">
            Chinni Treasure — <span className="brand-heart">❤</span> <span className="brand-tagline">Little Love</span> <span className="brand-heart">❤</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} aria-label="Admin login form">
          <div className="form-group">
            <label htmlFor="username" className="login-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="login-input-dark"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="login-input-dark"
            />
          </div>

          {error && (
            <div ref={errorRef} className="login-error" role="alert" tabIndex={-1} aria-live="assertive">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-tall"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-8">
                <span className="btn-spinner-inline"></span>
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
