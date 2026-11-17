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

const uuidSchema = z.string().uuid("O registro informado é inválido.");
const productSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]),
  name: z.string().trim().min(1, "Informe o nome do produto.").max(120),
  description: z.string().trim().max(2000).transform((value) => value || null),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,8}(?:[.,]\d{1,2})?$/, "Informe um preço válido, maior ou igual a zero.")
    .transform((value) => value.replace(",", ".")),
  category_id: z.string().uuid("Escolha uma categoria válida."),
  sort_order: z
    .string()
    .regex(/^\d{1,6}$/, "A ordem deve ser um número inteiro não negativo.")
    .transform(Number),
});

export type ProductFormValues = {
  id: string;
  name: string;
  description: string;
  price: string;
  category_id: string;
  sort_order: string;
  available: boolean;
  featured: boolean;
  remove_image: boolean;
};

export type ProductActionState = AdminActionState & {
  values: ProductFormValues;
};

function getProductFormValues(formData: FormData): ProductFormValues {
  const text = (name: string, fallback = "") => {
    const value = formData.get(name);
    return typeof value === "string" ? value : fallback;
  };

  return {
    id: text("id"),
    name: text("name"),
    description: text("description"),
    price: text("price"),
    category_id: text("category_id"),
    sort_order: text("sort_order", "0"),
    available: formData.get("available") === "on",
    featured: formData.get("featured") === "on",
    remove_image: formData.get("remove_image") === "on",
  };
}

function actionResult(
  status: AdminActionState["status"],
  message: string,
): AdminActionState {
  return { status, message };
}

function invalidMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Confira os dados informados.";
}

async function revalidateProductData() {
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function saveProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();
  const values = getProductFormValues(formData);
  const result = (
    status: AdminActionState["status"],
    message: string,
  ): ProductActionState => ({ status, message, values });

  const parsed = productSchema.safeParse({
    id: values.id,
    name: values.name,
    description: values.description,
    price: values.price,
    category_id: values.category_id,
    sort_order: values.sort_order,
  });

  if (!parsed.success) {
    return result("error", invalidMessage(parsed.error));
  }

  const mediaInput = await validateMediaInput(formData, "image");
  if (!mediaInput.ok) return result("error", mediaInput.message);

  const supabase = await createClient();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.category_id)
    .maybeSingle();

  if (categoryError || !category) {
    return result("error", "A categoria escolhida não está disponível.");
  }

  let uploadedPath: string | null = null;
  if (mediaInput.media) {
    const uploadResult = await uploadMedia(supabase, mediaInput.media);
    if ("error" in uploadResult) {
      return result("error", uploadResult.error);
    }
    uploadedPath = uploadResult.path;
  }

  const removeImage = values.remove_image;
  const productValues = {
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    category_id: parsed.data.category_id,
    sort_order: parsed.data.sort_order,
    available: formData.get("available") === "on",
    featured: formData.get("featured") === "on",
  };

  let oldImagePath: string | null = null;
  let databaseError = false;

  if (parsed.data.id) {
    const { data: current, error: currentError } = await supabase
      .from("products")
      .select("image_path")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (currentError || !current) {
      const uploadRemoved = uploadedPath
        ? await removeUploadedMedia(supabase, uploadedPath)
        : true;
      return result(
        "error",
        uploadRemoved
          ? "Não foi possível localizar esse produto."
          : "Não foi possível localizar o produto nem limpar o novo upload; verifique os arquivos do bucket.",
      );
    }
    oldImagePath = current.image_path;

    const nextImagePath = uploadedPath ?? (removeImage ? null : oldImagePath);
    const { data, error } = await supabase
      .from("products")
      .update({ ...productValues, image_path: nextImagePath })
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    databaseError = Boolean(error || !data);
  } else {
    const { error } = await supabase
      .from("products")
      .insert({ ...productValues, image_path: uploadedPath });
    databaseError = Boolean(error);
  }

  if (databaseError) {
    const uploadRemoved = uploadedPath
      ? await removeUploadedMedia(supabase, uploadedPath)
      : true;
    return result(
      "error",
      uploadRemoved
        ? "Não foi possível salvar o produto. Confira os dados e tente novamente."
        : "Não foi possível salvar o produto nem limpar o novo upload; verifique os arquivos do bucket.",
    );
  }

  await revalidateProductData();

  const imageWasReplaced =
    Boolean(uploadedPath) || (removeImage && !mediaInput.media);
  const cleanupSucceeded =
    imageWasReplaced && oldImagePath
      ? await removeMediaIfUnused(supabase, oldImagePath)
      : true;

  return result(
    "success",
    cleanupSucceeded
      ? "Produto salvo com sucesso."
      : "Produto salvo. Não foi possível remover a imagem anterior; ela foi preservada.",
  );
}

const productIdSchema = z.object({
  id: uuidSchema,
});

export async function setProductAvailabilityAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = productIdSchema.extend({
    available: z.enum(["true", "false"]),
  }).safeParse({
    id: formData.get("id"),
    available: formData.get("available"),
  });
  if (!parsed.success) return actionResult("error", invalidMessage(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ available: parsed.data.available === "true" })
    .eq("id", parsed.data.id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionResult("error", "Não foi possível atualizar a disponibilidade.");
  }

  await revalidateProductData();
  return actionResult("success", "Disponibilidade atualizada.");
}

export async function setProductArchivedAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = productIdSchema.extend({
    archived: z.enum(["true", "false"]),
  }).safeParse({
    id: formData.get("id"),
    archived: formData.get("archived"),
  });
  if (!parsed.success) return actionResult("error", invalidMessage(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      archived_at:
        parsed.data.archived === "true" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionResult("error", "Não foi possível alterar o arquivamento.");
  }

  await revalidateProductData();
  return actionResult(
    "success",
    parsed.data.archived === "true" ? "Produto arquivado." : "Produto restaurado.",
  );
}

export async function deleteProductAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = productIdSchema
    .extend({
      confirmed: z.literal("yes", {
        error: "Confirme a exclusão definitiva.",
      }),
    })
    .safeParse({
      id: formData.get("id"),
      confirmed: formData.get("confirmed"),
    });
  if (!parsed.success) return actionResult("error", invalidMessage(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", parsed.data.id)
    .select("image_path")
    .maybeSingle();

  if (error || !data) {
    return actionResult("error", "Não foi possível excluir o produto.");
  }

  await revalidateProductData();
  const removed = await removeMediaIfUnused(supabase, data.image_path);
  return actionResult(
    "success",
    removed
      ? "Produto excluído definitivamente."
      : "Produto excluído. A imagem foi preservada porque não pôde ser removida com segurança.",
  );
}
