import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    username?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
  }
}
