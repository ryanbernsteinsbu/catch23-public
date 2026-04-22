'use client';
import React, { useState } from "react";

interface RegisterProps {
  onCreateUserClick: () => void;
  onShowLogin: () => void;
}

export default function Register({ onCreateUserClick, onShowLogin }: RegisterProps) {
  const [email, setEmail] = useState<string>("");
  const [firstPassword, setFirstPassword] = useState<string>("");
  const [secondPassword, setSecondPassword] = useState<string>("");
  const [saveBanner, setSaveBanner] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string>("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const showBanner = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "") return showError("Email is required");
    if (firstPassword === "") return showError("Password is required");
    if (secondPassword === "") return showError("Re-type Password is required");
    if (firstPassword !== secondPassword) return showError("Passwords do not match, please try again");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return showError("Please enter a valid email address.");

    const emailSub = email.split("@")[0];
    const p = firstPassword.toLowerCase();
    if (p.includes(emailSub.toLowerCase())) return showError("Password cannot contain your email!");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: firstPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Registration failed");

      // Show the generated key to the user
      console.log(data);
      setGeneratedKey(data);
      setEmail("");
      setFirstPassword("");
      setSecondPassword("");
      showBanner();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "Email is connected to existing account") {
        showError("There's already an account associated with that email");
      } else {
        showError("Error creating user. Please try again later.");
      }
    }
  };

  return (
    <div id="login_setup">
      {saveBanner && (
        <div className="save-banner save-banner--visible" style={{ transform: "translateX(-50%) translateY(0)" }}>
          ✅ Account successfully created!
        </div>
      )}
      {errorBanner && (
        <div className="save-banner save-banner--visible" style={{ transform: "translateX(-50%) translateY(0)", background: "#BD2522" }}>
          ❌ {errorBanner}
        </div>
      )}

      {/* Show the generated key after registration */}
      {generatedKey && (
        <div className="key-display">
          <p>Your generated key:</p>
          <div className="key-value">
            {/* <strong>{generatedKey}</strong> */}
            <code>{generatedKey}</code>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(generatedKey)}>
              Copy
            </button>
          </div>
          <p className="key-warning">Save this somewhere safe!</p>
          <button className="continue-btn" onClick={onCreateUserClick}>Continue to Login →</button>
        </div>
      )}

      {!generatedKey && (
        <form id="login_form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <br /><br />
          <input
            type="password"
            value={firstPassword}
            placeholder="Password"
            onChange={(e) => setFirstPassword(e.target.value)}
          />
          <br /><br />
          <input
            type="password"
            value={secondPassword}
            placeholder="Re-Type Password"
            onChange={(e) => setSecondPassword(e.target.value)}
          />
          <br /><br />
          <button id="submit_login" type="submit">
            Generate Key
          </button>
          <button id="go_register" type="button" onClick={onShowLogin}>
            Sign In
          </button>
        </form>
      )}
    </div>
  );
}
