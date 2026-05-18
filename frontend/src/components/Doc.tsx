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
  const [keyVisible, setKeyVisible] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/user/logged-in`, {
                headers: {
                    "x-token": token,
                    "x-email": email
                }
            });
            const data = await r.json();
            setApiKey(data.key);
            setUsage(data.usage);
        } catch {
            setApiKey("Could not load API key");
            setUsage(0);
        }
    };

    fetchUserInfo();
  }, []);


  const handleDelete = async() => {
    setDeleting(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/delete`, {
        method: "DELETE",
        headers: { "x-token": token, "x-email": email }
      })
      onLogout();
    } catch {
      alert("Failed to delete account.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const displayName = email.split("@")[0];
  const maskedKey = apiKey ? `••••••••••••${apiKey.slice(-4)}`: "Loading..."

  return (
    <div className="doc-page">
      <div className="doc-card">
        <h1 className="doc-greeting">Oh hello, {displayName}!</h1>
        <div>
          <p className="doc-section-label">API Key</p>
          <div className="doc-key-box">
            <code>{keyVisible ? apiKey : maskedKey}</code>
            <button className="copy-btn" onClick={() => setKeyVisible(v => !v)}>
              {keyVisible ? "Hide" : "Show"}
            </button>
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

        {!showDeleteConfirm ? (
          <button className="doc-logout" onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </button>
        ) : (
          <div className="doc-delete-confirm">
            <p>Are you sure? This cannot be undone.</p>
            <button className="copy-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button className="copy-btn" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}