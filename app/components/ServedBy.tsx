import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default function ServedBy() {
  headers();
  const hostId = process.env.EE_HOST_ID ?? "unknown";
  return (
    <div className="flex flex-row justify-center items-center bg-slate-50 pb-2 pt-20 text-slate-900">
      Proudly served by:
      <span className="accent ml-1">{hostId}</span>
    </div>
  );
}
