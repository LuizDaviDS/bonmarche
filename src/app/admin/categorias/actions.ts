"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AdminActionState } from "@/app/admin/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { removeMediaIfUnused } from "@/lib/admin/media";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("A categoria informada é inválida.");
const categorySchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]),
  name: z.string().trim().min(1, "Informe o nome da categoria.").max(100),
  description: z.string().trim().max(2000).transform((value) => value || null),
  sort_order: z
    .string()
    .regex(/^\d{1,6}$/, "A ordem deve ser um número inteiro não negativo.")
    .transform(Number),
});

function result(
  status: AdminActionState["status"],
  message: string,
): AdminActionState {
  return { status, message };
}

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Confira os dados informados.";
}

function slugFromName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveCategoryAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    sort_order: formData.get("sort_order") ?? "0",
  });
  if (!parsed.success) return result("error", validationMessage(parsed.error));

  const slug = slugFromName(parsed.data.name);
  if (!slug) {
    return result("error", "Use um nome que possa gerar um endereço válido.");
  }

  const supabase = await createClient();
  const values = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    sort_order: parsed.data.sort_order,
  };
  const query = parsed.data.id
    ? supabase
        .from("categories")
        .update(values)
        .eq("id", parsed.data.id)
        .select("id")
        .maybeSingle()
    : supabase.from("categories").insert(values).select("id").maybeSingle();

  const { data, error } = await query;
  if (error || !data) {
    return result(
      "error",
      error?.code === "23505"
        ? "Já existe uma categoria com esse nome/endereço."
        : "Não foi possível salvar a categoria. Confira os dados e tente novamente.",
    );
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return result("success", "Categoria salva com sucesso.");
}

export async function setCategoryArchivedAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      id: uuidSchema,
      archived: z.enum(["true", "false"]),
    })
    .safeParse({
      id: formData.get("id"),
      archived: formData.get("archived"),
    });
  if (!parsed.success) {
    return result("error", validationMessage(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      archived_at:
        parsed.data.archived === "true" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return result("error", "Não foi possível alterar o arquivamento.");
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return result(
    "success",
    parsed.data.archived === "true"
      ? "Categoria arquivada; os produtos associados foram preservados."
      : "Categoria restaurada.",
  );
}

export async function hardDeleteCategoryAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = z
    .object({
      id: uuidSchema,
      mode: z.enum(["delete_products", "transfer"]),
      target_category_id: z.union([z.literal(""), z.string().uuid()]),
      confirmed: z.literal("yes", {
        error: "Confirme a exclusão definitiva.",
      }),
    })
    .superRefine((data, context) => {
      if (data.mode === "transfer" && !data.target_category_id) {
        context.addIssue({
          code: "custom",
          message: "Escolha a categoria de destino.",
          path: ["target_category_id"],
        });
      }
      if (data.mode === "transfer" && data.id === data.target_category_id) {
        context.addIssue({
          code: "custom",
          message: "A categoria de destino deve ser diferente.",
          path: ["target_category_id"],
        });
      }
    })
    .safeParse({
      id: formData.get("id"),
      mode: formData.get("mode"),
      target_category_id: formData.get("target_category_id") ?? "",
      confirmed: formData.get("confirmed"),
    });

  if (!parsed.success) {
    return result("error", validationMessage(parsed.error));
  }

  const supabase = await createClient();
  const { data: mediaPaths, error } = await supabase.rpc(
    "admin_delete_category",
    {
      p_category_id: parsed.data.id,
      p_mode: parsed.data.mode,
      p_target_category_id:
        parsed.data.mode === "transfer"
          ? parsed.data.target_category_id
          : null,
    },
  );

  if (error || !Array.isArray(mediaPaths)) {
    return result(
      "error",
      error?.code === "42883"
        ? "A migração de exclusão atômica de categorias ainda não foi aplicada."
        : "Não foi possível excluir a categoria. Ela e seus produtos foram mantidos.",
    );
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
  revalidatePath("/");

  const cleanupResults = await Promise.all(
    [...new Set((mediaPaths as string[]).filter(Boolean))].map((path) =>
      removeMediaIfUnused(supabase, path),
    ),
  );
  const cleanupOk = cleanupResults.every(Boolean);
  redirect(
    cleanupOk
      ? "/admin/categorias?excluida=1"
      : "/admin/categorias?excluida=1&imagens=preservadas",
  );
}
