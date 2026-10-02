import { createAdminClient } from "./supabase-admin";
import { sendEmail, brandedEmail, escapeHtml } from "./email";

// Scheduled comms automations. Each is idempotent (comms_log guards against
// re-sending), capped per run (rate-limit + Vercel timeout safety), and gated
// by a school_settings switch (default off). Supports dry-run (plan only).

const CAP = 40;              // max emails per automation per run
const SEND_DELAY = 400;      // ms between sends
const PORTAL = "https://sandd.abiodunsule.uk";
const DAY = 86_400_000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const first = (name?: string) => escapeHtml((name || "Student").split(" ")[0]);

type Item = { student_id: string; email: string; key: string; subject: string; bodyHtml: string };
type Result = { planned: number; sent: number; sample?: string[] };

async function filterUnsent(admin: any, items: Item[], withinDays?: number): Promise<Item[]> {
  if (!items.length) return items;
  const sids = Array.from(new Set(items.map(i => i.student_id)));
  const keys = Array.from(new Set(items.map(i => i.key)));
  let q = admin.from("comms_log").select("student_id,automation_key,sent_at").in("student_id", sids).in("automation_key", keys);
  if (withinDays) q = q.gte("sent_at", new Date(Date.now() - withinDays * DAY).toISOString());
  const { data } = await q;
  const seen = new Set((data ?? []).map((d: any) => d.student_id + "|" + d.automation_key));
  return items.filter(i => !seen.has(i.student_id + "|" + i.key));
}

async function dispatch(admin: any, items: Item[], dryRun: boolean): Promise<Result> {
  const batch = items.slice(0, CAP);
  const sample = batch.slice(0, 5).map(i => i.email);
  if (dryRun) return { planned: items.length, sent: 0, sample };
  let sent = 0;
  for (const it of batch) {
    const html = brandedEmail({ heading: it.subject, bodyHtml: it.bodyHtml, ctaText: "Open the Student Portal", ctaHref: `${PORTAL}/auth/login` });
    const r = await sendEmail({ to: it.email, subject: `${it.subject} — S&D Prophetic School`, html });
    if (r.ok) { await admin.from("comms_log").insert({ student_id: it.student_id, automation_key: it.key }); sent++; }
    await sleep(SEND_DELAY);
  }
  return { planned: items.length, sent, sample };
}

// 1) Welcome follow-up ~3 days after admission (day-0 welcome is sent at onboarding).
async function welcome(admin: any, dryRun: boolean): Promise<Result> {
  const since = new Date(Date.now() - 14 * DAY).toISOString();
  const until = new Date(Date.now() - 3 * DAY).toISOString();
  const { data } = await admin.from("profiles").select("id,email,full_name")
    .eq("role", "student").eq("enrollment_status", "active").gte("created_at", since).lte("created_at", until);
  const items: Item[] = (data ?? []).filter((s: any) => s.email).map((s: any) => ({
    student_id: s.id, email: s.email, key: "welcome_d3",
    subject: "Getting started at S&D",
    bodyHtml: `<p>Dear ${first(s.full_name)},</p><p>You're a few days into the Sons &amp; Daughters of Prophets Prophetic Training School. Log in, begin with the Welcome module, and start your first course. Questions? Send us a message right from your portal.</p>`,
  }));
  return dispatch(admin, await filterUnsent(admin, items), dryRun);
}

// 2) Exam-due reminders — enrolled students with an un-submitted assessment due within 2 days.
async function exam(admin: any, dryRun: boolean): Promise<Result> {
  const now = new Date().toISOString();
  const soon = new Date(Date.now() + 2 * DAY).toISOString();
  const { data: assessments } = await admin.from("assessments").select("id,title,course_id,due_date")
    .eq("is_published", true).not("due_date", "is", null).gte("due_date", now).lte("due_date", soon);
  const items: Item[] = [];
  for (const a of assessments ?? []) {
    const [{ data: enr }, { data: subs }] = await Promise.all([
      admin.from("enrollments").select("student_id").eq("course_id", a.course_id),
      admin.from("assessment_submissions").select("student_id").eq("assessment_id", a.id),
    ]);
    const submitted = new Set((subs ?? []).map((s: any) => s.student_id));
    const ids = Array.from(new Set((enr ?? []).map((e: any) => e.student_id))).filter((id: any) => !submitted.has(id));
    if (!ids.length) continue;
    const { data: profs } = await admin.from("profiles").select("id,email,full_name").in("id", ids).eq("role", "student");
    const due = new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "full" });
    for (const p of profs ?? []) if (p.email) items.push({
      student_id: p.id, email: p.email, key: `exam_${a.id}`,
      subject: `Reminder: ${a.title} is due`,
      bodyHtml: `<p>Dear ${first(p.full_name)},</p><p>A reminder that <strong>${escapeHtml(a.title)}</strong> is due on <strong>${escapeHtml(due)}</strong> and you haven't submitted yet. Log in and complete it before the deadline.</p>`,
    });
  }
  return dispatch(admin, await filterUnsent(admin, items), dryRun);
}

// 3) Year-2 unlock — students who completed all published Year-1 lessons; notify + enroll Year 2.
async function year2(admin: any, dryRun: boolean): Promise<Result> {
  const { data: y1c } = await admin.from("courses").select("id").eq("year", 1).eq("is_published", true);
  const y1 = (y1c ?? []).map((c: any) => c.id);
  if (!y1.length) return { planned: 0, sent: 0 };
  const { data: y1l } = await admin.from("lessons").select("id").in("course_id", y1).eq("is_published", true);
  const lessonIds = (y1l ?? []).map((l: any) => l.id);
  if (!lessonIds.length) return { planned: 0, sent: 0 };
  const { data: students } = await admin.from("profiles").select("id,email,full_name")
    .eq("role", "student").eq("enrollment_status", "active").eq("current_year", 1);
  const sids = (students ?? []).map((s: any) => s.id);
  if (!sids.length) return { planned: 0, sent: 0 };
  const { data: prog } = await admin.from("lesson_progress").select("student_id")
    .eq("status", "completed").in("lesson_id", lessonIds).in("student_id", sids);
  const counts: Record<string, number> = {};
  for (const p of prog ?? []) counts[p.student_id] = (counts[p.student_id] || 0) + 1;
  const qualified = (students ?? []).filter((s: any) => (counts[s.id] || 0) >= lessonIds.length && s.email);
  let items: Item[] = qualified.map((s: any) => ({
    student_id: s.id, email: s.email, key: "year2_unlock",
    subject: "Year 2 is unlocked",
    bodyHtml: `<p>Dear ${first(s.full_name)},</p><p>Congratulations — you have completed Year 1. Your Year 2 courses (Diploma in NT Prophecy) are now unlocked in your portal. Press on.</p>`,
  }));
  items = await filterUnsent(admin, items);
  if (!dryRun && items.length) {
    const { data: y2c } = await admin.from("courses").select("id").eq("year", 2).eq("is_published", true);
    const y2 = (y2c ?? []).map((c: any) => c.id);
    for (const it of items.slice(0, CAP)) {
      if (y2.length) await admin.from("enrollments").upsert(y2.map((cid: string) => ({ student_id: it.student_id, course_id: cid })), { onConflict: "student_id,course_id" });
      await admin.from("profiles").update({ current_year: 2 }).eq("id", it.student_id);
    }
  }
  return dispatch(admin, items, dryRun);
}

// 4) Inactivity nudge — active students who haven't signed in for 14+ days (re-nudged at most every 14 days).
async function inactivity(admin: any, dryRun: boolean): Promise<Result> {
  const DAYS = 14;
  const cutoff = Date.now() - DAYS * DAY;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const lastSignIn: Record<string, number | null> = {};
  for (const u of list?.users ?? []) lastSignIn[u.id] = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null;
  const { data: students } = await admin.from("profiles").select("id,email,full_name").eq("role", "student").eq("enrollment_status", "active");
  const items: Item[] = (students ?? []).filter((s: any) => {
    const t = lastSignIn[s.id];
    return s.email && t != null && t < cutoff;
  }).map((s: any) => ({
    student_id: s.id, email: s.email, key: "inactivity",
    subject: "We miss you at S&D",
    bodyHtml: `<p>Dear ${first(s.full_name)},</p><p>We noticed you haven't logged in for a while. Your courses are waiting — a few minutes a day keeps you moving toward your certificate. Jump back in whenever you can.</p>`,
  }));
  return dispatch(admin, await filterUnsent(admin, items, DAYS), dryRun);
}

export async function runComms({ dryRun = false, only }: { dryRun?: boolean; only?: string } = {}) {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("school_settings").select("key,value")
    .in("key", ["auto_welcome", "auto_exam", "auto_year2", "auto_inactivity"]);
  const on = (k: string) => (settings ?? []).find((s: any) => s.key === k)?.value === "true";

  const report: Record<string, Result> = {};
  const run = (k: string) => !only || only === k;
  if (run("welcome") && (dryRun || on("auto_welcome"))) report.welcome = await welcome(admin, dryRun);
  if (run("exam") && (dryRun || on("auto_exam"))) report.exam = await exam(admin, dryRun);
  if (run("year2") && (dryRun || on("auto_year2"))) report.year2 = await year2(admin, dryRun);
  if (run("inactivity") && (dryRun || on("auto_inactivity"))) report.inactivity = await inactivity(admin, dryRun);
  return report;
}
