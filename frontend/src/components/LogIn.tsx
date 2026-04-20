'use client';
import { useState } from "react";

interface LogInProps {
  onLoginSuccess: (token: string, userId: string) => void;
  onGoToRegister: () => void;
}

export default function LogIn({ onLoginSuccess, onGoToRegister }: LogInProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      onLoginSuccess(data.token, String(data.user_id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_setup">
      {error && (
        <div className="save-banner save-banner--visible" style={{ transform: "translateX(-50%) translateY(0)", background: "#BD2522" }}>
          ❌ {error}
        </div>
      )}
      <form id="login_form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />
        <button id="submit_login" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
        <button id="go_register" type="button" onClick={onGoToRegister}>
          Register
        </button>
      </form>
    </div>
  );
}