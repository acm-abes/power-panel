/** @format */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface MobileNavProps {
  isAdmin: boolean;
  isJudge: boolean;
  isMentor: boolean;
  isParticipant: boolean;
}

export function MobileNav({
  isAdmin,
  isJudge,
  isMentor,
  isParticipant,
}: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  const closeSheet = () => setOpen(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-full max-w-100 px-3 flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6 flex-1 overflow-y-auto">
            <Link
              href="/dashboard"
              onClick={closeSheet}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                pathname === "/dashboard"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Dashboard
            </Link>

            {isJudge && (
              <Link
                href="/judges/evaluate"
                onClick={closeSheet}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                  pathname === "/judges/evaluate"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground",
                )}
              >
                Evaluate
              </Link>
            )}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2 border-t">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </p>
                </div>
                <Link
                  href="/admin/users"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/users"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Users
                </Link>
                <Link
                  href="/admin/teams"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/teams"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Teams
                </Link>
                <Link
                  href="/admin/judges"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/judges"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Judges
                </Link>
                <Link
                  href="/admin/results"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/results"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Results
                </Link>
                <Link
                  href="/admin/submissions"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/submissions"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Submissions
                </Link>
                <Link
                  href="/admin/analytics"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/analytics"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/email"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/admin/email"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Email
                </Link>
              </>
            )}

            {isMentor && (
              <>
                <div className="pt-4 pb-2 border-t">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mentor
                  </p>
                </div>
                <Link
                  href="/mentors/feedback"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/mentors/feedback"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  Give Feedback
                </Link>
              </>
            )}

            {isParticipant && (
              <>
                <div className="pt-4 pb-2 border-t">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Team
                  </p>
                </div>
                <Link
                  href="/teams/my-team"
                  onClick={closeSheet}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/teams/my-team"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  My Team
                </Link>
              </>
            )}
          </nav>

          <div className="border-t pt-4 mb-10">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
