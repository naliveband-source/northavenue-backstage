"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const T = {
  black: "#181719", dim: "#2A2628", border: "#3D3739",
  orange: "#D4622A", muted: "#8B7E74", white: "#F8F5E6",
  green: "#1E7B5B",
};

function SuccessContent() {
  const params = useSearchParams();
  const first = params.get("first") || "";

  return (
    <Page>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <NAStar />
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 36, color: T.white, lineHeight: 0.9, letterSpacing: "-0.01em" }}>
          NORTH<span style={{ color: T.orange }}>AVENUE</span>
        </div>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.18em", marginTop: 10, fontFamily: "'Poppins',sans-serif" }}>
          BACKSTAGE · AKTIVERING
        </div>
      </div>

      <Card>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 14, color: T.green }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Poppins',sans-serif", marginBottom: 10 }}>
            {first ? `Velkommen, ${first}!` : "Konto aktiveret!"}
          </div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Poppins',sans-serif", lineHeight: 1.7 }}>
            Din konto er klar. Log ind med den samme Google-konto for at komme i gang.
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          style={{ width: "100%", background: T.white, color: T.black, border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Poppins',sans-serif" }}>
          <GoogleIcon />
          Log ind med Google
        </button>
      </Card>
    </Page>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function Page({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 400 }}>{children}</div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: T.dim, borderRadius: 16, padding: "28px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      {children}
    </div>
  );
}

function NAStar() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" style={{ marginBottom: 10 }}>
      <polygon points="16,2 19,12 30,12 21,19 24,30 16,23 8,30 11,19 2,12 13,12" fill="#D4622A" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
