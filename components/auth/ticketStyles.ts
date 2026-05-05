// Ticket auth styles — ported verbatim from
// leitmotif/project/auth-ticket.jsx, scoped under `.lm-auth` so design selector
// names (`.ticket`, `.stub`, `.perf`, `.main`, `.field .row.focus`, …) port
// 1:1 without colliding with anything else in the app.
//
// Injected via <style dangerouslySetInnerHTML> from TicketAuth so SSR ships
// the fully-styled markup without an unstyled flash.

export const ticketStyles = `
.lm-auth {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 30%, #1a1612 0%, #0a0907 70%);
  color: #e8dfc9;
  font-family: var(--font-inter), "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  overflow-x: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 88px 32px;
}
.lm-auth, .lm-auth *, .lm-auth *::before, .lm-auth *::after { box-sizing: border-box; }
.lm-auth button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.lm-auth a { color: inherit; text-decoration: none; }

/* drape backdrop — vintage velvet curtain */
.lm-auth .drape {
  position: absolute; inset: 0;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(90deg,
      rgba(194,90,58,0) 0 18px,
      rgba(194,90,58,0.025) 18px 19px,
      rgba(194,90,58,0) 19px 38px),
    repeating-linear-gradient(90deg,
      rgba(0,0,0,0.18) 0 90px,
      rgba(0,0,0,0) 90px 180px);
  mix-blend-mode: multiply;
  opacity: 0.55;
  z-index: 1;
}
.lm-auth .vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 49;
  background: radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.6) 100%);
}
.lm-auth .grain {
  position: absolute; inset: 0; pointer-events: none; z-index: 50;
  opacity: 0.06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.92  0 0 0 0 0.87  0 0 0 0 0.78  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}

.lm-auth .house-rule {
  position: absolute;
  left: 32px; right: 32px;
  height: 1px;
  background: #2a241c;
  z-index: 2;
}
.lm-auth .house-rule.top { top: 56px; }
.lm-auth .house-rule.bot { bottom: 56px; }

.lm-auth .house-mast {
  position: absolute;
  left: 32px; right: 32px; top: 24px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: #7d735f;
  z-index: 2;
}
.lm-auth .house-mast .C {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 18px;
  letter-spacing: 0.02em;
  color: #e8dfc9;
  text-transform: none;
}
.lm-auth .house-mast .perf-dot {
  display: inline-block; width: 6px; height: 6px;
  background: #c25a3a; border-radius: 50%;
  vertical-align: middle; margin-right: 8px;
}
.lm-auth .house-mast .live-dot { color: #c25a3a; }
.lm-auth .house-foot {
  position: absolute;
  left: 32px; right: 32px; bottom: 24px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
  color: #4d4639;
  z-index: 2;
}

/* ——— ticket ——— */
.lm-auth .ticket {
  width: min(1180px, 94%);
  display: grid;
  grid-template-columns: 0.82fr 12px 1.65fr;
  background: #f1ead6;
  color: #1a1612;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.05),
    0 50px 120px -30px rgba(0,0,0,0.7),
    0 12px 40px -10px rgba(0,0,0,0.45);
  position: relative;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  filter: drop-shadow(0 1px 0 rgba(255,255,255,0.05));
  z-index: 3;
}
.lm-auth .ticket::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.6  0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  mix-blend-mode: multiply;
  opacity: 0.18;
  z-index: 6;
}
.lm-auth .ticket::after {
  content: ""; position: absolute;
  width: 220px; height: 220px;
  right: -40px; bottom: -60px;
  border: 1.5px solid rgba(138,42,31,0.12);
  border-radius: 50%;
  pointer-events: none;
  z-index: 5;
}

/* perforation between stub and main */
.lm-auth .perf {
  position: relative;
  background:
    radial-gradient(circle at 6px 8px, transparent 4px, transparent 4.2px),
    repeating-linear-gradient(180deg, transparent 0 8px, #1a1612 8px 9px, transparent 9px 16px);
  background-size: 12px 16px;
  background-color: #f1ead6;
}
.lm-auth .perf::before, .lm-auth .perf::after {
  content: ""; position: absolute;
  left: 0; right: 0; height: 12px;
  background:
    radial-gradient(circle at 6px 6px, #0a0907 5px, transparent 5.3px);
  background-size: 12px 12px;
  background-repeat: repeat-x;
}
.lm-auth .perf::before { top: -6px; }
.lm-auth .perf::after  { bottom: -6px; transform: rotate(180deg); }
.lm-auth .perf .marks {
  position: absolute; inset: 0;
  background-image: repeating-linear-gradient(180deg,
    transparent 0 10px,
    rgba(26,22,18,0.55) 10px 12px,
    transparent 12px 22px);
}
.lm-auth .tear-hint {
  position: absolute;
  top: 50%; transform: translate(-50%, -50%) rotate(-90deg);
  left: 0;
  font-size: 8.5px; letter-spacing: 0.4em; text-transform: uppercase;
  color: #5a4f3a;
  white-space: nowrap;
  background: #f1ead6;
  padding: 0 6px;
}

/* ——— left stub: marquee · supporting role ——— */
.lm-auth .stub {
  position: relative;
  padding: 26px 22px 26px 26px;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #e8dfc6 0%, #ddd2b3 100%);
  box-shadow: inset -18px 0 24px -18px rgba(26,22,18,0.18);
  color: #2c241a;
}
.lm-auth .stub::after {
  content: ""; position: absolute; inset: 0;
  background: rgba(184,73,44,0.025);
  pointer-events: none;
}
.lm-auth .stub-head {
  display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 1px solid #b8ad8e;
  padding-bottom: 10px;
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #6a5f49;
}
.lm-auth .stub-head .seat {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 18px;
  letter-spacing: 0.01em;
  color: #2c241a;
  text-transform: none;
}
.lm-auth .stub-meta {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #b8ad8e;
}
.lm-auth .stub-meta > div {
  padding: 9px 0;
  font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #6a5f49;
  border-right: 1px solid #b8ad8e;
  padding-right: 12px;
}
.lm-auth .stub-meta > div:last-child { border-right: 0; padding-left: 12px; padding-right: 0; }
.lm-auth .stub-meta strong {
  display: block;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 11.5px; letter-spacing: 0.03em; text-transform: none;
  color: #2c241a; margin-top: 3px; font-weight: 400;
}

.lm-auth .marquee {
  margin-top: 18px;
  border-top: 1px solid #b8ad8e;
  border-bottom: 1px solid #b8ad8e;
  padding: 14px 0 16px;
  position: relative;
}
.lm-auth .marquee-eyebrow {
  font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #6a5f49;
  display: flex; justify-content: space-between; align-items: baseline;
  margin: 0 0 8px;
}
.lm-auth .marquee-eyebrow .red { color: #a14a2a; }
.lm-auth .now-showing {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 24px;
  line-height: 1.05;
  color: #2c241a;
  letter-spacing: -0.005em;
  margin: 4px 0 8px;
  text-wrap: balance;
}
.lm-auth .now-showing .red { color: #a14a2a; }
.lm-auth .now-reg {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 13.5px;
  line-height: 1.4;
  color: #4a3f2c;
  margin-bottom: 12px;
}
.lm-auth .now-feat {
  list-style: none; padding: 0; margin: 10px 0 0;
  display: grid; grid-template-columns: 1fr;
  font-size: 10.5px; letter-spacing: 0.06em;
  color: #2c241a;
  border-top: 1px solid #c8bfa0;
}
.lm-auth .now-feat li {
  display: grid; grid-template-columns: 26px 1fr auto;
  align-items: center;
  border-bottom: 1px solid #c8bfa0;
  padding: 6px 2px;
}
.lm-auth .now-feat li:last-child { border-bottom: 0; }
.lm-auth .now-feat .n { color: #a14a2a; font-size: 9.5px; letter-spacing: 0.18em; }
.lm-auth .now-feat .t {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 14px;
  color: #2c241a;
}
.lm-auth .now-feat .d { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #6a5f49; }

.lm-auth .stub-foot {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #b8ad8e;
  display: grid; grid-template-columns: 1fr auto;
  align-items: end;
  gap: 12px;
}
.lm-auth .stub-foot .price {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 22px;
  color: #2c241a;
  line-height: 1;
}
.lm-auth .stub-foot .price small { font-size: 10px; color: #6a5f49; letter-spacing: 0.16em; text-transform: uppercase; font-style: normal; }
.lm-auth .stub-foot .barcode {
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 8.5px;
  letter-spacing: 0.02em;
  color: #6a5f49;
  text-align: right;
}
.lm-auth .bars { display: flex; gap: 1px; align-items: end; height: 22px; margin-bottom: 3px; justify-content: flex-end; opacity: 0.85; }
.lm-auth .bars i { display: block; width: 1.4px; background: #2c241a; }

/* ——— main: form (the visual lead) ——— */
.lm-auth .main {
  position: relative;
  padding: 32px 44px 30px 40px;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, #f6f0dc 0%, #f1ead6 100%);
  box-shadow: inset 18px 0 24px -18px rgba(255,255,255,0.6);
}
.lm-auth .main-head {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: end;
  border-bottom: 2px solid #1a1612;
  padding-bottom: 14px;
  gap: 14px;
}
.lm-auth .main-head .L, .lm-auth .main-head .R {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: #5a4f3a;
}
.lm-auth .main-head .R { text-align: right; }
.lm-auth .main-head .C {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 30px;
  color: #1a1612;
  text-align: center;
  line-height: 1;
  letter-spacing: 0.005em;
}

.lm-auth .main-meta {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid #b8ad8e;
}
.lm-auth .main-meta > div {
  padding: 12px 14px;
  border-right: 1px solid #b8ad8e;
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: #5a4f3a;
}
.lm-auth .main-meta > div:last-child { border-right: 0; }
.lm-auth .main-meta strong {
  display: block;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 13px; letter-spacing: 0.03em; text-transform: none;
  color: #1a1612; margin-top: 4px; font-weight: 400;
}
.lm-auth .main-meta strong em { font-style: italic; color: #b8492c; }

/* ——— toggle: tear-line tabs ——— */
.lm-auth .tabs {
  margin-top: 18px;
  display: grid; grid-template-columns: 1fr 1fr;
  border: 1px solid #1a1612;
  background: #ece4cc;
  position: relative;
}
.lm-auth .tab {
  padding: 12px 14px 14px;
  text-align: left;
  border-right: 1px dashed #1a1612;
  display: flex; flex-direction: column; gap: 2px;
  transition: background .25s ease, color .25s ease;
}
.lm-auth .tab:last-child { border-right: 0; }
.lm-auth .tab .lbl {
  font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #5a4f3a;
}
.lm-auth .tab .ttl {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 22px; color: #1a1612; line-height: 1;
}
.lm-auth .tab.active { background: #1a1612; }
.lm-auth .tab.active .lbl { color: #c25a3a; }
.lm-auth .tab.active .ttl { color: #f1ead6; }
.lm-auth .tab:not(.active) .ttl { color: #5a4f3a; }

/* fields — typewriter style */
.lm-auth .field {
  margin-top: 18px;
  border-bottom: 1px solid #1a1612;
  padding: 0 0 4px;
}
.lm-auth .field .row {
  display: grid; grid-template-columns: 110px 1fr auto;
  align-items: end;
  gap: 14px;
  padding: 10px 0 8px;
}
.lm-auth .field .row .k {
  font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: #5a4f3a;
  padding-bottom: 6px;
  cursor: pointer;
}
.lm-auth .field .row.focus .k { color: #b8492c; }
.lm-auth .field input {
  width: 100%;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace !important;
  font-size: 18px;
  letter-spacing: 0.02em;
  color: #1a1612;
  background: transparent;
  border: 0; outline: 0;
  padding: 6px 0;
  border-bottom: 1px dashed #b8ad8e;
}
.lm-auth .field input::placeholder { color: #b8ad8e; }
.lm-auth .field .row .meta {
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: #5a4f3a;
  padding-bottom: 8px;
}
.lm-auth .field .row .meta.link {
  color: #b8492c;
  cursor: pointer;
  background: none; border: 0; padding: 0;
  font: inherit; font-family: inherit;
  letter-spacing: 0.2em; text-transform: uppercase;
}
.lm-auth .field .row .meta.link:hover { text-decoration: underline; }

/* error chit — reserved-height slot keeps the form dimensions constant
   across (empty | filled | loading | error). The chit only renders inside
   the slot when there's an actual error; the slot itself always reserves
   the row's vertical space. */
.lm-auth .chit-slot {
  margin-top: 14px;
  min-height: 44px;
}
.lm-auth .chit {
  border: 1px solid #b8492c;
  background: rgba(184,73,44,0.06);
  padding: 10px 14px;
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 15px;
  color: #1a1612;
  display: flex; gap: 12px; align-items: baseline;
  position: relative;
}
.lm-auth .chit::before {
  content: "";
  position: absolute; left: -1px; top: -1px; bottom: -1px;
  width: 6px; background: #b8492c;
}
.lm-auth .chit .label {
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-style: normal;
  font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase;
  color: #b8492c;
  flex-shrink: 0;
}

/* primary action — admit one */
.lm-auth .admit {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}
.lm-auth .admit .btn {
  background: #1a1612;
  color: #f1ead6;
  padding: 16px 20px;
  font-family: var(--font-inter), "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
  font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
  transition: background .25s ease, color .25s ease;
  box-shadow: 0 1px 0 rgba(255,255,255,0.05), 0 8px 18px -8px rgba(26,22,18,0.5);
}
.lm-auth .admit .btn:hover:not([disabled]) { background: #b8492c; }
.lm-auth .admit .btn[disabled] { opacity: .65; cursor: progress; }
.lm-auth .admit .btn .arrow {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic; font-size: 22px; text-transform: none; letter-spacing: 0;
}
.lm-auth .admit .btn.loading .arrow { display: none; }
.lm-auth .admit .btn .reel {
  width: 14px; height: 14px;
  border: 1.5px solid #f1ead6; border-top-color: transparent;
  border-radius: 50%;
  animation: lm-tspin 0.9s linear infinite;
  display: none;
}
.lm-auth .admit .btn.loading .reel { display: inline-block; }
@keyframes lm-tspin { to { transform: rotate(360deg); } }

.lm-auth .admit .stamp {
  border: 1.5px solid #b8492c;
  color: #b8492c;
  padding: 10px 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  background: rgba(184,73,44,0.04);
  line-height: 1;
  transform: rotate(0deg);
  transition: transform 0.6s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.lm-auth .admit .stamp.settled { transform: rotate(-3deg); }
@media (prefers-reduced-motion: reduce) {
  .lm-auth .admit .stamp { transform: rotate(-3deg); transition: none; }
}
.lm-auth .admit .stamp .big {
  font-family: var(--font-cormorant), "EB Garamond", Georgia, serif;
  font-style: italic;
  font-size: 22px;
  letter-spacing: 0.02em;
  color: #b8492c;
  margin-bottom: 2px;
}

/* sso row */
.lm-auth .sso2 {
  margin-top: 14px;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.lm-auth .sso2 .b {
  border: 1px solid #1a1612;
  padding: 12px 14px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
  color: #1a1612;
  background: rgba(255,255,255,0.2);
  transition: background .25s ease, color .25s ease;
  font-family: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, monospace;
}
.lm-auth .sso2 .b:hover:not([disabled]) { background: #1a1612; color: #f1ead6; }
.lm-auth .sso2 .b[disabled] { opacity: .6; cursor: progress; }
.lm-auth .sso2 .b .l { display: flex; align-items: center; gap: 10px; }
.lm-auth .sso2 .b .lane { font-size: 9px; color: #5a4f3a; letter-spacing: 0.2em; }
.lm-auth .sso2 .b:hover:not([disabled]) .lane { color: #b8ad95; }
.lm-auth .sso2 .b:hover:not([disabled]) .glyph-mono { color: #f1ead6; }

/* fine print */
.lm-auth .fine {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #b8ad8e;
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #5a4f3a;
}
.lm-auth .fine em { font-style: italic; color: #1a1612; cursor: pointer; }
.lm-auth .fine a:hover em { color: #b8492c; }

@media (max-width: 720px) {
  .lm-auth { padding: 84px 16px; }
  .lm-auth .ticket { grid-template-columns: 1fr; }
  .lm-auth .perf { display: none; }
  .lm-auth .main { padding: 24px 22px; }
  .lm-auth .stub { padding: 22px 22px 24px; }
  .lm-auth .main-head { grid-template-columns: 1fr; text-align: center; }
  .lm-auth .main-head .L, .lm-auth .main-head .R { display: none; }
  .lm-auth .main-meta { grid-template-columns: repeat(2, 1fr); }
  .lm-auth .main-meta > div:nth-child(2n) { border-right: 0; }
  .lm-auth .field .row { grid-template-columns: 1fr; gap: 4px; }
  .lm-auth .admit { grid-template-columns: 1fr; }
  .lm-auth .admit .stamp { justify-self: end; padding: 8px 12px; }
  .lm-auth .sso2 { grid-template-columns: 1fr; }
  .lm-auth .house-mast { font-size: 9px; left: 16px; right: 16px; gap: 12px; }
  .lm-auth .house-foot { font-size: 9px; left: 16px; right: 16px; }
  .lm-auth .house-mast .C { font-size: 14px; }
  .lm-auth .house-rule { left: 16px; right: 16px; }
}
`
