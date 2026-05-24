"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "../ui/mode-toggle";
import UserMenu from "./user-menu";

const links = [
  { to: "/", label: "Home" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/").filter(Boolean) || [];
  const isProfileRoute = pathParts.length === 1 && !["dashboard", "admin", "login"].includes(pathParts[0] ?? "");

  const shouldHideHeader =
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    isProfileRoute;

  if (shouldHideHeader) {
    return null;
  }


  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} href={to}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
