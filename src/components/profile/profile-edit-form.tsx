"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { profileUpdateSchema } from "@/lib/validation/profile";
import { AvatarSelector } from "@/components/profile/avatar-selector";
import { normalizeUsername, isValidFormat } from "@/lib/validation/username";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileEditFormProps = {
  initialData: {
    name: string;
    username: string;
    bio: string | null;
    image: string | null;
  };
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [name, setName] = useState(initialData.name);
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.image);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameTimer, setUsernameTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);

  // ── Username availability debounce ──
  function handleUsernameChange(value: string) {
    setUsername(value);
    if (usernameTimer) clearTimeout(usernameTimer);

    const normalized = normalizeUsername(value);

    if (!normalized || normalized === initialData.username) {
      setUsernameStatus("idle");
      return;
    }

    if (!isValidFormat(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/${normalized}/available`);
        const json = await res.json();
        setUsernameStatus(res.ok && json.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 350);
    setUsernameTimer(timer);
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation via Zod
    const parsed = profileUpdateSchema.safeParse({
      name: name.trim(),
      username,
      bio: bio.trim() || null,
      avatarUrl: avatarUrl ?? undefined,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
      toast.error(msg);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();

      if (res.ok) {
        // Refresh session with updated name/image/username
        await updateSession({ name: json.user.name, username: json.user.username, image: json.user.image });
        toast.success("Perfil actualizado");
        router.push("/profile");
        router.refresh();
        return;
      }

      const code = json?.error?.code;
      if (code === "TOO_RECENTLY_CHANGED") {
        toast.error(json.error.message ?? "Debés esperar 30 días para cambiar el username");
      } else if (code === "TAKEN") {
        toast.error("Ese username ya está en uso");
        setUsernameStatus("taken");
      } else if (code === "VALIDATION_ERROR") {
        toast.error(json.error.message ?? "Datos inválidos");
      } else {
        toast.error("Error al guardar. Intentá de nuevo.");
      }
    } catch {
      toast.error("Error de red. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const bioLength = bio.length;
  const bioOverLimit = bioLength > 160;
  const isUsernameChanged = normalizeUsername(username) !== initialData.username;
  const canSubmit =
    !saving &&
    !bioOverLimit &&
    name.trim().length > 0 &&
    (!isUsernameChanged || usernameStatus === "available" || usernameStatus === "idle");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Avatar Selector ── */}
      <div className="bg-[#1c2026] rounded-2xl border border-white/5 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#dfe2eb] uppercase tracking-widest">
          Avatar
        </h2>
        <AvatarSelector
          currentAvatarUrl={avatarUrl}
          onAvatarChange={(url) => setAvatarUrl(url)}
        />
      </div>

      {/* ── Fields ── */}
      <div className="bg-[#1c2026] rounded-2xl border border-white/5 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#dfe2eb] uppercase tracking-widest">
          Información
        </h2>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-[#849396] font-bold">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="Tu nombre"
            className={cn(
              "w-full rounded-xl bg-[#262a31] border border-white/10 px-4 py-2.5",
              "text-sm text-[#dfe2eb] placeholder:text-[#849396]",
              "focus:outline-none focus:border-[#00e5ff]/50 focus:ring-2 focus:ring-[#00e5ff]/20",
              "transition-colors"
            )}
          />
          {name.trim().length === 0 && (
            <p className="text-xs text-rose-400">El nombre es obligatorio</p>
          )}
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-widest text-[#849396] font-bold">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849396] text-sm select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={20}
              placeholder="tu_username"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                "w-full rounded-xl bg-[#262a31] border border-white/10 pl-8 pr-4 py-2.5",
                "text-sm text-[#dfe2eb] placeholder:text-[#849396]",
                "focus:outline-none focus:border-[#00e5ff]/50 focus:ring-2 focus:ring-[#00e5ff]/20",
                "transition-colors"
              )}
            />
          </div>
          {/* Status */}
          {isUsernameChanged && usernameStatus === "checking" && (
            <p className="flex items-center gap-1.5 text-xs text-[#849396]">
              <Loader2 className="size-3 animate-spin" /> Verificando...
            </p>
          )}
          {isUsernameChanged && usernameStatus === "available" && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="size-3" /> Username disponible
            </p>
          )}
          {isUsernameChanged && usernameStatus === "taken" && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <XCircle className="size-3" /> Ese username ya está en uso
            </p>
          )}
          {usernameStatus === "invalid" && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400">
              <XCircle className="size-3" /> Solo letras, números y guiones bajos (3-20 caracteres)
            </p>
          )}
          <p className="text-[10px] text-[#849396]">Podés cambiarlo cada 30 días.</p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-widest text-[#849396] font-bold">
              Bio
            </label>
            <span
              className={cn(
                "text-xs font-mono",
                bioOverLimit ? "text-rose-400" : bioLength > 140 ? "text-amber-400" : "text-[#849396]"
              )}
            >
              {bioLength}/160
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Contá algo sobre vos..."
            rows={3}
            className={cn(
              "w-full rounded-xl bg-[#262a31] border px-4 py-2.5 resize-none",
              "text-sm text-[#dfe2eb] placeholder:text-[#849396]",
              "focus:outline-none focus:ring-2 transition-colors",
              bioOverLimit
                ? "border-rose-500/60 focus:ring-rose-500/20 focus:border-rose-500/60"
                : "border-white/10 focus:border-[#00e5ff]/50 focus:ring-[#00e5ff]/20"
            )}
          />
          {bioOverLimit && (
            <p className="text-xs text-rose-400">La bio no puede superar los 160 caracteres.</p>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 justify-end">
        <Link
          href="/profile"
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
            "bg-[#262a31] text-[#849396] hover:text-[#dfe2eb] hover:bg-[#31353c]"
          )}
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            "bg-gradient-to-br from-[#c3f5ff] to-[#00e5ff] text-[#001f24]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "active:scale-95 shadow-lg shadow-[#00e5ff]/20"
          )}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Guardando...
            </span>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </form>
  );
}
