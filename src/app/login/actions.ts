"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function errorRedirect(message: string): never {
  redirect(`/login?erro=${encodeURIComponent(message)}`);
}

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) errorRedirect("Informe e-mail e senha.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    errorRedirect("E-mail ou senha inválidos.");
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    update: { email: data.user.email ?? email },
    create: { id: data.user.id, email: data.user.email ?? email },
  });

  redirect("/");
}

export async function cadastrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();

  if (!email || !senha) errorRedirect("Informe e-mail e senha.");
  if (senha.length < 6) errorRedirect("A senha precisa ter ao menos 6 caracteres.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password: senha });

  if (error || !data.user) {
    errorRedirect(error?.message ?? "Não foi possível criar o usuário.");
  }

  await prisma.profile.upsert({
    where: { id: data.user.id },
    update: { email: data.user.email ?? email, nome: nome || undefined },
    create: { id: data.user.id, email: data.user.email ?? email, nome: nome || null },
  });

  redirect("/");
}

export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
