"use client";

interface DocProps {
  onLogout: () => void;
}

export default function Doc({ onLogout }: DocProps) {
  return (
    <div>
      <h1>Welcome!</h1>
      <p>You are logged in. Your main app content goes here.</p>
      <button onClick={onLogout}>Log Out</button>
    </div>
  );
}