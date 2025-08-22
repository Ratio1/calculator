"use client";
import React, { useMemo, useState } from "react";

/* ----------------------------- DATA MODEL ----------------------------- */
type GCategory = "NONE" | "G-ENTRY" | "G-MED" | "G-HIGH" | "G-ULTRA";
type OSKind = "Linux" | "Windows" | "macOS";

type WorkerFlavor = {
  id: string;
  group: "Generic Apps" | "Services" | "Native Apps";
  name: string;
  cpu: number; // cores
  ram: number; // GB
  storageUnits: number; // 1 unit = 50 GiB
  supportsGpu: GCategory[];
  baseRevenue: number; // $/month (treated as "rewards" in UI)
};

type GpuExtraRule = {
  category: Exclude<GCategory, "NONE">;
  bonus: number; // $/month per job
  allowedWorkerIds: string[];
};

type OSReserve = { cpu: number; ram: number; storageGiB: number };

/* --------------------------- JOB CATALOG --------------------------- */
const WORKERS: WorkerFlavor[] = [
  {
    id: "ENTRY",
    group: "Generic Apps",
    name: "ENTRY",
    cpu: 1,
    ram: 2,
    storageUnits: 0,
    supportsGpu: [],
    baseRevenue: 11.25,
  },
  {
    id: "LOW1",
    group: "Generic Apps",
    name: "LOW1",
    cpu: 2,
    ram: 4,
    storageUnits: 0,
    supportsGpu: [],
    baseRevenue: 22.5,
  },
  {
    id: "LOW2",
    group: "Generic Apps",
    name: "LOW2",
    cpu: 2,
    ram: 8,
    storageUnits: 0,
    supportsGpu: [],
    baseRevenue: 30,
  },
  {
    id: "MED1",
    group: "Generic Apps",
    name: "MED1",
    cpu: 4,
    ram: 12,
    storageUnits: 0,
    supportsGpu: ["G-ENTRY"],
    baseRevenue: 57.5,
  },
  {
    id: "MED2",
    group: "Generic Apps",
    name: "MED2",
    cpu: 6,
    ram: 14,
    storageUnits: 0,
    supportsGpu: ["G-ENTRY", "G-MED"],
    baseRevenue: 87.5,
  },
  {
    id: "HIGH1",
    group: "Generic Apps",
    name: "HIGH1",
    cpu: 9,
    ram: 14,
    storageUnits: 0,
    supportsGpu: ["G-MED"],
    baseRevenue: 112.5,
  },
  {
    id: "HIGH2",
    group: "Generic Apps",
    name: "HIGH2",
    cpu: 12,
    ram: 30,
    storageUnits: 0,
    supportsGpu: ["G-MED", "G-HIGH"],
    baseRevenue: 160,
  },
  {
    id: "ULTRA1",
    group: "Generic Apps",
    name: "ULTRA1",
    cpu: 16,
    ram: 62,
    storageUnits: 0,
    supportsGpu: ["G-MED", "G-ULTRA"],
    baseRevenue: 250,
  },
  {
    id: "ULTRA2",
    group: "Generic Apps",
    name: "ULTRA2",
    cpu: 24,
    ram: 128,
    storageUnits: 0,
    supportsGpu: ["G-HIGH", "G-ULTRA"],
    baseRevenue: 375,
  },

  {
    id: "PGSQL-LOW",
    group: "Services",
    name: "PGSQL-LOW",
    cpu: 1,
    ram: 2,
    storageUnits: 1,
    supportsGpu: [],
    baseRevenue: 30,
  },
  {
    id: "PGSQL-MED",
    group: "Services",
    name: "PGSQL-MED",
    cpu: 2,
    ram: 4,
    storageUnits: 4,
    supportsGpu: [],
    baseRevenue: 65,
  },
  {
    id: "MYSQL-LOW",
    group: "Services",
    name: "MYSQL-LOW",
    cpu: 1,
    ram: 2,
    storageUnits: 1,
    supportsGpu: [],
    baseRevenue: 30,
  },
  {
    id: "MYSQL-MED",
    group: "Services",
    name: "MYSQL-MED",
    cpu: 2,
    ram: 4,
    storageUnits: 4,
    supportsGpu: [],
    baseRevenue: 65,
  },
  {
    id: "NOSQL-LOW",
    group: "Services",
    name: "NOSQL-LOW",
    cpu: 1,
    ram: 2,
    storageUnits: 1,
    supportsGpu: [],
    baseRevenue: 30,
  },
  {
    id: "NOSQL-MED",
    group: "Services",
    name: "NOSQL-MED",
    cpu: 2,
    ram: 4,
    storageUnits: 4,
    supportsGpu: [],
    baseRevenue: 65,
  },

  // Native Apps (exclusive: fill the whole node — cannot co-host with other jobs)
  {
    id: "N-ENTRY",
    group: "Native Apps",
    name: "N-ENTRY",
    cpu: 4,
    ram: 14,
    storageUnits: 0,
    supportsGpu: ["G-ENTRY"],
    baseRevenue: 75,
  },
  {
    id: "N-MED1",
    group: "Native Apps",
    name: "N-MED1",
    cpu: 8,
    ram: 22,
    storageUnits: 0,
    supportsGpu: ["G-ENTRY", "G-MED"],
    baseRevenue: 112.5,
  },
  {
    id: "N-MED2",
    group: "Native Apps",
    name: "N-MED2",
    cpu: 12,
    ram: 30,
    storageUnits: 0,
    supportsGpu: ["G-MED", "G-HIGH"],
    baseRevenue: 180,
  },
  {
    id: "N-HIGH",
    group: "Native Apps",
    name: "N-HIGH",
    cpu: 16,
    ram: 60,
    storageUnits: 0,
    supportsGpu: ["G-MED", "G-HIGH"],
    baseRevenue: 270,
  },
  {
    id: "N-ULTRA",
    group: "Native Apps",
    name: "N-ULTRA",
    cpu: 24,
    ram: 128,
    storageUnits: 0,
    supportsGpu: ["G-HIGH", "G-ULTRA"],
    baseRevenue: 400,
  },
];

const GPU_EXTRAS: GpuExtraRule[] = [
  {
    category: "G-ENTRY",
    bonus: 36,
    allowedWorkerIds: ["MED1", "MED2", "N-ENTRY", "N-MED1"],
  },
  {
    category: "G-MED",
    bonus: 72,
    allowedWorkerIds: [
      "MED2",
      "HIGH1",
      "HIGH2",
      "ULTRA1",
      "N-MED1",
      "N-MED2",
      "N-HIGH",
    ],
  },
  {
    category: "G-HIGH",
    bonus: 144,
    allowedWorkerIds: [
      "HIGH2",
      "ULTRA1",
      "ULTRA2",
      "N-MED2",
      "N-HIGH",
      "N-ULTRA",
    ],
  },
  {
    category: "G-ULTRA",
    bonus: 900,
    allowedWorkerIds: ["ULTRA1", "ULTRA2", "N-ULTRA"],
  },
];

/* --------------------------- OS RESERVATIONS -------------------------- */
const OS_RESERVE: Record<OSKind, OSReserve> = {
  Linux: { cpu: 1, ram: 2, storageGiB: 20 },
  Windows: { cpu: 2, ram: 4, storageGiB: 40 },
  macOS: { cpu: 2, ram: 4, storageGiB: 30 },
};

/* --------------------------- UTILITY FORMAT --------------------------- */
const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

/** text→int helpers (ROI-style free typing) */
const normalizeInt = (v: string) => v.replace(/[^\d]/g, "");
const toInt = (v: string): number => (v === "" ? NaN : Number(v));

/* ------------------------------ COMPONENT ----------------------------- */
export default function EdgeMixCalculator() {
  // ROI-style editable text inputs (easy to clear)
  const [coresText, setCoresText] = useState<string>("4");
  const [ramText, setRamText] = useState<string>("16");
  const [storageText, setStorageText] = useState<string>("120");

  const [os, setOs] = useState<OSKind>("Linux");
  const [gpuCategory, setGpuCategory] = useState<GCategory>("NONE");

  // Derived numeric totals (allow 0 when field is blank)
  const totalC = clamp(
    Math.floor(Number.isFinite(toInt(coresText)) ? toInt(coresText) : 0),
    0,
    64
  );
  const totalR = clamp(
    Math.floor(Number.isFinite(toInt(ramText)) ? toInt(ramText) : 0),
    0,
    256
  );
  const totalStorageGiB = clamp(
    Math.floor(Number.isFinite(toInt(storageText)) ? toInt(storageText) : 0),
    0,
    5000
  );

  // OS reservations
  const osRes = OS_RESERVE[os];
  const reservedC = clamp(osRes.cpu, 0, totalC);
  const reservedR = clamp(osRes.ram, 0, totalR);
  const reservedSgiB = Math.min(osRes.storageGiB, totalStorageGiB);

  // Available for optimizer (storage in 50 GiB units)
  const availC = Math.max(0, totalC - reservedC);
  const availR = Math.max(0, totalR - reservedR);
  const availUnits = Math.max(
    0,
    Math.floor((totalStorageGiB - reservedSgiB) / 50)
  );

  // GPU count is implicit: max 1 → 0 if NONE, else 1
  const gpuCount = gpuCategory === "NONE" ? 0 : 1;

  const result = useMemo(() => {
    const C = availC,
      R = availR,
      S = availUnits;

    const NON_NATIVE = WORKERS.filter((w) => w.group !== "Native Apps");
    const NATIVE = WORKERS.filter((w) => w.group === "Native Apps");
    const idx = (c: number, r: number, s: number) =>
      (c * (R + 1) + r) * (S + 1) + s;

    /* ---------- Case A: DP using ONLY non-native jobs ---------- */
    const states = (C + 1) * (R + 1) * (S + 1);
    const rev = new Float32Array(states).fill(0);
    const pick = new Int16Array(states).fill(-1);

    for (let c = 0; c <= C; c++) {
      for (let r = 0; r <= R; r++) {
        for (let s = 0; s <= S; s++) {
          const base = idx(c, r, s);
          let best = rev[base];
          let bestItem = -1;
          for (let i = 0; i < NON_NATIVE.length; i++) {
            const w = NON_NATIVE[i];
            if (c >= w.cpu && r >= w.ram && s >= w.storageUnits) {
              const prev = idx(c - w.cpu, r - w.ram, s - w.storageUnits);
              const candidate = rev[prev] + w.baseRevenue;
              if (candidate > best) {
                best = candidate;
                bestItem = i;
              }
            }
          }
          if (bestItem !== -1) {
            rev[base] = best;
            pick[base] = bestItem;
          }
        }
      }
    }

    // reconstruct counts for non-native solution
    const countsA: Record<string, number> = {};
    let ccA = C,
      rrA = R,
      ssA = S;
    while (ccA >= 0 && rrA >= 0 && ssA >= 0) {
      const p = pick[idx(ccA, rrA, ssA)];
      if (p === -1) break;
      const w = NON_NATIVE[p];
      countsA[w.id] = (countsA[w.id] ?? 0) + 1;
      ccA -= w.cpu;
      rrA -= w.ram;
      ssA -= w.storageUnits;
    }

    let baseRevenueA = 0;
    for (const w of NON_NATIVE)
      baseRevenueA += (countsA[w.id] ?? 0) * w.baseRevenue;

    // GPU bonus for non-native plan + assign which job uses GPU (max 1)
    let gpuBonusA = 0,
      gpuUsedA = 0,
      gpuAssignedA: string | null = null;
    if (gpuCategory !== "NONE" && gpuCount > 0) {
      const rule = GPU_EXTRAS.find((r) => r.category === gpuCategory);
      if (rule) {
        const candidates = NON_NATIVE.filter(
          (w) => (countsA[w.id] ?? 0) > 0
        ).filter(
          (w) =>
            rule.allowedWorkerIds.includes(w.id) &&
            w.supportsGpu.includes(gpuCategory)
        );
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.baseRevenue - a.baseRevenue); // pick highest-value job
          gpuAssignedA = candidates[0].id;
          gpuUsedA = 1;
          gpuBonusA = rule.bonus;
        }
      }
    }

    const planA = {
      kind: "non-native" as const,
      counts: countsA,
      baseRevenue: baseRevenueA,
      gpuBonus: gpuBonusA,
      totalRevenue: baseRevenueA + gpuBonusA,
      gpuUsed: gpuUsedA,
      gpuAssignedWorkerId: gpuAssignedA as string | null,
      leftover: { cores: ccA, ram: rrA, storageUnits: ssA },
    };

    /* ---------- Case B: EXACTLY ONE native job, nothing else ---------- */
    let planB: {
      kind: "native";
      counts: Record<string, number>;
      baseRevenue: number;
      gpuBonus: number;
      totalRevenue: number;
      gpuUsed: number;
      gpuAssignedWorkerId: string | null;
      leftover: { cores: number; ram: number; storageUnits: number };
    } | null = null;

    for (const w of NATIVE) {
      if (w.cpu <= C && w.ram <= R && w.storageUnits <= S) {
        let gpuBonus = 0,
          gpuUsed = 0,
          assigned: string | null = null;
        if (gpuCategory !== "NONE" && gpuCount > 0) {
          const rule = GPU_EXTRAS.find((r) => r.category === gpuCategory);
          if (
            rule &&
            rule.allowedWorkerIds.includes(w.id) &&
            w.supportsGpu.includes(gpuCategory)
          ) {
            gpuBonus = rule.bonus;
            gpuUsed = 1;
            assigned = w.id;
          }
        }
        const total = w.baseRevenue + gpuBonus;
        if (!planB || total > planB.totalRevenue) {
          planB = {
            kind: "native",
            counts: { [w.id]: 1 },
            baseRevenue: w.baseRevenue,
            gpuBonus,
            totalRevenue: total,
            gpuUsed,
            gpuAssignedWorkerId: assigned,
            leftover: { cores: 0, ram: 0, storageUnits: 0 },
          };
        }
      }
    }

    // Choose the better plan
    return planB && planB.totalRevenue > planA.totalRevenue ? planB : planA;
  }, [availC, availR, availUnits, gpuCategory, gpuCount]);

  // rows for table (annotate the GPU-using row)
  const rows = WORKERS.filter((w) => (result.counts[w.id] ?? 0) > 0).map(
    (w) => ({
      ...w,
      count: result.counts[w.id] ?? 0,
      revenue: (result.counts[w.id] ?? 0) * w.baseRevenue,
      usesGpu: result.gpuAssignedWorkerId === w.id,
    })
  );

  const gpuRule = GPU_EXTRAS.find((r) => r.category === gpuCategory);

  // For usage bars
  const usedJobC = availC - Math.max(result.leftover.cores, 0);
  const usedJobR = availR - Math.max(result.leftover.ram, 0);
  const usedJobSgiB =
    (availUnits - Math.max(result.leftover.storageUnits, 0)) * 50;

  return (
    <div
      className="min-h-screen pt-10"
      style={{ background: "var(--color-light)", color: "var(--color-body)" }}
    >
      {/* Hide number input steppers globally */}
      <style jsx global>{`
        /* Chrome, Safari, Edge, Opera */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="mx-auto max-w-5xl p-6">
        {/* Top bar */}

        <div className="flex flex-row justify-start items-start gap-1">
          <header className="mb-6 flex items-baseline justify-between">
            <h1 className="text-2xl font-bold">Max Proof of AI Rewards</h1>
          </header>
          <div className="rounded-lg label px-1.5 py-0.5 text-xs">V1.0.1</div>
        </div>
        <section className="rounded-2xl bg-white p-5 shadow mb-4">
          <div className="flex items-start">
            {/* icon */}
            <svg
              className="mt-0.5 h-5 w-5 flex-none"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.59c.75 1.334-.214 2.99-1.743 2.99H3.482c-1.53 0-2.493-1.656-1.743-2.99L8.257 3.1zM10 7a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 7zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3 flex-1">
              <p className="font-semibold accent">Note</p>
              <p className="mt-1">
                This tool maximizes monthly budget using published job specs. It
                does not consider scheduling overhead, network/IO limits, or
                live availability. GPU assignment follows each category’s “Only
                for …” rules and job support lists. Native Apps are exclusive to
                a node. Keep in mind this is not a guarantee, but a best-case
                scenario assuming sufficient demand for protocol usage.
              </p>
            </div>
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Inputs */}
          <section
            className="rounded-2xl bg-white p-5 shadow-sm"
            style={{ border: "1px solid var(--color-slate-150)" }}
          >
            <h2 className="mb-4 text-lg font-semibold">Your node</h2>
            <div className="grid gap-4">
              <LabeledInput label="CPU cores">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid var(--color-slate-150)",
                    background: "var(--color-light)",
                  }}
                  value={coresText}
                  onChange={(e) => setCoresText(normalizeInt(e.target.value))}
                  placeholder="0"
                />
              </LabeledInput>

              <LabeledInput label="RAM (GB)">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid var(--color-slate-150)",
                    background: "var(--color-light)",
                  }}
                  value={ramText}
                  onChange={(e) => setRamText(normalizeInt(e.target.value))}
                  placeholder="0"
                />
              </LabeledInput>

              <LabeledInput label="Storage (GiB)">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid var(--color-slate-150)",
                    background: "var(--color-light)",
                  }}
                  value={storageText}
                  onChange={(e) => setStorageText(normalizeInt(e.target.value))}
                  placeholder="0"
                />
                <p
                  className="mt-1 text-xs"
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-body) 60%, transparent)",
                  }}
                >
                  Services consume 50 GiB or 200 GiB per job.
                </p>
              </LabeledInput>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Operating system</label>
                <select
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid var(--color-slate-150)",
                    background: "var(--color-light)",
                  }}
                  value={os}
                  onChange={(e) => setOs(e.target.value as OSKind)}
                >
                  <option value="Linux">Linux</option>
                  <option value="Windows">Windows</option>
                  <option value="macOS">macOS</option>
                </select>
                <p
                  className="text-xs"
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-body) 60%, transparent)",
                  }}
                >
                  OS reserves ~{reservedC} cores, ~{reservedR} GB RAM, ~
                  {reservedSgiB} GiB storage.
                </p>

                {/* Small warning for Windows/macOS */}
                {(os === "Windows" || os === "macOS") && (
                  <div
                    className="mt-2 rounded-md p-2 text-xs"
                    style={{
                      border:
                        "1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 60%, white)",
                      background:
                        "color-mix(in srgb, var(--color-warning, #f59e0b) 12%, white)",
                      color:
                        "color-mix(in srgb, var(--color-body) 80%, transparent)",
                    }}
                  >
                    {os === "Windows"
                      ? "Windows is not yet fully supported."
                      : "MacOS is not yet fully supported."}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">GPU category</label>
                <select
                  className="w-full rounded-xl px-3 py-2"
                  style={{
                    border: "1px solid var(--color-slate-150)",
                    background: "var(--color-light)",
                  }}
                  value={gpuCategory}
                  onChange={(e) => setGpuCategory(e.target.value as GCategory)}
                >
                  <option value="NONE">None</option>
                  <option value="G-ENTRY">G-ENTRY (RTX 2060–3070)</option>
                  <option value="G-MED">G-MED (RTX 2080–3080, A3000)</option>
                  <option value="G-HIGH">
                    G-HIGH (RTX 3090–5090, A4/5000)
                  </option>
                  <option value="G-ULTRA">G-ULTRA (A100, H100)</option>
                </select>

                {gpuRule && (
                  <p
                    className="text-xs"
                    style={{
                      color:
                        "color-mix(in srgb, var(--color-body) 60%, transparent)",
                    }}
                  >
                    Bonus {fmtUSD(gpuRule.bonus)} for one eligible job (
                    {gpuRule.allowedWorkerIds.join(", ")}).
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Results summary */}
          <section
            className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2"
            style={{ border: "1px solid var(--color-slate-150)" }}
          >
            <h2 className="mb-4 text-lg font-semibold">
              Best possible mix for your node
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                title="Base monthly rewards"
                value={fmtUSD(result.baseRevenue)}
              />
              <Stat
                title="GPU monthly bonus"
                value={fmtUSD(result.gpuBonus)}
                hint={
                  gpuCategory === "NONE"
                    ? "No GPU selected"
                    : result.gpuUsed
                    ? "1 used"
                    : "No eligible job in mix"
                }
              />
              <StatStrong
                title="Total possible monthly rewards"
                value={fmtUSD(result.totalRevenue)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              {/* Capacity usage (stacked: OS in orange + jobs in blue) */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--color-light)",
                  border: "1px solid var(--color-slate-150)",
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-body) 70%, transparent)",
                  }}
                >
                  Capacity usage
                </h3>

                <UsageBarStacked
                  label="CPU cores"
                  usedJobs={usedJobC}
                  reserved={reservedC}
                  total={totalC}
                />
                <UsageBarStacked
                  label="RAM (GB)"
                  usedJobs={usedJobR}
                  reserved={reservedR}
                  total={totalR}
                />
                <UsageBarStacked
                  label="Storage (GiB)"
                  usedJobs={usedJobSgiB}
                  reserved={reservedSgiB}
                  total={totalStorageGiB}
                />

                {/* Legend */}
                <div
                  className="mt-3 flex flex-wrap items-center gap-4 text-xs"
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-body) 70%, transparent)",
                  }}
                >
                  <LegendSwatch
                    color="var(--color-warning, #f59e0b)"
                    label="OS reserved"
                  />
                  <LegendSwatch
                    color="var(--color-primary)"
                    label="Jobs used"
                  />
                  <LegendSwatch
                    color="var(--color-slate-150)"
                    label="Free capacity"
                  />
                </div>
              </div>

              {/* Composition */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--color-light)",
                  border: "1px solid var(--color-slate-150)",
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold uppercase tracking-wide"
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-body) 70%, transparent)",
                  }}
                >
                  Composition
                </h3>
                {rows.length === 0 ? (
                  <p
                    style={{
                      color:
                        "color-mix(in srgb, var(--color-body) 70%, transparent)",
                    }}
                  >
                    No jobs fit within the provided resources.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--color-slate-150)" }}>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-right">#</th>
                          <th className="p-2 text-right">CPU</th>
                          <th className="p-2 text-right">RAM</th>
                          <th className="p-2 text-right">Storage</th>
                          <th className="p-2 text-right">Rewards</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: "1px solid var(--color-slate-150)",
                            }}
                          >
                            <td className="p-2">{r.group}</td>
                            <td className="p-2 font-medium">
                              {r.name}
                              {r.usesGpu ? " + GPU" : ""}
                            </td>
                            <td className="p-2 text-right">{r.count}</td>
                            <td className="p-2 text-right">
                              {r.cpu * r.count}
                            </td>
                            <td className="p-2 text-right">
                              {r.ram * r.count} GB
                            </td>
                            <td className="p-2 text-right">
                              {r.storageUnits * 50 * r.count
                                ? `${r.storageUnits * 50 * r.count} GiB`
                                : "—"}
                            </td>
                            <td className="p-2 text-right">
                              {fmtUSD(r.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- UI HELPERS ----------------------------- */

function LabeledInput({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span
        className="text-sm"
        style={{
          color: "color-mix(in srgb, var(--color-body) 80%, transparent)",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: "1px solid var(--color-slate-150)",
        background: "var(--color-light)",
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wide"
        style={{
          color: "color-mix(in srgb, var(--color-body) 65%, transparent)",
        }}
      >
        {title}
      </div>
      <div
        className="mt-1 text-xl font-bold"
        style={{ color: "var(--color-body)" }}
      >
        {value}
      </div>
      {hint && (
        <div
          className="text-xs"
          style={{
            color: "color-mix(in srgb, var(--color-body) 60%, transparent)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function StatStrong({ title, value }: { title: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ border: "2px solid var(--color-primary)" }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-wide"
        style={{
          color: "color-mix(in srgb, var(--color-body) 65%, transparent)",
        }}
      >
        {title}
      </div>
      <div
        className="mt-1 text-2xl font-extrabold"
        style={{ color: "var(--color-body)" }}
      >
        {value}
      </div>
    </div>
  );
}

/** Usage bar with orange OS reservation + blue job usage (stacked). */
function UsageBarStacked({
  label,
  usedJobs,
  reserved,
  total,
}: {
  label: string;
  usedJobs: number;
  reserved: number;
  total: number;
}) {
  const reservedClamped = Math.min(Math.max(reserved, 0), total);
  const usable = Math.max(total - reservedClamped, 0);
  const usedClamped = Math.min(Math.max(usedJobs, 0), usable);

  // Use raw widths; round only the combined label to avoid 51% vs 50% artifacts
  const pctReservedRaw = total > 0 ? (reservedClamped / total) * 100 : 0;
  const pctUsedRaw = total > 0 ? (usedClamped / total) * 100 : 0;
  const pctTotal =
    total > 0 ? Math.round(((reservedClamped + usedClamped) / total) * 100) : 0;

  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span style={{ color: "var(--color-body)" }}>{label}</span>
        <span
          style={{
            color: "color-mix(in srgb, var(--color-body) 65%, transparent)",
          }}
        >
          {usedClamped}+{reservedClamped}/{total} ({pctTotal}%)
        </span>
      </div>
      <div
        className="h-2 w-full rounded overflow-hidden"
        style={{ background: "var(--color-slate-150)", display: "flex" }}
      >
        {/* OS reserved (orange) */}
        <div
          className="h-2"
          style={{
            width: `${pctReservedRaw}%`,
            background: "var(--color-warning, #f59e0b)",
          }}
        />
        {/* Jobs used (primary) */}
        <div
          className="h-2"
          style={{
            width: `${pctUsedRaw}%`,
            background: "var(--color-primary)",
          }}
        />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-2 w-4 rounded"
        style={{ background: color }}
      />
      <span>{label}</span>
    </span>
  );
}
