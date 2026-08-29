import type { AccountRole } from "@/lib/auth-types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AccountRole;
      hasJoinedTournament: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: AccountRole;
    hasJoinedTournament?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AccountRole;
    hasJoinedTournament?: boolean;
  }
}
