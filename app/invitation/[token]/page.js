"use client";
import { use, useState, useEffect } from "react";
import { signIn } from "next-auth/react";

const T = {
  black: "#181719", dim: "#2A2628", border: "#3D3739",
  orange: "#D4622A", muted: "#8B7E74", white: "#F8F5E6",
  green: "#1E7B5B", red: "#C04040", subText: "#B0A8A4",
};

const ROLE_LABELS = { admin: "Administrator", musician: "Musiker" };

export default function InvitationPage({ params }) {
  const { token } = use(params);
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState(null); // null | "password"
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations?token=${token}`)
      .then(r => r.json())
      .then(data => { setInvitation(data); setLoading(false); });
  }, [token]);

  async function activateAndSignIn(chosenMethod) {
    setWorking(true);
    setError("");

    if (chosenMethod === "password") {
      if (password.length < 6) { setError("Adgangskode skal være mindst 6 tegn"); setWorking(false); return; }
      if (password !== confirmPw) { setError("Adgangskoderne matcher ikke"); setWorking(false); return; }
    }

    const res = await fetch("/api/invitations/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, method: chosenMethod, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Noget gik galt"); setWorking(false); return; }

    setDone(true);
    if (chosenMethod === "google") {
      await signIn("google", { callbackUrl: "/" });
    } else {
      await signIn("credentials", { email: invitation.email, password, callbackUrl: "/" });
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <Page>
      <div style={{ textAlign: "center", color: T.muted, fontFamily: "'Poppins',sans-serif", fontSize: 13 }}>
        Verificerer invitation...
      </div>
    </Page>
  );

  // ── Invalid ──────────────────────────────────────────────────────────────
  if (!invitation?.valid) {
    const reason = invitation?.reason;
    const msg = reason === "expired"
      ? "Invitationslinket er udløbet."
      : reason === "used"
        ? "Dette link er allerede brugt."
        : "Invitationslinket er ugyldigt.";
    return (
      <Page>
        <Card>
          <div style={{ fontSize: 22, color: T.red, fontWeight: 800, marginBottom: 10 }}>⚠</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 8 }}>{msg}</div>
          <div style={{ fontSize: 13, color: T.muted }}>Kontakt en administrator for at få et nyt link.</div>
        </Card>
      </Page>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (done) return (
    <Page>
      <Card>
        <div style={{ fontSize: 24, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>Konto aktiveret!</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>Logger ind...</div>
      </Card>
    </Page>
  );

  // ── Valid: welcome ───────────────────────────────────────────────────────
  return (
    <Page>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <NAStar />
        <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 36, color: T.white, lineHeight: 0.9, letterSpacing: "-0.01em" }}>
          NORTH<span style={{ color: T.orange }}>AVENUE</span>
        </div>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.18em", marginTop: 10 }}>BACKSTAGE · INVITATION</div>
      </div>

      <Card>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: "'Poppins',sans-serif" }}>
            Hej, {invitation.firstName}!
          </div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 6, fontFamily: "'Poppins',sans-serif", lineHeight: 1.6 }}>
            Du er inviteret som <strong style={{ color: T.orange }}>{ROLE_LABELS[invitation.role] || invitation.role}</strong> i North Avenue Backstage.
            Vælg hvordan du vil logge ind.
          </div>
        </div>

        {method !== "password" && (
          <>
            <button onClick={() => activateAndSignIn("google")} disabled={working}
              style={{ width: "100%", background: T.white, color: T.black, border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: working ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, opacity: working ? 0.7 : 1, fontFamily: "'Poppins',sans-serif" }}>
              <GoogleIcon />
              {working ? "Arbejder..." : "Log ind med Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ color: T.muted, fontSize: 12, fontFamily: "'Poppins',sans-serif" }}>eller</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <button onClick={() => setMethod("password")} disabled={working}
              style={{ width: "100%", background: "transparent", color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>
              Opret med email + adgangskode
            </button>
          </>
        )}

        {method === "password" && (
          <form onSubmit={e => { e.preventDefault(); activateAndSignIn("password"); }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>EMAIL</label>
              <input value={invitation.email} readOnly
                style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, background: T.black, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, boxSizing: "border-box", fontFamily: "'Poppins',sans-serif", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>ADGANGSKODE</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mindst 6 tegn"
                style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, background: T.black, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, boxSizing: "border-box", fontFamily: "'Poppins',sans-serif", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>BEKRÆFT ADGANGSKODE</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Gentag adgangskode"
                style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, background: T.black, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, boxSizing: "border-box", fontFamily: "'Poppins',sans-serif", outline: "none" }} />
            </div>
            {error && <div style={{ color: T.red, fontSize: 12, fontFamily: "'Poppins',sans-serif" }}>{error}</div>}
            <button type="submit" disabled={working}
              style={{ background: T.orange, color: "#F8F5E6", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: working ? "not-allowed" : "pointer", marginTop: 4, opacity: working ? 0.7 : 1, fontFamily: "'Poppins',sans-serif" }}>
              {working ? "Opretter konto..." : "Opret konto →"}
            </button>
            <button type="button" onClick={() => { setMethod(null); setError(""); }}
              style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Poppins',sans-serif", padding: "4px" }}>
              ← Tilbage
            </button>
          </form>
        )}

        {error && method !== "password" && (
          <div style={{ color: T.red, fontSize: 12, fontFamily: "'Poppins',sans-serif", marginTop: 10 }}>{error}</div>
        )}
      </Card>
    </Page>
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
    <div style={{ background: T.dim, borderRadius: 16, padding: "28px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
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
