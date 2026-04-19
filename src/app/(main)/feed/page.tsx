import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <FeedClient />;
}
