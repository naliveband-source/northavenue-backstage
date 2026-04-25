"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const T = {
  black: "#181719", dim: "#2A2628", border: "#3D3739",
  orange: "#D4622A", muted: "#8B7E74", white: "#F8F5E6",
  red: "#C04040",
};

const MESSAGES = {
  notfound:     "Invitationslinket er ugyldigt eller eksisterer ikke.",
  expired:      "Invitationslinket er udløbet.",
  used:         "Dette invitationslink er allerede brugt.",
  email_taken:  "Den valgte Google-konto er allerede registreret hos en anden bruger.",
  google_taken: "Denne Google-konto er allerede tilknyttet en anden bruger.",
  server_error: "Der opstod en serverfejl. Prøv igen om lidt.",
};

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") || "notfound";
  const msg = MESSAGES[reason] || MESSAGES.notfound;

  return (
    <Page>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <NAStar />
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 36, color: T.white, lineHeight: 0.9, letterSpacing: "-0.01em" }}>
          NORTH<span style={{ color: T.orange }}>AVENUE</span>
        </div>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.18em", marginTop: 10, fontFamily: "'Poppins',sans-serif" }}>
          BACKSTAGE · INVITATION
        </div>
      </div>

      <Card>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 14 }}>⚠</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.white, fontFamily: "'Poppins',sans-serif", marginBottom: 10 }}>
            Aktivering mislykkedes
          </div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Poppins',sans-serif", lineHeight: 1.7 }}>
            {msg}
          </div>
        </div>

        <div style={{ fontSize: 12, color: T.muted, fontFamily: "'Poppins',sans-serif", textAlign: "center", marginTop: 8 }}>
          Kontakt en administrator for hjælp.
        </div>
      </Card>
    </Page>
  );
}

export default function InvitationErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
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
