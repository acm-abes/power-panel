/** @format */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserRoles } from "@/lib/get-user-roles";
import { headers } from "next/headers";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { ThemeDropdown } from "./theme-dropdown";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const { userRoles, isAdmin, isJudge, isMentor, isParticipant } =
    await getUserRoles(session.user.id);

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-base md:text-lg font-semibold hover:text-primary whitespace-nowrap"
            >
              SAH Power Panel
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <NavLinks
                isAdmin={isAdmin}
                isJudge={isJudge}
                isMentor={isMentor}
                isParticipant={isParticipant}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeDropdown />
            <UserMenu
              userName={session.user.name || "User"}
              userRoles={userRoles}
            />

            {/* Mobile Navigation */}
            <MobileNav
              isAdmin={isAdmin}
              isJudge={isJudge}
              isMentor={isMentor}
              isParticipant={isParticipant}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
