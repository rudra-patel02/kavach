"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const register = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      alert("User Registered Successfully");

      router.push("/users");
    } catch {
      setMessage("Unable to connect to server");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        background: "#0f172a",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#1e293b",
          padding: 35,
          borderRadius: 15,
          color: "white",
        }}
      >
        <h1>Create Account</h1>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 20 }}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 15 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 15 }}
        />

        <button
          onClick={register}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 14,
            background: "#06b6d4",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Create User"}
        </button>

        <p style={{ color: "#ef4444", marginTop: 15 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
