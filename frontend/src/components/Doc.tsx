"use client";
import { useEffect, useState } from "react";

interface DocProps {
  email: string;
  token: string;
  onLogout: () => void;
}

export default function Doc({ email, token, onLogout }: DocProps) {
  const [usage, setUsage] = useState<number | null> (null);
  const [apiKey, setApiKey] = useState<string | null> (null);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/user-info/${encodeURIComponent(email)}`, {
      headers: { Authorization:  `Bearer ${token}`},
    })
      .then((r) => r.json())
      .then((data) => {setApiKey(data.key); setUsage(data.usage);})
      .catch(() => {setApiKey("Cannot find API key"), setUsage(0)});
  }, [apiKey]);

  const displayName = email.split("@")[0];

  return (
    <div className="doc-page">
      <div className="doc-card">
        <h1 className="doc-greeting">Oh hello, {displayName}!</h1>
        <div>
          <p className="doc-section-label">API Key</p>
          <div className="doc-key-box">
            <code>{apiKey ?? "Loading..."}</code>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(apiKey ?? "")}>
              Copy
            </button>
          </div>
        </div>

        <div>
          <p className="doc-section-label">Usage</p>
          <p className="doc-usage">{usage ?? "-"} requests</p>
        </div>

        <button className="doc-logout" onClick={onLogout}>Log Out</button>
      </div>
    </div>
  );
}