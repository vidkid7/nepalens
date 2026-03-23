"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/search/SearchBar";
import Dropdown, { DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import Avatar from "@/components/ui/Avatar";
import NotificationDropdown from "@/components/ui/NotificationDropdown";

const NAV_LINKS = [
  { href: "/discover", label: "Explore" },
  { href: "/search?tab=videos", label: "Videos" },
  { href: "/collections", label: "Collections" },
  { href: "/challenges", label: "Challenges" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/pricing", label: "Pricing" },
  { href: "/license", label: "License" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // On homepage, start transparent; elsewhere, always solid
  const isHomepage = pathname === "/";
  const showTransparent = isHomepage && !scrolled;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  const user = session?.user as any;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-fixed transition-all duration-300 ${
          showTransparent
            ? "bg-gradient-to-b from-black/50 via-black/25 to-transparent"
            : "bg-white border-b border-surface-200 shadow-xs"
        }`}
      >
        <nav className="container-app h-16 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 7h3v9H2V7zm5.5-3h3v12h-3V4zM13 10h3v6h-3v-6z" fill="white" />
              </svg>
            </div>
            <span className={`text-lg font-bold hidden sm:block transition-colors ${showTransparent ? "text-white" : "text-surface-900"}`}>
              NepaLens
            </span>
          </Link>

          {/* Search bar — always visible when scrolled or not on homepage */}
          <div
            className={`flex-1 max-w-2xl transition-all duration-200 ${
              showTransparent ? "opacity-0 pointer-events-none w-0" : "opacity-100"
            }`}
          >
            <SearchBar compact />
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5 ml-auto">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-caption font-medium transition-colors ${
                  showTransparent
                    ? "text-white/85 hover:text-white hover:bg-white/10"
                    : pathname === href
                    ? "text-surface-900 bg-surface-100"
                    : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            {session ? (
              <>
                {/* Upload button */}
                <Link
                  href="/upload"
                  className={`hidden sm:inline-flex btn btn-sm ${
                    showTransparent ? "btn-white" : "btn-primary"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload
                </Link>

                <NotificationDropdown transparent={showTransparent} />

                {/* User dropdown */}
                <Dropdown
                  align="right"
                  trigger={
                    <button className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-surface-200 transition-all">
                      <Avatar
                        src={user?.image}
                        name={user?.name || user?.username}
                        size="sm"
                      />
                    </button>
                  }
                >
                  <div className="px-3.5 py-2.5 border-b border-surface-100">
                    <p className="text-caption font-medium text-surface-900 truncate">{user?.name}</p>
                    <p className="text-micro text-surface-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownItem onClick={() => {}}>
                      <Link href={`/profile/${user?.username || "me"}`} className="block w-full">
                        My Profile
                      </Link>
                    </DropdownItem>
                    <DropdownItem onClick={() => {}}>
                      <Link href="/collections" className="block w-full">
                        Collections
                      </Link>
                    </DropdownItem>
                    <DropdownItem onClick={() => {}}>
                      <Link href="/settings" className="block w-full">
                        Settings
                      </Link>
                    </DropdownItem>
                    {user?.isAdmin && (
                      <DropdownItem onClick={() => {}}>
                        <Link href="/admin" className="block w-full">
                          Admin Panel
                        </Link>
                      </DropdownItem>
                    )}
                  </div>
                  <DropdownDivider />
                  <DropdownItem onClick={() => signOut()} danger>
                    Log out
                  </DropdownItem>
                </Dropdown>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`btn btn-sm ${
                    showTransparent ? "btn-ghost text-white hover:bg-white/10" : "btn-ghost"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`btn btn-sm ${showTransparent ? "btn-white" : "btn-primary"}`}
                >
                  Join
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                showTransparent
                  ? "text-white hover:bg-white/10"
                  : "text-surface-600 hover:bg-surface-100"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[1029] lg:hidden animate-fade-in" onClick={closeMobile} />
          <div className="fixed top-16 left-0 right-0 bg-white z-[1030] lg:hidden border-b border-surface-200 shadow-lg animate-fade-in-down max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4 border-b border-surface-100">
              <SearchBar compact />
            </div>
            <nav className="py-2">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className={`block px-6 py-3 text-body font-medium transition-colors ${
                    pathname === href ? "text-brand bg-brand-50" : "text-surface-700 hover:bg-surface-50"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {session && (
                <Link
                  href="/upload"
                  onClick={closeMobile}
                  className="block px-6 py-3 text-body font-medium text-brand"
                >
                  Upload
                </Link>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      {!isHomepage && <div className="h-16" />}
    </>
  );
}
