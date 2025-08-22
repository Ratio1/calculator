"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navItems = [
  { href: "/", label: "ROI Calculator" },
  { href: "/max-poai", label: "Max PoAI Calculator" },
];

export default function Navbar() {
  return (
    <nav className="bg-slate-50 sticky top-0 z-50 border-b border-slate-200/60 shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Home">
          <Image
            src="/ratio1_calculator.svg"
            alt="Logo"
            width={128}
            height={32}
            priority
            className="h-6 w-auto lg:h-10"
          />
        </Link>

        <div className="flex flex-row items-center gap-6">
          {/* Center: nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <ul className="flex items-center gap-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-medium linkstyle transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: CTA + mobile menu trigger */}
          <div className="flex items-center">
            <Link
              href="https://app.ratio1.ai/"
              target="_blank"
              rel="noreferrer"
              className="sm:rounded-3xl rounded-2xl sm:px-6 sm:py-3 py-1 px-2 text-base font-semibold text-white button"
            >
              Buy License
            </Link>

            {/* Mobile menu (collapses center content) */}
            <MobileMenu navItems={navItems} />
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileMenu({
  navItems,
}: {
  navItems: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = "mobile-nav-popover";

  return (
    <div className="relative ml-2 md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-2xl select-none",
          "border border-slate-300 bg-white text-slate-700 hover:text-slate-900",
          "transition-colors",
          // remove ALL focus/active visual effects
          "outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 active:ring-0 ring-0",
          "focus:ring-offset-0 focus-visible:ring-offset-0",
          "[-webkit-tap-highlight-color:transparent]",
        ].join(" ")}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>

        {!open ? (
          // Hamburger
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Close (X)
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          className="absolute right-0 top-full mt-4 w-56 rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-md z-50"
          role="menu"
        >
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
