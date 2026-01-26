/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/use-user-roles";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { userRoles, isAdmin, isJudge, isMentor, isParticipant } =
    useUserRoles();

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold hover:text-primary">
              SAH Admin
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                Dashboard
              </Link>

              {isJudge && (
                <Link
                  href="/judges/evaluate"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/judges/evaluate"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Evaluate
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link
                    href="/admin/teams"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === "/admin/teams"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Teams
                  </Link>
                  <Link
                    href="/admin/judges"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === "/admin/judges"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Judges
                  </Link>
                  <Link
                    href="/admin/results"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      pathname === "/admin/results"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Results
                  </Link>
                </>
              )}

              {isMentor && (
                <Link
                  href="/mentors/feedback"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/mentors/feedback"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Give Feedback
                </Link>
              )}

              {isParticipant && (
                <Link
                  href="/teams/my-team"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/teams/my-team"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  My Team
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{session.user.name}</span>
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
        </div>
      </div>
    </nav>
  );
}
