// Shared email sender (Resend) + the school's branded template.
// Server-only — uses RESEND_API_KEY.

const FROM = "S&D Prophetic School <noreply@sandd.abiodunsule.uk>";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not configured" };
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    if (res.status === 429) { await new Promise(r => setTimeout(r, (attempt + 1) * 1500)); continue; }
    if (res.ok) return { ok: true };
    const e = await res.json().catch(() => ({}));
    return { ok: false, error: e?.message || `HTTP ${res.status}` };
  }
  return { ok: false, error: "rate limited" };
}

// Batch send via Resend's /emails/batch endpoint (up to 100 per request) —
// used for bulk sends (waitlist enrolment, credential resends) so we don't
// trip the per-request rate limit sending one-by-one in a loop.
export async function sendBatch(
  messages: { to: string; subject: string; html: string }[]
): Promise<{ total: number; sent: number; results: { to: string; ok: boolean; error?: string }[] }> {
  const results: { to: string; ok: boolean; error?: string }[] = [];
  if (!process.env.RESEND_API_KEY) {
    return { total: messages.length, sent: 0, results: messages.map(m => ({ to: m.to, ok: false, error: "RESEND_API_KEY not configured" })) };
  }
  // chunk into 100s (Resend batch cap)
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const payload = chunk.map(m => ({ from: FROM, to: [m.to], subject: m.subject, html: m.html }));
    let ok = false; let error: string | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) { await new Promise(r => setTimeout(r, (attempt + 1) * 1500)); continue; }
      if (res.ok) { ok = true; break; }
      const e = await res.json().catch(() => ({}));
      error = e?.message || `HTTP ${res.status}`;
      break;
    }
    for (const m of chunk) results.push({ to: m.to, ok, error: ok ? undefined : (error || "rate limited") });
  }
  return { total: messages.length, sent: results.filter(r => r.ok).length, results };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Branded wrapper: royal header, gilt rule, body, CTA, footer.
export function brandedEmail(opts: { heading: string; bodyHtml: string; ctaText?: string; ctaHref?: string }): string {
  const cta = opts.ctaText && opts.ctaHref
    ? `<div style="margin-top:26px;"><a href="${opts.ctaHref}" style="display:inline-block;background:#D4B570;color:#14101F;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:10px;">${esc(opts.ctaText)}</a></div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:#0A0612;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0612;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#14101F;border-radius:16px;overflow:hidden;border:1px solid #2D2548;">
  <tr><td style="background:#2D1B5E;padding:26px 32px;text-align:center;">
    <div style="color:#D4B570;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">Sons &amp; Daughters of Prophets</div>
    <div style="color:#ffffff;font-size:19px;margin-top:6px;">Prophetic Training School</div>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(to right,#D4B570,#F5D4A0,#D4B570);"></td></tr>
  <tr><td style="padding:32px;">
    <h1 style="color:#EDE9F5;font-size:21px;margin:0 0 16px;">${esc(opts.heading)}</h1>
    <div style="color:#C9C2DA;font-size:15px;line-height:1.75;font-family:Arial,sans-serif;">${opts.bodyHtml}</div>
    ${cta}
  </td></tr>
  <tr><td style="background:#0F0B1A;padding:20px 32px;border-top:1px solid #2D2548;">
    <p style="color:#8B84A0;font-size:12px;line-height:1.7;margin:0;font-family:Arial,sans-serif;">
      S&amp;D Prophetic Training School · Treasures in Clay Ministries ·
      <a href="https://sandd.abiodunsule.uk" style="color:#D4B570;text-decoration:none;">sandd.abiodunsule.uk</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export const escapeHtml = esc;

// Enrolment / credentials email (login details + next steps). Shared by the
// waitlist-enrol and resend-credentials routes.
export function enrolmentEmail(name: string, email: string, password: string, studentNumber: string): string {
  const firstName = (name || email.split("@")[0]).split(" ")[0];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:#1A1A2E;padding:32px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="color:white;font-size:18px;font-weight:700;margin:0;font-family:Georgia,serif;">S&amp;D Prophetic Training School</p>
      <p style="color:#E0A64E;font-size:12px;margin:4px 0 0 0;">Treasures in Clay Ministries</p></td>
      <td align="right"><p style="color:#E0A64E;font-size:11px;margin:0;font-family:monospace;">${studentNumber}</p></td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(to right,#7C3AED,#C026A3,#E0A64E);"></td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#1A1A2E;font-size:22px;font-weight:700;font-family:Georgia,serif;margin:0 0 8px 0;">You are enrolled.</p>
    <p style="color:#888;font-size:13px;margin:0 0 32px 0;">2026 Cohort — Certificate in Prophetic Ministry</p>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 16px 0;">Dear ${firstName},</p>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 24px 0;">
      Grace and peace to you. On behalf of Prophet Abiodun Sule, Founder and Dean, I am pleased to inform you that you have been formally enrolled into the Sons and Daughters of Prophets Prophetic Training School — 2026 Cohort. Welcome.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F2;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:24px;">
        <p style="color:#8B7355;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px 0;">Your Login Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[["Portal", "sandd.abiodunsule.uk"], ["Email", email], ["Temporary Password", password], ["Student Number", studentNumber]].map(([l,v]) => `
          <tr>
            <td style="padding:6px 0;color:#8B7355;font-size:13px;font-weight:600;width:40%;">${l}</td>
            <td style="padding:6px 0;color:#1A1A2E;font-size:13px;font-family:monospace;">${v}</td>
          </tr>`).join("")}
        </table>
      </td></tr>
    </table>
    <p style="color:#C0392B;font-size:13px;font-weight:600;margin:0 0 24px 0;">
      Please change your password immediately after logging in — go to Profile in your portal sidebar.
    </p>
    <p style="color:#1A1A2E;font-size:14px;font-weight:700;margin:0 0 12px 0;">Next steps:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ["1", "Log in to your portal", "Visit sandd.abiodunsule.uk and sign in with the details above."],
        ["2", "Join our Telegram community", "All orientation details, schedules and live session links are shared there: t.me/+zoXkAa9bjCtmZmY8"],
        ["3", "Download your documents", "Your Admission Letter and Academic Calendar are in the Documents section of your portal."],
      ].map(([n, title, desc]) => `
      <tr><td style="padding:8px 0;vertical-align:top;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="width:28px;height:28px;background:#1A1A2E;border-radius:50%;text-align:center;vertical-align:middle;">
            <span style="color:#E0A64E;font-size:12px;font-weight:700;">${n}</span>
          </td>
          <td style="padding-left:12px;">
            <p style="color:#1A1A2E;font-size:13px;font-weight:700;margin:0 0 2px 0;">${title}</p>
            <p style="color:#666;font-size:12px;margin:0;">${desc}</p>
          </td>
        </tr></table>
      </td></tr>`).join("")}
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 40px 40px;border-top:1px solid #E8E2D9;">
    <p style="color:#333;font-size:14px;margin:24px 0 4px 0;">Yours in His service,</p>
    <p style="color:#1A1A2E;font-size:15px;font-weight:700;font-family:Georgia,serif;margin:0 0 2px 0;">John Ayomide Akinola</p>
    <p style="color:#666;font-size:12px;margin:0;">Registrar, S&amp;D Prophetic Training School</p>
    <p style="color:#888;font-size:12px;margin:6px 0 0 0;font-style:italic;">On behalf of Prophet Abiodun Sule — Founder &amp; Dean</p>
  </td></tr>
  <tr><td style="background:#1A1A2E;padding:20px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">sandd.abiodunsule.uk · Treasures in Clay Ministries · 2026</p>
    <p style="color:rgba(224,166,78,0.6);font-size:10px;font-style:italic;margin:4px 0 0 0;">"But the one who prophesies speaks to people for their strengthening, encouraging and comfort." — 1 Cor 14:3</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
