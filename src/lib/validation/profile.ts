// ─── Profile update validation ────────────────────────────────────────────────
// Shared Zod schema used by both server API and client-side form validation.

import { z } from "zod";
import { normalizeUsername, isValidFormat, isReservedUsername } from "./username";

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "Máximo 50 caracteres"),
  username: z
    .string()
    .transform(normalizeUsername)
    .refine(isValidFormat, {
      message: "Solo letras, números y guiones bajos (3-20 caracteres)",
    })
    .refine((v) => !isReservedUsername(v), {
      message: "Ese username no está disponible",
    }),
  bio: z
    .string()
    .max(160, "Máximo 160 caracteres")
    .nullable()
    .optional(),
  avatarUrl: z.string().url("URL de avatar inválida").optional().nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
