import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = "bonmarche-media";
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
} as const;

export type ValidatedMedia = {
  bytes: Uint8Array;
  extension: string;
  mime: keyof typeof MIME_EXTENSION;
};

export type MediaInput =
  | { ok: true; media: ValidatedMedia | null }
  | { ok: false; message: string };

export async function validateMediaInput(
  formData: FormData,
  fieldName: string,
): Promise<MediaInput> {
  const entries = formData.getAll(fieldName);
  if (entries.length > 1) {
    return { ok: false, message: "Envie no máximo uma imagem." };
  }
  const entry = entries[0] ?? null;

  if (entry === null || (entry instanceof File && entry.size === 0)) {
    return { ok: true, media: null };
  }

  if (!(entry instanceof File)) {
    return { ok: false, message: "O arquivo enviado é inválido." };
  }

  if (entry.size === 0 || entry.size > MEDIA_MAX_BYTES) {
    return {
      ok: false,
      message: "A imagem deve ter conteúdo e no máximo 5 MiB.",
    };
  }

  const bytes = new Uint8Array(await entry.arrayBuffer());
  const extension = entry.name.split(".").pop()?.toLowerCase() ?? "";
  let detectedMime: keyof typeof MIME_EXTENSION | null = null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    detectedMime = "image/jpeg";
  } else if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    detectedMime = "image/png";
  } else if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    detectedMime = "image/webp";
  }

  const allowedExtensions: readonly string[] = detectedMime
    ? MIME_EXTENSION[detectedMime]
    : [];
  if (
    !detectedMime ||
    entry.type !== detectedMime ||
    !allowedExtensions.includes(extension)
  ) {
    return {
      ok: false,
      message: "Use uma imagem JPEG, PNG ou WebP com tipo e extensão correspondentes.",
    };
  }

  return { ok: true, media: { bytes, extension, mime: detectedMime } };
}

export async function uploadMedia(
  supabase: SupabaseClient,
  media: ValidatedMedia,
): Promise<{ path: string } | { error: string }> {
  const path = `${randomUUID()}.${media.extension}`;
  const buffer = new ArrayBuffer(media.bytes.byteLength);
  new Uint8Array(buffer).set(media.bytes);
  const body = new Blob([buffer], { type: media.mime });
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, body, { contentType: media.mime, upsert: false });

  return error ? { error: "Não foi possível enviar a imagem." } : { path };
}

export async function removeUploadedMedia(
  supabase: SupabaseClient,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  return !error;
}

export async function removeMediaIfUnused(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<boolean> {
  if (!path) return true;

  const checks = await Promise.all([
    supabase.from("products").select("id").eq("image_path", path).limit(1),
    supabase.from("categories").select("id").eq("image_path", path).limit(1),
    supabase.from("store_settings").select("id").eq("logo_path", path).limit(1),
  ]);

  if (checks.some(({ error, data }) => error || (data?.length ?? 0) > 0)) {
    return false;
  }

  return removeUploadedMedia(supabase, path);
}
