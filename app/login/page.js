"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("activated") === "1") setActivated(true);
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Forkert e-mail eller adgangskode");
    } else {
      router.push("/");
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1A1718",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: "#2A2628",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        {activated && (
          <div style={{ background: "#1E7B5B22", border: "1px solid #1E7B5B55", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#1E7B5B", fontWeight: 600 }}>
            ✓ Konto aktiveret! Log ind med samme Google-konto for at fortsætte.
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#F8F5E6", letterSpacing: 1 }}>
            NORTH AVENUE
          </div>
          <div style={{ fontSize: 12, color: "#8B7E74", letterSpacing: 3, marginTop: 4 }}>
            BACKSTAGE
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              background: "#1A1718",
              border: "1px solid #3D3739",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#F8F5E6",
              fontSize: 14,
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Adgangskode"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              background: "#1A1718",
              border: "1px solid #3D3739",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#F8F5E6",
              fontSize: 14,
              outline: "none",
            }}
          />
          {error && (
            <div style={{ color: "#E05252", fontSize: 13, textAlign: "center" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#D4A843",
              color: "#1A1718",
              border: "none",
              borderRadius: 8,
              padding: "12px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#3D3739" }} />
          <span style={{ color: "#8B7E74", fontSize: 12 }}>eller</span>
          <div style={{ flex: 1, height: 1, background: "#3D3739" }} />
        </div>

        <button
          onClick={handleGoogle}
          style={{
            width: "100%",
            background: "#F8F5E6",
            color: "#1A1718",
            border: "none",
            borderRadius: 8,
            padding: "12px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Fortsæt med Google
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><LoginPage /></Suspense>;
}
