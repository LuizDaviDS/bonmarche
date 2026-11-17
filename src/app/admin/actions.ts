"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  message: string;
};

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe sua senha.").max(128),
});

export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      message: result.error.issues[0]?.message ?? "Confira os dados informados.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error || !data.user) {
    return { message: "E-mail ou senha inválidos." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      message: "Não foi possível verificar a autorização. Tente novamente.",
    };
  }

  if (!profile) {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      throw new Error("Não foi possível encerrar a sessão sem autorização.");
    }

    return { message: "Esta conta não tem acesso ao painel administrativo." };
  }

  redirect("/admin");
}

export async function signOutAction() {
  const profile = await getAdmin();

  if (!profile) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
  }

  redirect("/admin/login");
}
