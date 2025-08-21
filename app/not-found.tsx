import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Error",
  description:
    "The page or content you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-20">
      <div className="mx-auto max-w-3xl p-6 flex flex-col items-center justify-center text-center">
        {/* Error badge */}
        <section className="rounded-2xl bg-white p-8 shadow w-full">
          <div className="flex flex-col items-center gap-4">
            {/* 404 number */}
            <div className="text-7xl font-extrabold text-slate-700">404</div>

            {/* Heading */}
            <h1 className="text-2xl font-bold">Oops! Page Not Found</h1>

            {/* Message */}
            <p className="max-w-xl text-slate-500">
              We can’t seem to find the page you’re looking for. It may have
              been moved, renamed, or no longer exists.
            </p>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-slate-200" />

            {/* Helpful note box (same style as ROI sections) */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-3xl px-6 py-3 text-base font-semibold text-white button"
              >
                Go home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
