"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { Session } from "@/lib/types";

const DEMO_USERS = [
  { label: "Nusrat · Passenger", email: "nusrat@dhakapool.dev" },
  { label: "Rafiq · Passenger", email: "rafiq@dhakapool.dev" },
  { label: "Shirin · Passenger", email: "shirin@dhakapool.dev" },
  { label: "Jashim · Driver", email: "jashim@dhakapool.dev" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("nusrat@dhakapool.dev");
  const [password, setPassword] = useState("Demo123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch<Session>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
      });
      saveSession(response);
      router.replace(response.user.role === "DRIVER" ? "/driver" : "/passenger");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-copy">
          <a className="brand" href="/">Dhaka Tesla Pool</a>
          <h1>{mode === "login" ? "Start the demo" : "Create a passenger account"}</h1>
          <p>Use the seeded cast for the evaluation flow, or register a passenger account.</p>
          <div className="demo-grid">
            {DEMO_USERS.map((user) => (
              <button
                type="button"
                className="demo-user"
                key={user.email}
                onClick={() => {
                  setMode("login");
                  setEmail(user.email);
                  setPassword("Demo123!");
                }}
              >
                {user.label}
              </button>
            ))}
          </div>
          <p className="demo-password">Demo password: <code>Demo123!</code></p>
        </div>

        <form className="form-panel" onSubmit={submit}>
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Sign up</button>
          </div>
          {mode === "register" && (
            <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></label>
          )}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
          {error && <p className="error-banner">{error}</p>}
          <button className="button button-primary button-block" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}
