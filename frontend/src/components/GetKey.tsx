'use client';
import React, { useState } from "react";
import LogIn from "./LogIn";
import Register from "./Register";
import Modal from "./Modal";

interface GetKeyProps {
  onSuccess: (token: string) => void;
}

export default function GetKey({ onSuccess }: GetKeyProps) {
  const [view, setView] = useState<"register" | "login">("register");

  return (
    <div className="landing">
      <h1 className="landing-title">Catch 23 API</h1>
      <Modal isOpen={true}>
        {view === "login" ? (
          <LogIn
            onLoginSuccess={(token: string, userId: string) => {
              localStorage.setItem("token", token);
              localStorage.setItem("user_id", userId);
              onSuccess(token);
            }}
            onGoToRegister={() => setView("register")}
          />
        ) : (
          <Register
            onCreateUserClick={() => setView("login")}
            onShowLogin={() => setView("login")}
          />
        )}
      </Modal>
    </div>
  );
}