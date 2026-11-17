"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminActionState } from "@/app/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import {
  removeMediaIfUnused,
  removeUploadedMedia,
  uploadMedia,
  validateMediaInput,
} from "@/lib/admin/media";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do estabelecimento.").max(120),
  description: z.string().trim().max(2000).transform((value) => value || null),
  address: z.string().trim().max(500).transform((value) => value || null),
});

function result(
  status: AdminActionState["status"],
  message: string,
): AdminActionState {
  return { status, message };
}

export async function saveSettingsAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) {
    return result(
      "error",
      parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    );
  }

  const mediaInput = await validateMediaInput(formData, "logo");
  if (!mediaInput.ok) return result("error", mediaInput.message);

  const supabase = await createClient();
  const { data: settingsRows, error: settingsError } = await supabase
    .from("store_settings")
    .select("id, logo_path")
    .limit(2);

  if (settingsError || !settingsRows || settingsRows.length !== 1) {
    return result(
      "error",
      "Não foi possível confirmar o único registro de configurações. Nenhuma alteração foi feita.",
    );
  }

  let uploadedPath: string | null = null;
  if (mediaInput.media) {
    const uploadResult = await uploadMedia(supabase, mediaInput.media);
    if ("error" in uploadResult) return result("error", uploadResult.error);
    uploadedPath = uploadResult.path;
  }

  const current = settingsRows[0];
  const removeLogo = formData.get("remove_logo") === "on";
  const logoPath = uploadedPath ?? (removeLogo ? null : current.logo_path);
  const { data, error } = await supabase
    .from("store_settings")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      address: parsed.data.address,
      logo_path: logoPath,
    })
    .eq("id", current.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    const uploadRemoved = uploadedPath
      ? await removeUploadedMedia(supabase, uploadedPath)
      : true;
    return result(
      "error",
      uploadRemoved
        ? "Não foi possível salvar as configurações. Confira os dados e tente novamente."
        : "Não foi possível salvar as configurações nem limpar o novo upload; verifique os arquivos do bucket.",
    );
  }

  revalidatePath("/");
  const changedLogo =
    Boolean(uploadedPath) || (removeLogo && !mediaInput.media);
  const cleanupSucceeded =
    changedLogo && current.logo_path
      ? await removeMediaIfUnused(supabase, current.logo_path)
      : true;

  return result(
    "success",
    cleanupSucceeded
      ? "Configurações salvas com sucesso."
      : "Configurações salvas. O logotipo anterior foi preservado porque não pôde ser removido com segurança.",
  );
}
