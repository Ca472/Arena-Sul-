import "server-only";

import { redirect } from "next/navigation";

import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string;
  displayName: string;
  isDemo: boolean;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (getRuntimeMode() === "demo") {
    return {
      id: "demo-admin",
      email: "demo@arenasulsports.com",
      displayName: "Equipe Arena Sul (demonstração)",
      isDemo: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "Administrador",
    displayName: admin.display_name || user.email || "Administrador",
    isDemo: false,
  };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const mode = getRuntimeMode();

  if (mode === "misconfigured") {
    redirect("/admin/login?erro=configuracao");
  }

  const admin = await getAdminIdentity();
  if (!admin) {
    redirect("/admin/login?erro=acesso");
  }

  return admin;
}
