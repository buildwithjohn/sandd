import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, full_name, confirmation_url } = await req.json()
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td align="center" style="padding-bottom:24px;">
    <img src="https://sandd.abiodunsule.uk/assets/logo.png" width="80" height="80"
      style="border-radius:16px;display:block;margin:0 auto 12px;" alt="S&D Logo"/>
    <p style="margin:0;font-size:18px;font-weight:bold;color:#1E3A8A;">SONS AND DAUGHTERS OF PROPHETS</p>
    <p style="margin:4px 0 0;font-size:13px;color:#B8860B;">Prophetic Training School — Treasures in Clay Ministries</p>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#fff;border-radius:20px;padding:40px;box-shadow:0 2px 12px rgba(30,58,138,0.08);">
    <p style="margin:0 0 20px;font-size:22px;font-weight:bold;color:#1E3A8A;font-family:Georgia,serif;">Welcome, ${full_name}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">Grace and peace to you in the name of our Lord Jesus Christ.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
      It is with great joy in my heart that I welcome you into the <strong>Sons and Daughters of Prophets Prophetic Training School.</strong>
      We believe that God has placed a prophetic calling upon your life, and we are honoured to walk this journey with you.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
      This school exists for one purpose — to ensure that the gift God has placed within you is not wasted through ignorance, pride or lack of accountability.
      We are here to help you become the kind of prophet the New Testament describes: humble, accurate, accountable, and deeply rooted in the Word of God.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
      Come with an open heart. Come willing to be corrected. Come ready to grow.
      And above all, come expecting to encounter the living God in a fresh and transforming way.
    </p>
    <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#334155;">
      Please verify your email address to access your student portal:
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="${confirmation_url}"
        style="display:inline-block;background:#1D4ED8;color:#fff;font-size:15px;font-weight:bold;
               padding:14px 36px;border-radius:12px;text-decoration:none;">
        Verify My Email &amp; Access Portal →
      </a>
    </td></tr></table>

    <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;text-align:center;">Link not working? Copy and paste:</p>
    <p style="margin:0 0 32px;font-size:11px;color:#3B82F6;text-align:center;word-break:break-all;">${confirmation_url}</p>

    <!-- Signature -->
    <table cellpadding="0" cellspacing="0" style="border-top:1px solid #EFF6FF;padding-top:24px;width:100%;"><tr>
      <td style="padding-right:14px;vertical-align:top;">
        <img src="https://sandd.abiodunsule.uk/assets/prophet-sule.png" width="56" height="68"
          style="border-radius:10px;object-fit:cover;display:block;" alt="Prophet Abiodun Sule"/>
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 3px;font-size:15px;font-weight:bold;color:#1E3A8A;font-family:Georgia,serif;">Prophet Abiodun Sule</p>
        <p style="margin:0 0 2px;font-size:13px;color:#64748B;">Founder &amp; Dean</p>
        <p style="margin:0;font-size:13px;color:#64748B;">S&amp;D Prophetic Training School</p>
        <p style="margin:4px 0 0;font-size:12px;color:#B8860B;">Treasures in Clay Ministries</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#94A3B8;">
      S&amp;D Prophetic Training School &nbsp;|&nbsp;
      <a href="https://sandd.abiodunsule.uk" style="color:#3B82F6;text-decoration:none;">sandd.abiodunsule.uk</a>
    </p>
    <p style="margin:6px 0 0;font-size:11px;color:#CBD5E1;">You received this because you registered at S&amp;D Prophetic School.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'S&D Prophetic School <noreply@sandd.abiodunsule.uk>',
        to: [email],
        subject: 'Welcome to S&D Prophetic School — Please Verify Your Email',
        html,
      }),
    })

    if (!res.ok) throw new Error(await res.text())
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('send-welcome error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
