import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAdmin() {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError) {
    if (claimsError.name === "AuthSessionMissingError") {
      return null;
    }

    throw new Error("Não foi possível validar a sessão administrativa.");
  }

  const claims = data?.claims;
  const userId = claims?.sub;

  if (typeof userId !== "string") {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível verificar a autorização administrativa.");
  }

  return profile;
}

export async function requireAdmin() {
  const profile = await getAdmin();

  if (!profile) {
    redirect("/admin/login");
  }

  return profile;
}
