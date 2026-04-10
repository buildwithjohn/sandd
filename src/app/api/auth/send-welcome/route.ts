import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const firstName = name.split(" ")[0];

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Welcome to S&D Prophetic School</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;">

  <!-- HEADER -->
  <tr>
    <td style="background:#1e3a8a;padding:40px 32px;text-align:center;">
      <img src="https://sandd.abiodunsule.uk/assets/logo.png" width="80" height="80"
           style="border-radius:14px;display:block;margin:0 auto 16px;" alt="S&D Logo"/>
      <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;font-family:Arial,sans-serif;">Sons and Daughters of Prophets</h1>
      <p style="color:#bfdbfe;font-size:13px;margin:0;">Prophetic Training School &mdash; Treasures in Clay Ministries</p>
      <span style="display:inline-block;background:#b8860b;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 14px;border-radius:20px;margin-top:12px;">2026 Cohort</span>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:40px 32px;">
      <p style="font-size:18px;font-weight:700;color:#1e3a8a;margin:0 0 20px;">Beloved ${firstName},</p>
      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 16px;">Grace and peace to you in the name of our Lord Jesus Christ.</p>
      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 16px;">
        It is with great joy in my heart that I welcome you into the <strong>Sons and Daughters of Prophets Prophetic Training School</strong>.
        We believe that God has placed a prophetic calling upon your life, and this school exists to ensure that gift is not wasted
        through ignorance, pride or lack of accountability.
      </p>
      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 24px;">
        We are here to help you become the kind of prophet the New Testament describes &mdash; humble, accurate, accountable,
        and deeply rooted in the Word of God.
      </p>

      <!-- VERSE BOX -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background:#eff6ff;border-left:4px solid #1e3a8a;border-radius:8px;padding:16px 20px;">
            <p style="font-size:14px;font-style:italic;color:#1e40af;line-height:1.7;margin:0 0 8px;">
              &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo;
            </p>
            <span style="font-size:13px;font-weight:700;color:#b8860b;">&mdash; 1 Corinthians 14:3 (NIV)</span>
          </td>
        </tr>
      </table>

      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 16px;">
        The journey ahead will require discipline, honesty and a genuine hunger for God. Come with an open heart.
        Come willing to be corrected. Come ready to grow. And above all, come expecting to encounter the living God
        in a fresh and transforming way.
      </p>
      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 32px;">
        Your account is ready. Click the button below to sign in and begin your first lesson.
      </p>

      <!-- CTA BUTTON -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
        <tr>
          <td align="center">
            <a href="https://sandd.abiodunsule.uk/auth/login"
               style="display:inline-block;background:#1e3a8a;color:#ffffff;font-size:15px;font-weight:700;
                      padding:16px 40px;border-radius:12px;text-decoration:none;font-family:Arial,sans-serif;">
              Sign In to Your Portal &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- DIVIDER -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
      </table>

      <!-- PROPHET SIGNATURE -->
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="padding-right:16px;vertical-align:top;">
            <img src="https://sandd.abiodunsule.uk/assets/prophet-sule.png"
                 width="60" style="border-radius:10px;display:block;" alt="Prophet Abiodun Sule"/>
          </td>
          <td style="vertical-align:middle;">
            <p style="font-size:15px;font-weight:700;color:#1e3a8a;margin:0 0 4px;">Prophet Abiodun Sule</p>
            <p style="font-size:12px;color:#64748b;margin:0;line-height:1.6;">
              Founder &amp; Dean<br/>
              S&D Prophetic Training School<br/>
              Treasures in Clay Ministries
            </p>
          </td>
        </tr>
      </table>

      <p style="font-size:15px;line-height:1.8;color:#334155;margin:0;">
        I am believing God for great things through your life.<br/><br/>
        In His service,<br/>
        <strong>Prophet Abiodun Sule</strong>
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1e3a8a;padding:24px 32px;text-align:center;">
      <p style="color:#bfdbfe;font-size:12px;line-height:1.7;margin:0;">
        Sons and Daughters of Prophets Prophetic Training School<br/>
        Treasures in Clay Ministries &mdash; 2026<br/>
        <a href="https://sandd.abiodunsule.uk" style="color:#93c5fd;text-decoration:none;">sandd.abiodunsule.uk</a>
      </p>
      <p style="color:#6b9fd4;font-size:11px;margin:10px 0 0;line-height:1.6;">
        You received this email because you registered at S&D Prophetic School.<br/>
        If this was not you, please ignore this email.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    // Call Resend API directly using fetch — no SDK dependency issues
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "S&D Prophetic School <noreply@sandd.abiodunsule.uk>",
        to: [email],
        subject: "Welcome to S&D Prophetic School — You're In! 🔥",
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", result);
      return NextResponse.json({ error: result.message || "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });

  } catch (err: any) {
    console.error("send-welcome error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
