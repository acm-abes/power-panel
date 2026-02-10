/** @format */

"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { RoleName } from "@/hooks/use-user-roles";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  userName: string;
  userRoles: RoleName[];
}

export function UserMenu({ userName, userRoles }: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
    router.replace("/sign-in");
  };

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium truncate max-w-25 sm:max-w-none">
          {userName}
        </span>
        {userRoles.length > 0 && (
          <span className="hidden sm:block text-xs text-muted-foreground">
            {userRoles.join(", ")}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="hidden sm:inline-flex"
      >
        Sign Out
      </Button>
    </div>
  );
}
