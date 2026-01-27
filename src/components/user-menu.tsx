/** @format */

"use client";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { RoleName } from "@/hooks/use-user-roles";

interface UserMenuProps {
  userName: string;
  userRoles: RoleName[];
}

export function UserMenu({ userName, userRoles }: UserMenuProps) {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium">{userName}</span>
        {userRoles.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {userRoles.join(", ")}
          </span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
