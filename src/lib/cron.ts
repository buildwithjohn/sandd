import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Authorize a scheduled (cron) request.
 *
 * Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when a
 * CRON_SECRET env var is set. We also accept `?secret=` for manual testing
 * (curl / browser) so the endpoints can be verified without the header.
 * If CRON_SECRET is not configured, requests are rejected (fail closed).
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
  } catch {
    /* ignore malformed url */
  }
  return false;
}

/**
 * Touch the database with a tiny read so the Supabase project registers
 * activity. On the free tier a project pauses after ~7 days of inactivity;
 * a periodic touch keeps it awake during breaks between cohorts.
 */
export async function touchDatabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("courses")
      .select("id", { count: "exact", head: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "unknown error" };
  }
}
