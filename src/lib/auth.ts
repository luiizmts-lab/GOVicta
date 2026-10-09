import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Re-verifies the session inside the Server Action itself. The proxy
 * (src/proxy.ts) already gates page navigation, but Next.js docs are explicit
 * that Server Functions aren't a separate route in that chain — a matcher
 * change or a direct POST to the action can bypass it — so every mutating
 * action calls this instead of trusting the page got there legitimately.
 */
export async function requireUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Sessão expirada ou inválida. Faça login novamente.");
  }
  return data.user.id;
}
