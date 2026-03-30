"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

type Tab = "login" | "register";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const initialTab = (searchParams.get("tab") as Tab) ?? "login";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? t.login.errRegistrationFailed);
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t.login.errInvalidCredentials);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t.login.errSomethingWrong);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 justify-center">
        <div className="w-9 h-9 rounded-lg bg-cyan/10 flex items-center justify-center border border-cyan/20">
          <span className="text-cyan text-base font-black">H</span>
        </div>
        <div>
          <p className="text-base font-black text-foreground leading-none">HoySeVe</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
            {t.login.tagline}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-black/50">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-8">
          {(["login", "register"] as Tab[]).map((tabName) => (
            <button
              key={tabName}
              onClick={() => { setTab(tabName); setError(null); }}
              className={cn(
                "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                tab === tabName
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tabName === "login" ? t.login.tabLogin : t.login.tabRegister}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">
                 {t.login.labelName}
               </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t.login.placeholderName}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">
               {t.login.labelEmail}
             </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t.login.placeholderEmail}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all"
            />
          </div>

          <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">
               {t.login.labelPassword}
             </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={t.login.placeholderPassword}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95",
              "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                {tab === "login" ? t.login.signingIn : t.login.creatingAccount}
              </span>
            ) : tab === "login" ? (
              t.login.signIn
            ) : (
              t.login.createAccount
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            {t.login.orDivider}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 text-sm font-medium text-foreground transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z" />
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z" />
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31Z" />
          </svg>
          {t.login.continueGoogle}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {tab === "login" ? (
            <>
              {t.login.noAccount}{" "}
              <button onClick={() => setTab("register")} className="text-primary hover:underline">
                {t.login.signUp}
              </button>
            </>
          ) : (
            <>
              {t.login.alreadyAccount}{" "}
              <button onClick={() => setTab("login")} className="text-primary hover:underline">
                {t.login.signInLink}
              </button>
            </>
          )}
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground/50 mt-6">
        <Link href="/" className="hover:text-muted-foreground transition-colors">
          {t.login.backHome}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
