/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  isAdmin: boolean;
  isJudge: boolean;
  isMentor: boolean;
  isParticipant: boolean;
}

export function NavLinks({
  isAdmin,
  isJudge,
  isMentor,
  isParticipant,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-foreground" : "text-muted-foreground",
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
            href="/admin/users"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/admin/users"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            Users
          </Link>
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
  );
}
