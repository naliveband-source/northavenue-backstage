"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const NA = {
  black:   "#181719",
  white:   "#F8F5E6",
  cream:   "#F8F5E6",
  muted:   "#B0A8A4",
  subText: "#7A7470",
  amber:   "#D4A843",
  orange:  "#D4622A",
  green:   "#1E7B5B",
  purple:  "#8B3FA8",
  red:     "#C04A3A",
};

function Field({ label, value, onChange, type = "text", placeholder, autoFocus }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <div style={{
        fontSize: 9, color: focus ? NA.orange : "#7A6B5C",
        letterSpacing: "0.18em", fontFamily: "'Poppins',sans-serif",
        fontWeight: 700, marginBottom: 6, transition: "color .2s",
      }}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        autoFocus={autoFocus}
        required
        style={{
          width: "100%", boxSizing: "border-box",
          background: "transparent", border: "none",
          borderBottom: `1px solid ${focus ? NA.orange : "#C8C0A8"}`,
          padding: "10px 0", color: NA.black,
          fontSize: 15, fontFamily: "'Poppins',sans-serif",
          fontWeight: 500, outline: "none", transition: "border-color .25s",
        }}
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

function LoginPage() {
  const [email, setEmail]           = useState("");
  const [pw, setPw]                 = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [hover, setHover]           = useState(false);
  const [activated, setActivated]   = useState(false);
  const [selfDeleted, setSelfDeleted] = useState(false);
  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("activated") === "1") setActivated(true);
    if (searchParams.get("reason") === "self_deleted") setSelfDeleted(true);
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password: pw, redirect: false });
      if (res?.error) {
        setError("Forkert e-mail eller adgangskode.");
      } else {
        router.push("/");
      }
    } catch {
      setError("Noget gik galt. Prøv igen.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    signIn("google", { callbackUrl: "/" });
  }

  return (
    <main className="na-login-main" style={{
      minHeight: "100vh", background: NA.black, color: NA.white,
      fontFamily: "'Poppins',sans-serif", display: "flex",
    }}>

      {/* ── LEFT — dark editorial panel ── */}
      <section className="na-login-left" style={{
        position: "relative", flex: "1 1 55%",
        padding: "40px 44px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden", minHeight: "100vh",
      }}>
        {/* Northern Light orbs */}
        <div aria-hidden="true" style={{
          position: "absolute", top: -120, left: -120, width: 480, height: 480,
          borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none",
          background: `radial-gradient(circle, ${NA.purple}55 0%, transparent 70%)`,
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", top: 80, right: -160, width: 420, height: 420,
          borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none",
          background: `radial-gradient(circle, ${NA.green}40 0%, transparent 70%)`,
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", bottom: -160, left: 80, width: 520, height: 520,
          borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none",
          background: `radial-gradient(circle, ${NA.amber}30 0%, transparent 70%)`,
        }} />

        {/* Header lockup */}
        <header style={{
          position: "relative", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Symbol placeholder — replace div with:
                <Image src="/brand/NA_symbol.png" alt="" width={44} height={44} priority />
                once /public/brand/NA_symbol.png is added */}
            <div style={{
              width: 44, height: 44, background: NA.orange, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: NA.white,
              letterSpacing: "-0.04em", fontFamily: "'Poppins',sans-serif",
            }}>NA</div>
            <div>
              <div style={{
                fontSize: 11, letterSpacing: "0.28em", color: NA.white,
                fontWeight: 700, lineHeight: 1.1,
              }}>NORTH AVENUE</div>
              <div style={{
                fontSize: 9, letterSpacing: "0.32em", color: NA.orange,
                fontWeight: 700, marginTop: 3,
              }}>BACKSTAGE</div>
            </div>
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.32em", color: NA.muted, fontWeight: 600 }}>
            2026
          </div>
        </header>

        {/* Editorial statement */}
        <div style={{ position: "relative" }}>
          <div style={{
            fontSize: 9, letterSpacing: "0.32em", color: NA.amber,
            fontWeight: 700, marginBottom: 18,
          }}>DANMARKS ULTIMATIVE FESTBAND</div>
          <h1 style={{
            fontFamily: "'Trirong',serif", fontWeight: 400,
            fontSize: "clamp(40px, 5vw, 62px)", lineHeight: 1.0,
            color: NA.white, letterSpacing: "-0.02em", maxWidth: 540, margin: 0,
          }}>
            Hvor{" "}
            <em style={{ fontStyle: "italic", color: NA.amber }}>scenelyset</em>
            <br />
            møder <em style={{ fontStyle: "italic" }}>backstage</em>.
          </h1>
          <p style={{ marginTop: 22, fontSize: 14, color: NA.muted, maxWidth: 440, lineHeight: 1.6 }}>
            Internt system for musikere, vikarer og alias.<br />
            Jobs · Lønoversigt · Booking · Alias.
          </p>
        </div>

        <div /> {/* flex spacer */}
      </section>

      {/* ── RIGHT — cream form panel ── */}
      <section className="na-login-right" style={{
        flex: "0 0 440px", background: NA.cream, color: NA.black,
        padding: "56px 52px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 9, color: NA.orange, letterSpacing: "0.32em",
            fontWeight: 700, marginBottom: 14,
          }}>LOG IND</div>
          <h2 style={{
            fontFamily: "'Trirong',serif", fontSize: 42, fontWeight: 500,
            color: NA.black, lineHeight: 1.05, letterSpacing: "-0.01em", margin: 0,
          }}>Backstage</h2>
          <p style={{ fontSize: 13, color: "#5A4A40", marginTop: 10, lineHeight: 1.55 }}>
            Login for at se jobs, løn, alias og bookinger.
          </p>
        </div>

        {activated && (
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: `${NA.green}18`, border: `1px solid ${NA.green}55`,
            fontSize: 12, color: NA.green, fontWeight: 600,
          }}>
            ✓ Konto aktiveret! Log ind med din Google-konto for at fortsætte.
          </div>
        )}
        {selfDeleted && (
          <div style={{
            marginBottom: 20, fontSize: 12, color: NA.subText, textAlign: "center",
          }}>
            Din profil er arkiveret.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Field label="E-MAIL" type="email" value={email} onChange={setEmail}
            placeholder="navn@na.dk" autoFocus={true} />
          <Field label="ADGANGSKODE" type="password" value={pw} onChange={setPw}
            placeholder="••••••••" />

          {error && (
            <div role="alert" style={{
              fontSize: 11, color: NA.red, letterSpacing: "0.06em", fontWeight: 600,
              padding: "6px 10px", background: `${NA.red}14`,
              borderLeft: `2px solid ${NA.red}`,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              marginTop: 6, padding: "15px",
              background: hover && !loading ? NA.orange : NA.black,
              color: NA.cream, border: "none",
              fontFamily: "'Poppins',sans-serif",
              fontWeight: 700, fontSize: 11, letterSpacing: "0.22em",
              cursor: loading ? "wait" : "pointer",
              transition: "background .25s", opacity: loading ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {loading ? "LOGGER IND..." : <span>LOG IND <span>→</span></span>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 14px" }}>
          <div style={{ flex: 1, height: 1, background: "#D8D2BC" }} />
          <span style={{ color: NA.subText, fontSize: 9, letterSpacing: "0.2em", fontWeight: 600 }}>
            ELLER
          </span>
          <div style={{ flex: 1, height: 1, background: "#D8D2BC" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: "100%", padding: "13px",
            background: NA.cream, color: NA.black,
            border: `1px solid ${NA.black}`,
            fontFamily: "'Poppins',sans-serif",
            fontWeight: 600, fontSize: 11, letterSpacing: "0.14em",
            cursor: "pointer", transition: "background .2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#EDE8D2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = NA.cream; }}
        >
          <GoogleIcon />FORTSÆT MED GOOGLE
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: NA.subText, textAlign: "center" }}>
          Glemt adgangskode?{" "}
          <a href="mailto:magnus@northavenue.dk"
            style={{ color: NA.orange, fontWeight: 700, textDecoration: "none" }}>
            Skriv til Magnus
          </a>
        </p>

        <footer style={{
          position: "absolute", bottom: 24, left: 52, right: 52,
          fontSize: 9, letterSpacing: "0.22em", color: NA.subText, fontWeight: 600,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>NORTHAVENUE.DK</span>
          <span>v2.2</span>
        </footer>
      </section>

      <style>{`
        @media (max-width: 880px) {
          .na-login-main  { flex-direction: column !important; }
          .na-login-left  { min-height: 60vh !important; flex: 0 0 auto !important; padding: 32px 28px !important; }
          .na-login-right { flex: 1 1 auto !important; padding: 40px 28px 80px !important; justify-content: flex-start !important; }
        }
      `}</style>
    </main>
  );
}

export default function Page() {
  return <Suspense><LoginPage /></Suspense>;
}
