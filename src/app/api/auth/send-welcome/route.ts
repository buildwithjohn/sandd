import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

function welcomeEmailHtml(name: string): string {
  const firstName = name.split(" ")[0];
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to S&D Prophetic School</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #f0f4ff; font-family: Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background-color: #1e3a8a; padding: 40px 32px; text-align: center; }
    .header img { width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .header p { color: #bfdbfe; font-size: 13px; }
    .badge { display: inline-block; background-color: #b8860b; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; margin-top: 12px; }
    .body { padding: 40px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1e3a8a; margin-bottom: 20px; }
    .text { font-size: 15px; line-height: 1.8; color: #334155; margin-bottom: 16px; }
    .verse-box { background: #eff6ff; border-left: 4px solid #1e3a8a; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
    .verse-box p { font-size: 14px; font-style: italic; color: #1e40af; line-height: 1.7; }
    .verse-box span { display: block; font-size: 13px; font-weight: 700; color: #b8860b; margin-top: 8px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #1e3a8a; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 16px 40px; border-radius: 12px; text-decoration: none; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
    .prophet { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .prophet img { width: 60px; height: 72px; border-radius: 10px; object-fit: cover; object-position: top; }
    .prophet-info h3 { font-size: 15px; font-weight: 700; color: #1e3a8a; }
    .prophet-info p { font-size: 12px; color: #64748b; margin-top: 2px; }
    .footer { background-color: #1e3a8a; padding: 24px 32px; text-align: center; }
    .footer p { color: #bfdbfe; font-size: 12px; line-height: 1.7; }
    .footer a { color: #93c5fd; text-decoration: none; }
    @media (max-width: 600px) {
      .body { padding: 28px 20px; }
      .header { padding: 28px 20px; }
      .prophet { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://sandd.abiodunsule.uk/assets/logo.png" alt="S&D School Logo" />
      <h1>Sons and Daughters of Prophets</h1>
      <p>Prophetic Training School &mdash; Treasures in Clay Ministries</p>
      <span class="badge">2026 Cohort</span>
    </div>

    <div class="body">
      <p class="greeting">Beloved ${firstName},</p>

      <p class="text">Grace and peace to you in the name of our Lord Jesus Christ.</p>

      <p class="text">
        It is with great joy in my heart that I welcome you into the <strong>Sons and Daughters of Prophets Prophetic Training School</strong>. We believe that God has placed a prophetic calling upon your life, and this school exists to ensure that gift is not wasted through ignorance, pride or lack of accountability.
      </p>

      <p class="text">
        We are here to help you become the kind of prophet the New Testament describes &mdash; humble, accurate, accountable, and deeply rooted in the Word of God.
      </p>

      <div class="verse-box">
        <p>&ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo;</p>
        <span>&mdash; 1 Corinthians 14:3 (NIV)</span>
      </div>

      <p class="text">
        The journey ahead will require discipline, honesty and a genuine hunger for God. Come with an open heart. Come willing to be corrected. Come ready to grow. And above all, come expecting to encounter the living God in a fresh and transforming way.
      </p>

      <p class="text">
        Your account is ready. Sign in now using the email and password you registered with to access your student portal and begin your first lesson.
      </p>

      <div class="btn-wrap">
        <a href="https://sandd.abiodunsule.uk/auth/login" class="btn">Sign In to Your Portal &rarr;</a>
      </div>

      <hr class="divider" />

      <div class="prophet">
        <img src="https://sandd.abiodunsule.uk/assets/prophet-sule.png" alt="Prophet Abiodun Sule" />
        <div class="prophet-info">
          <h3>Prophet Abiodun Sule</h3>
          <p>Founder &amp; Dean<br />S&D Prophetic Training School<br />Treasures in Clay Ministries</p>
        </div>
      </div>

      <p class="text">
        I am believing God for great things through your life.<br /><br />
        In His service,<br />
        <strong>Prophet Abiodun Sule</strong>
      </p>
    </div>

    <div class="footer">
      <p>
        Sons and Daughters of Prophets Prophetic Training School<br />
        Treasures in Clay Ministries &mdash; 2026<br />
        <a href="https://sandd.abiodunsule.uk">sandd.abiodunsule.uk</a>
      </p>
      <p style="margin-top:10px;font-size:11px;color:#6b9fd4;">
        You received this email because you registered at S&D Prophetic School.<br />
        If this was not you, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "S&D Prophetic School <noreply@sandd.abiodunsule.uk>",
      to: email,
      subject: "Welcome to S&D Prophetic School — You're In! 🔥",
      html: welcomeEmailHtml(name),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("Send welcome error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
