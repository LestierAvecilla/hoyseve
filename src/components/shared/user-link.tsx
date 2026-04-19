import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserLinkProps = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  userHandle: string | null;
};

export function UserLink({ userName, userAvatar, userHandle }: UserLinkProps) {
  const avatar = (
    <Avatar className="h-5 w-5 flex-shrink-0">
      <AvatarImage src={userAvatar ?? undefined} />
      <AvatarFallback className="text-[10px]">
        {userName[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  const name = (
    <span className="font-bold text-sm text-[#dfe2eb]">{userName}</span>
  );

  if (userHandle) {
    return (
      <Link
        href={`/profile/${userHandle}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {avatar}
        {name}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-2">
      {avatar}
      {name}
    </span>
  );
}
