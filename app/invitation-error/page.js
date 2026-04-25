"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const T = { black: "#181719", dim: "#2A2628", border: "#3D3739", orange: "#D4622A", muted: "#8B7E74", white: "#F8F5E6", red: "#C04040" };

const MESSAGES = {
  used:        "Dette invitationslink er allerede brugt.",
  expired:     "Invitationslinket er udløbet.",
  notfound:    "Invitationslinket er ugyldigt eller findes ikke.",
  email_taken: "Den Google-konto du valgte er allerede tilknyttet en anden bruger. Prøv med en anden Google-konto.",
};

function InvitationError() {
  const params = useSearchParams();
  const reason = params.get("reason") || "notfound";
  const msg = MESSAGES[reason] || MESSAGES.notfound;

  return (
    <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ background: T.dim, borderRadius: 16, padding: "32px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 10, fontFamily: "'Poppins',sans-serif" }}>{msg}</div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'Poppins',sans-serif", marginBottom: 24 }}>Kontakt en administrator for hjælp.</div>
          <a href="/login" style={{ display: "inline-block", padding: "10px 24px", background: T.orange, color: "#F8F5E6", borderRadius: 8, fontWeight: 700, fontSize: 13, fontFamily: "'Poppins',sans-serif", textDecoration: "none" }}>
            Til login →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense><InvitationError /></Suspense>;
}
