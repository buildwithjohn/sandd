// Shared email sender (Resend) + the school's branded template.
// Server-only — uses RESEND_API_KEY.

const FROM = "S&D Prophetic School <noreply@sandd.abiodunsule.uk>";

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not configured" };
  for (let attempt = 0; attempt < 3; attempt++) {
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
