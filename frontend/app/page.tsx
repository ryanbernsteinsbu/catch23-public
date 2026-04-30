"use client";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import GetKey from "../src/components/GetKey";
import Doc from "../src/components/Doc";

interface DecodedToken {
  id?: number | string;
  [key: string]: unknown;
}

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [checkedAuth, setCheckedAuth] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const getToken = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    const storedEmail = localStorage.getItem("email");

    if(storedEmail) setEmail(storedEmail);

    if(getToken){
      setToken(getToken);
    }
    setIsLoggedIn(!!token && !!userId);
    setCheckedAuth(true);
  }, []);

  if (!checkedAuth) return null;

  return (
    <>
      {isLoggedIn ? (
        <div className="catch23">
          <Doc
            email={email}
            token={token}
            onLogout={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user_id");
              localStorage.removeItem("email");
              setIsLoggedIn(false);
              setEmail("");
            }}
          />
        </div>
      ) : (
        <GetKey
          onSuccess={(token: string) => {
            localStorage.setItem("token", token);
            try {
              const decoded = jwtDecode<DecodedToken>(token);
              if (decoded.id) {
                localStorage.setItem("user_id", String(decoded.id));
              }
              if(decoded.email) {
                localStorage.setItem("email", String(decoded.email));
                setEmail(String(decoded.email));
              }

              setIsLoggedIn(true);
            } catch (err) {
              console.error("Could not decode token:", err);
            }
          }}
        />
      )}
    </>
  );
}