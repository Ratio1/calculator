"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navItems = [{ href: "/", label: "Roi" }];

export default function Navbar() {
  return (
    <nav className="bg-slate-50 sticky top-0 z-50 border-b border-slate-200/60 shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Left: logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Home">
          <Image
            src="/ratio1_calculator.svg"
            alt="Logo"
            width={128}
            height={32}
            priority
            className="h-9 w-auto lg:h-10"
          />
        </Link>
        {/* Center: nav links */}
        {/*
        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div> */}

        {/* Right: CTA + mobile menu trigger */}
        <div className="flex items-center gap-3">
          <Link
            href="https://app.ratio1.ai/"
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl px-6 py-3 text-base font-semibold text-white button"
          >
            Buy License
          </Link>

          {/* Mobile menu (collapses center content) */}
          <MobileMenu navItems={navItems} />
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

  return (
    <div className="md:hidden relative">
      {/* <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:text-slate-900"
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        Hamburger 
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button> */}

      {open && (
        <div className="absolute right-0 top-11 w-56 rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-lg">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setOpen(false)}
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
