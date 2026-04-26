"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const NA = {
  black:   "#181719",
  cream:   "#F8F5E6",
  muted:   "#B0A8A4",
  subText: "#7A7470",
  orange:  "#D4622A",
  red:     "#C04A3A",
};

const SYMBOL_SRC = "/brand/NA_symbol_transparent.png";

function Field({ label, value, onChange, type = "text", placeholder, autoFocus }) {
  const [focus, setFocus] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <div style={{
        fontSize: 9,
        color: focus ? NA.orange : "#7A6B5C",
        letterSpacing: "0.18em",
        fontFamily: "'Poppins',sans-serif",
        fontWeight: 700,
        marginBottom: 6,
        transition: "color .2s",
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
          fontWeight: 500, outline: "none",
          transition: "border-color .25s",
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
    <main className="na-login">

      {/* ── LEFT — dark editorial panel ── */}
      <section className="na-login-left">
        <div aria-hidden="true" className="na-spotlight" />

        <header className="na-top">
          <div className="na-lockup">
            <Image src={SYMBOL_SRC} alt="" width={48} height={48} priority
              className="na-symbol" style={{ display: "block" }} />
            <div>
              <div className="na-brand">NORTH AVENUE</div>
              <div className="na-brand-sub">BACKSTAGE</div>
            </div>
          </div>
          <div className="na-year">2026</div>
        </header>

        <div className="na-statement">
          <div className="na-kicker">DANMARKS ULTIMATIVE FESTBAND</div>
          <h1 className="na-headline">
            Hvor <em className="na-em-orange">scenelyset</em>
            <br />
            møder <em>backstage</em>.
          </h1>
          <p className="na-lede">
            Internt system for musikere, vikarer og alias.<br />
            Jobs · Lønoversigt · Booking · Alias.
          </p>
        </div>

        <div />
      </section>

      {/* ── RIGHT — cream form panel ── */}
      <section className="na-login-right">
        <div className="na-form-head">
          <div className="na-form-kicker">LOG IND</div>
          <h2 className="na-form-title">Backstage</h2>
          <p className="na-form-lede">
            Login for at se jobs, løn, alias og bookinger.
          </p>
        </div>

        {activated && (
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: "#1E7B5B18", border: "1px solid #1E7B5B55",
            fontSize: 12, color: "#1E7B5B", fontWeight: 600,
          }}>
            ✓ Konto aktiveret! Log ind med din Google-konto for at fortsætte.
          </div>
        )}
        {selfDeleted && (
          <div style={{
            marginBottom: 20, fontSize: 12,
            color: NA.subText, textAlign: "center",
          }}>
            Din profil er arkiveret.
          </div>
        )}

        <form onSubmit={handleSubmit} className="na-form">
          <Field label="E-MAIL" type="email" value={email} onChange={setEmail}
            placeholder="navn@na.dk" autoFocus={true} />
          <Field label="ADGANGSKODE" type="password" value={pw} onChange={setPw}
            placeholder="••••••••" />

          {error && (
            <div role="alert" className="na-error">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="na-primary"
            style={{ background: hover && !loading ? NA.orange : NA.black }}
          >
            {loading ? "LOGGER IND..." : <span>LOG IND <span>→</span></span>}
          </button>
        </form>

        <div className="na-divider">
          <div className="na-divider-line" />
          <span>ELLER</span>
          <div className="na-divider-line" />
        </div>

        <button type="button" onClick={handleGoogle} className="na-secondary">
          <GoogleIcon />FORTSÆT MED GOOGLE
        </button>

        <p className="na-forgot">
          Glemt adgangskode?{" "}
          <a href="mailto:magnus@northavenue.dk">Skriv til Magnus</a>
        </p>

        <footer className="na-footer">
          <span>NORTHAVENUE.DK</span>
          <span>v2.2</span>
        </footer>
      </section>

      <style>{`
        .na-login {
          min-height: 100vh;
          background: ${NA.black};
          color: ${NA.cream};
          font-family: 'Poppins', sans-serif;
          display: flex;
        }

        /* ── LEFT ── */
        .na-login-left {
          position: relative;
          flex: 1 1 auto;
          padding: 44px 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          gap: 0;
        }
        .na-spotlight {
          position: absolute;
          top: -360px;
          left: -240px;
          width: 1100px;
          height: 1100px;
          border-radius: 50%;
          filter: blur(70px);
          background: radial-gradient(
            circle at 30% 25%,
            ${NA.orange}d9 0%,
            ${NA.orange}80 18%,
            ${NA.orange}33 38%,
            ${NA.orange}0d 58%,
            transparent 75%
          );
          pointer-events: none;
        }
        .na-top {
          position: absolute;
          top: 44px; left: 56px; right: 56px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 2;
        }
        .na-lockup { display: flex; align-items: center; gap: 14px; }
        .na-symbol { width: 48px; height: 48px; }
        .na-brand {
          font-size: 11px; letter-spacing: 0.28em;
          color: ${NA.cream}; font-weight: 700; line-height: 1.1;
        }
        .na-brand-sub {
          font-size: 9px; letter-spacing: 0.32em;
          color: ${NA.orange}; font-weight: 700; margin-top: 3px;
        }
        .na-year {
          font-size: 9px; letter-spacing: 0.32em;
          color: ${NA.muted}; font-weight: 600; padding-top: 6px;
        }
        .na-statement { position: relative; max-width: 720px; z-index: 1; }
        .na-kicker {
          font-size: 10px; letter-spacing: 0.32em;
          color: ${NA.orange}; font-weight: 700; margin-bottom: 18px;
        }
        .na-headline {
          font-family: 'Trirong', serif;
          font-weight: 400;
          font-size: 78px;
          line-height: 1.0;
          color: ${NA.cream};
          letter-spacing: -0.02em;
          margin: 0;
        }
        .na-headline em { font-style: italic; }
        .na-em-orange { color: ${NA.orange}; }
        .na-lede {
          margin-top: 24px; font-size: 16px;
          color: ${NA.muted}; max-width: 480px; line-height: 1.6;
        }

        /* ── RIGHT ── */
        .na-login-right {
          flex: 0 0 500px;
          background: ${NA.cream};
          color: ${NA.black};
          padding: 56px 52px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          min-height: 100vh;
        }
        .na-form-head { margin-bottom: 36px; }
        .na-form-kicker {
          font-size: 9px; color: ${NA.orange}; letter-spacing: 0.32em;
          font-weight: 700; margin-bottom: 14px;
        }
        .na-form-title {
          font-family: 'Trirong', serif;
          font-size: 44px; font-weight: 500;
          color: ${NA.black}; line-height: 1.05;
          letter-spacing: -0.01em; margin: 0;
        }
        .na-form-lede {
          font-size: 13px; color: #5A4A40;
          margin-top: 10px; line-height: 1.55;
        }
        .na-form { display: flex; flex-direction: column; gap: 22px; }
        .na-error {
          font-size: 11px; color: ${NA.red};
          letter-spacing: 0.06em; font-weight: 600;
          padding: 6px 10px;
          background: ${NA.red}14;
          border-left: 2px solid ${NA.red};
        }
        .na-primary {
          margin-top: 6px; padding: 15px;
          color: ${NA.cream}; border: none;
          font-family: 'Poppins', sans-serif;
          font-weight: 700; font-size: 11px; letter-spacing: 0.22em;
          cursor: pointer;
          transition: background .25s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .na-primary:disabled { opacity: 0.6; cursor: wait; }
        .na-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 22px 0 14px;
        }
        .na-divider-line { flex: 1; height: 1px; background: #D8D2BC; }
        .na-divider span {
          color: ${NA.subText}; font-size: 9px;
          letter-spacing: 0.2em; font-weight: 600;
        }
        .na-secondary {
          width: 100%; padding: 13px;
          background: ${NA.cream}; color: ${NA.black};
          border: 1px solid ${NA.black};
          font-family: 'Poppins', sans-serif;
          font-weight: 600; font-size: 11px; letter-spacing: 0.14em;
          cursor: pointer; transition: background .2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .na-secondary:hover { background: #EDE8D2; }
        .na-forgot {
          margin-top: 20px; font-size: 11px;
          color: ${NA.subText}; text-align: center;
        }
        .na-forgot a { color: ${NA.orange}; font-weight: 700; text-decoration: none; }
        .na-footer {
          position: absolute;
          bottom: 24px; left: 52px; right: 52px;
          font-size: 9px; letter-spacing: 0.22em;
          color: ${NA.subText}; font-weight: 600;
          display: flex; justify-content: space-between;
        }

        /* Tablet */
        @media (max-width: 1199px) and (min-width: 760px) {
          .na-login-right { flex: 0 0 38%; }
        }

        /* Mobile */
        @media (max-width: 759px) {
          .na-login { flex-direction: column; }
          .na-login-left {
            min-height: auto;
            justify-content: flex-start;
            padding: 44px 24px 91px;
            gap: 110px;
          }
          .na-spotlight {
            top: -180px; left: -160px;
            width: 620px; height: 620px;
          }
          .na-top { position: relative; top: auto; left: auto; right: auto; }
          .na-symbol { width: 40px !important; height: 40px !important; }
          .na-year { display: none; }
          .na-headline { font-size: 36px; line-height: 1.1; }
          .na-lede { display: none; }
          .na-login-right {
            flex: 1 1 auto; min-height: 0;
            padding: 44px 24px 56px;
            justify-content: flex-start;
          }
          .na-form-title { font-size: 36px; }
          .na-footer { display: none; }
        }
      `}</style>
    </main>
  );
}

export default function Page() {
  return <Suspense><LoginPage /></Suspense>;
}
