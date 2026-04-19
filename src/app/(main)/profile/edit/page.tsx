import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/edit");
  }

  const [userRecord] = await db
    .select({
      name: users.name,
      username: users.username,
      bio: users.bio,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!userRecord) {
    redirect("/login");
  }

  const initialData = {
    name: userRecord.name ?? session.user.name ?? "",
    username: userRecord.username ?? session.user.username ?? "",
    bio: userRecord.bio ?? null,
    image: userRecord.image ?? session.user.image ?? null,
  };

  return (
    <section className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/profile"
          className="p-2 rounded-xl bg-[#1c2026] text-[#849396] hover:text-[#dfe2eb] transition-colors border border-white/5"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#dfe2eb]">Editar perfil</h1>
          <p className="text-sm text-[#849396]">Actualizá tu información pública</p>
        </div>
      </div>

      <ProfileEditForm initialData={initialData} />
    </section>
  );
}
