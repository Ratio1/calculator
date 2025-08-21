"use client";
import React, { useEffect, useMemo, useState } from "react";

const TIERS = [
  { id: "T1", priceUSD: 500 },
  { id: "T2", priceUSD: 750 },
  { id: "T3", priceUSD: 1000 },
  { id: "T4", priceUSD: 1500 },
  { id: "T5", priceUSD: 2000 },
  { id: "T6", priceUSD: 2500 },
  { id: "T7", priceUSD: 3000 },
  { id: "T8", priceUSD: 3500 },
  { id: "T9", priceUSD: 4000 },
  { id: "T10", priceUSD: 5000 },
  { id: "T11", priceUSD: 7000 },
  { id: "T12", priceUSD: 9500 },
] as const;

type TierId = (typeof TIERS)[number]["id"];

/** ----------- constants for PoA cap ----------- */
const TOKENS_PER_DAY = 1.45; // PoA production in R1/day
const MAX_R1_PER_LICENSE = 1575; // lifetime R1 cap per license
const CAP_DAYS = MAX_R1_PER_LICENSE / TOKENS_PER_DAY; // ~1086.21 days

/** ----------- formatting ----------- */
function fmtCurrencyUSD(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(v || 0);
}
function fmtPlain(v: number, digits = 6) {
  return new Intl.NumberFormat("en-US", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(v || 0);
}
function fmtNumber(v: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(v || 0);
}
function fmtPercent(v: number, digits = 2) {
  if (!isFinite(v)) return "–";
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(v)}%`;
}

/** ----------- input helpers ----------- */
// Keep raw text (accepts "1.", "1,", etc.) and normalize comma to dot.
function normalizeDecimalInput(value: string): string {
  return value.replace(/\s+/g, "").replace(",", ".");
}
// Parse a string to number safely (returns NaN for partials like "" or ".")
function toNum(v: string): number {
  const cleaned = v.replace(/\s+/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "." || cleaned === "-") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** ----------- break-even with PoA cap ----------- */
function breakEvenDaysWithCap(
  investmentUSD: number,
  PoA_dailyUSD: number,
  AI_dailyUSD: number
): number {
  if (investmentUSD <= 0) return 0;

  const rateBeforeCap = PoA_dailyUSD + AI_dailyUSD;

  if (rateBeforeCap <= 0) return Infinity;

  const revenueIfRunUntilCap = rateBeforeCap * CAP_DAYS;

  if (investmentUSD <= revenueIfRunUntilCap) {
    return investmentUSD / rateBeforeCap;
  }

  // After cap, only AI contributes
  if (AI_dailyUSD <= 0) return Infinity;

  const remainingAfterCap = investmentUSD - PoA_dailyUSD * CAP_DAYS;
  return remainingAfterCap / AI_dailyUSD;
}

/** ----------- Accessible toggle ----------- */
function Toggle({
  checked,
  onChange,
  srLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  srLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={srLabel}
      onClick={() => onChange(!checked)}
      className={`${
        checked ? "bg-blue-600" : "bg-slate-300"
      } relative inline-flex h-6 w-11 items-center align-middle rounded-full transition-colors`}
    >
      <span
        className={`${
          checked ? "translate-x-6" : "translate-x-1"
        } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition`}
      />
    </button>
  );
}

export default function Ratio1RoiCalculator() {
  // Prices from CoinGecko
  const [apiR1USD, setApiR1USD] = useState<number>(1);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  // Price mode: API vs Manual
  const [useManualPrice, setUseManualPrice] = useState<boolean>(false);
  // Keep raw text (fixed for decimals)
  const [manualR1USD, setManualR1USD] = useState<string>("");

  // Optional costs/production with toggles
  const [hardwareEnabled, setHardwareEnabled] = useState<boolean>(false);
  const [hardwarePrice, setHardwarePrice] = useState<string>("");

  const [vatEnabled, setVatEnabled] = useState<boolean>(false);
  const [vatPercent, setVatPercent] = useState<string>("");

  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  // Proof of AI input is USD/month (raw text)
  const [proofOfAiUSDPerMonth, setProofOfAiUSDPerMonth] = useState<string>("");

  // License selection (always 1 license)
  const [tier, setTier] = useState<TierId>("T1");

  // Fetch price from CoinGecko
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsFetching(true);
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ratio1&vs_currencies=usd&include_market_cap=false",
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!cancelled && data?.ratio1) {
          if (data.ratio1.usd != null) setApiR1USD(Number(data.ratio1.usd));
        }
      } catch (e) {
        console.warn("CoinGecko fetch error:", e);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // When switching to manual, prefill with API price if empty (as text)
  function togglePriceMode() {
    setUseManualPrice((prev) => {
      const next = !prev;
      if (next && manualR1USD === "") setManualR1USD(String(apiR1USD));
      return next;
    });
  }

  const selected = useMemo(() => TIERS.find((t) => t.id === tier)!, [tier]);

  // Numeric parse of text inputs (used for math)
  const manualR1 = toNum(manualR1USD);
  const vatPct = toNum(vatPercent);
  const hwUsd = toNum(hardwarePrice);
  const aiMonthlyUsd = toNum(proofOfAiUSDPerMonth);

  // Effective price based on mode
  const effectiveR1USD =
    useManualPrice && isFinite(manualR1) ? manualR1 : apiR1USD;

  /** ------- derived daily and caps ------- */
  const PoA_dailyUSD = TOKENS_PER_DAY * effectiveR1USD; // USD/day from PoA
  const AI_dailyUSD =
    aiEnabled && isFinite(aiMonthlyUsd) ? aiMonthlyUsd / 30 : 0;

  const dailyUsd = PoA_dailyUSD + AI_dailyUSD; // current daily rate (pre-cap)
  const monthlyUsd = dailyUsd * 30;
  const yearlyUsd = dailyUsd * 365;

  // Lifetime PoA value at current price (cap × price)
  const PoA_lifetimeUSD = MAX_R1_PER_LICENSE * effectiveR1USD;

  // Costs
  const licenseBasePrice = selected.priceUSD;
  const vatAmount =
    vatEnabled && isFinite(vatPct) ? (licenseBasePrice * vatPct) / 100 : 0;
  const costPerLicense = licenseBasePrice + vatAmount; // license + VAT only
  const hardwareUsd = hardwareEnabled && isFinite(hwUsd) ? hwUsd : 0;
  const totalInvestment = costPerLicense + hardwareUsd; // total = license (+VAT) + hardware

  // ROI & APR (break-even uses PoA cap)
  const daysToROI = breakEvenDaysWithCap(
    totalInvestment,
    PoA_dailyUSD,
    AI_dailyUSD
  );
  const weeksToROI = daysToROI / 7;
  const monthsToROI = daysToROI / 30;

  // APR remains a simple ratio using the *current* daily rate (pre-cap), as an indicative metric.
  const apr =
    totalInvestment > 0 ? (yearlyUsd / totalInvestment) * 100 : Infinity;

  const breakEvenDate = useMemo(() => {
    if (!isFinite(daysToROI)) return null;
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(daysToROI));
    return d.toISOString().slice(0, 10);
  }, [daysToROI]);

  // Message condition: if R1 price × 1575 doesn't cover the license (license + VAT)
  const licenseNotCoveredByPoA = PoA_lifetimeUSD < costPerLicense;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-10">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-row justify-start items-start gap-1">
          <header className="mb-6 flex items-baseline justify-between">
            <h1 className="text-2xl font-bold">ROI Calculator</h1>
          </header>
          <div className="rounded-lg label px-1.5 py-0.5 text-xs">V1.0.2</div>
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
                This calculator is for informational purposes only and does not
                constitute financial advice. It does not account for fees, taxes
                (other than optional VAT), downtime, or R1/USD exchange rate
                volatility. Keep in mind that Proof of Availability (PoA) has a
                cap of 1,575 R1 per license.
              </p>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-4 flex items-center justify-between text-2xl font-semibold">
              <span>Inputs</span>
            </h2>
            <div className="grid gap-4">
              {/* Price source toggle */}
              <div className="flex items-center justify-between">
                <span className="text-md font-semibold">R1 price</span>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      useManualPrice ? "text-gray-600" : "text-green-600"
                    }
                  >
                    {useManualPrice ? "Manual" : "Live price"}
                  </span>
                  <Toggle
                    checked={useManualPrice}
                    onChange={togglePriceMode}
                    srLabel="Toggle price mode"
                  />
                </div>
              </div>

              {/* R1 price display/input */}
              {!useManualPrice ? (
                <div className="grid gap-1">
                  <div className="relative flex items-center rounded-xl border bg-slate-50 px-3 py-2 pr-16">
                    <span className="text-slate-700 tabular-nums">
                      {fmtPlain(apiR1USD)} {/* plain number, no $ */}
                    </span>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 text-xs">
                      USD
                    </span>
                  </div>
                </div>
              ) : (
                <label className="grid gap-1">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="w-full rounded-xl border px-3 py-2 pr-16 tabular-nums"
                      value={manualR1USD}
                      onChange={(e) =>
                        setManualR1USD(normalizeDecimalInput(e.target.value))
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 text-xs">
                      USD
                    </span>
                  </div>
                </label>
              )}

              <div className="my-2 h-px bg-slate-200" />

              {/* License tier */}
              <label className="grid gap-1">
                <span className="text-md font-semibold mb-4">License tier</span>
                <div className="relative">
                  <select
                    className="w-full rounded-xl border border-slate-150 bg-light text-body px-3 py-2 pr-12 appearance-none"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as TierId)}
                  >
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} – {fmtCurrencyUSD(t.priceUSD)}
                      </option>
                    ))}
                  </select>
                  {/* Custom chevron */}
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-body/80"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </label>

              {/* VAT (optional) */}
              <div className="flex items-center justify-between">
                <span className="text-md font-semibold">
                  VAT on license price (optional)
                </span>
                <Toggle
                  checked={vatEnabled}
                  onChange={(v) => {
                    setVatEnabled(v);
                    if (!v) setVatPercent("");
                  }}
                  srLabel="Toggle VAT"
                />
              </div>
              {vatEnabled && (
                <label className="grid gap-1">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="w-full rounded-xl border px-3 py-2 pr-16"
                      value={vatPercent}
                      placeholder="0"
                      onChange={(e) =>
                        setVatPercent(normalizeDecimalInput(e.target.value))
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 text-xs">
                      %
                    </span>
                  </div>
                </label>
              )}

              {/* Hardware (optional) */}
              <div className="flex items-center justify-between">
                <span className="text-md font-semibold">
                  Hardware (optional)
                </span>
                <Toggle
                  checked={hardwareEnabled}
                  onChange={(v) => {
                    setHardwareEnabled(v);
                    if (!v) setHardwarePrice("");
                  }}
                  srLabel="Toggle hardware"
                />
              </div>
              {hardwareEnabled && (
                <label className="grid gap-1">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="w-full rounded-xl border px-3 py-2 pr-16"
                      value={hardwarePrice}
                      placeholder="0"
                      onChange={(e) =>
                        setHardwarePrice(normalizeDecimalInput(e.target.value))
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 text-xs">
                      USD
                    </span>
                  </div>
                </label>
              )}

              <div className="my-2 h-px bg-slate-200" />

              {/* Proof of Availability (fixed) */}
              <div className="grid gap-1">
                <span className="text-md font-semibold mb-4">
                  Proof of Availability (fixed)
                </span>
                <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">
                    {TOKENS_PER_DAY} R1 / day = {fmtCurrencyUSD(PoA_dailyUSD)}
                  </span>
                </div>
                {/* Updated text exactly as requested, but dynamic */}
                <p className="text-xs text-slate-500 mt-1">
                  Each license can mine a maximum of{" "}
                  <span className="font-semibold">
                    {fmtNumber(MAX_R1_PER_LICENSE, 0)} R1
                  </span>{" "}
                  through PoA. At a rate of{" "}
                  <span className="font-semibold">
                    {fmtNumber(TOKENS_PER_DAY, 2)} R1
                  </span>{" "}
                  per day, this lasts for approximately{" "}
                  <span className="font-semibold">
                    {fmtNumber(CAP_DAYS, 0)} days
                  </span>
                  . At the current R1 price, the maximum PoA-mineable value is{" "}
                  <span className="font-semibold">
                    {fmtCurrencyUSD(PoA_lifetimeUSD)}
                  </span>
                  . After that, only Proof of AI rewards (if enabled) remain.
                </p>
              </div>

              {/* Proof of AI (optional) - USD/month */}
              <div className="flex items-center justify-between">
                <span className="text-md font-semibold">
                  Proof of AI (optional)
                </span>
                <Toggle
                  checked={aiEnabled}
                  onChange={(v) => {
                    setAiEnabled(v);
                    if (!v) setProofOfAiUSDPerMonth("");
                  }}
                  srLabel="Toggle Proof of AI"
                />
              </div>
              {aiEnabled && (
                <label className="grid gap-1">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="w-full rounded-xl border px-3 py-2 pr-24"
                      value={proofOfAiUSDPerMonth}
                      placeholder="0"
                      onChange={(e) =>
                        setProofOfAiUSDPerMonth(
                          normalizeDecimalInput(e.target.value)
                        )
                      }
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-100 px-2 text-xs">
                      USD/month
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Converted to daily by dividing by 30 for ROI math.
                  </p>
                </label>
              )}
            </div>
          </section>

          {/* Results */}
          <section className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-4 flex items-center justify-between text-2xl font-semibold">
              Results
            </h2>

            {/* Total Investment – boxed breakdown */}
            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Total investment breakdown
              </h3>

              <div className="grid gap-2 text-sm">
                <BreakdownRow
                  label="Base license"
                  value={fmtCurrencyUSD(licenseBasePrice)}
                  strong
                />

                <BreakdownRow
                  label={
                    vatEnabled && isFinite(vatPct)
                      ? `VAT (${fmtNumber(vatPct, 1)}%)`
                      : "VAT"
                  }
                  value={fmtCurrencyUSD(vatAmount)}
                  muted={!vatEnabled}
                />

                <div className="my-2 h-px bg-slate-200" />

                <BreakdownRow
                  label="Final license cost"
                  value={fmtCurrencyUSD(costPerLicense)}
                  strong
                />

                <BreakdownRow
                  label="Hardware"
                  value={fmtCurrencyUSD(hardwareUsd)}
                  muted={!hardwareEnabled}
                />
              </div>

              {/* Emphasized Total */}
              <div
                className="mt-4 rounded-xl border-2 px-4 py-3 tablebg"
                style={{ borderColor: "var(--color-primary,#1b47f7)" }}
              >
                <div className="text-xs uppercase tracking-wide text-slate-600">
                  Total investment
                </div>
                <div
                  className="mt-1 text-2xl font-extrabold"
                  style={{ color: "var(--color-body,#0b0b47)" }}
                >
                  {fmtCurrencyUSD(totalInvestment)}
                </div>
                <div className="text-xs text-slate-500">
                  = Final license cost + Hardware
                </div>
              </div>
            </div>

            {/* Rewards & ROI – boxed */}
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Rewards & ROI
              </h3>

              <div className="grid gap-3 text-sm">
                <Row label="Rewards/day">{fmtCurrencyUSD(dailyUsd)}</Row>
                <Row label="Rewards/month">{fmtCurrencyUSD(monthlyUsd)}</Row>
                <Row label="Rewards/year">{fmtCurrencyUSD(yearlyUsd)}</Row>

                <div className="my-2 h-px bg-slate-200" />

                <Row label="Days to break-even">
                  {isFinite(daysToROI) ? fmtNumber(daysToROI, 1) : "–"}
                </Row>
                <Row label="Weeks to break-even">
                  {isFinite(weeksToROI) ? fmtNumber(weeksToROI, 1) : "–"}
                </Row>
                <Row label="Months to break-even">
                  {isFinite(monthsToROI) ? fmtNumber(monthsToROI, 2) : "–"}
                </Row>
                <Row label="Est. break-even date">{breakEvenDate ?? "–"}</Row>
              </div>

              {/* Emphasized APR (same style as Total investment) */}
              <div
                className="mt-4 rounded-xl border-2 px-4 py-3 tablebg"
                style={{ borderColor: "var(--color-primary,#1b47f7)" }}
              >
                <div className="text-xs uppercase tracking-wide text-slate-600">
                  APR
                </div>
                <div
                  className="mt-1 text-2xl font-extrabold"
                  style={{ color: "var(--color-body,#0b0b47)" }}
                >
                  {fmtPercent(apr, 2)}
                </div>
                <div className="text-xs text-slate-500">
                  = Rewards/year ÷ Total investment (based on current daily
                  rate; PoA stops after cap).
                </div>
              </div>

              {/* Updated warning text with dynamic amounts */}
              {licenseNotCoveredByPoA && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  Break-even not possible using PoA alone: max minable R1 at
                  current price is{" "}
                  <span className="font-semibold">
                    {fmtCurrencyUSD(PoA_lifetimeUSD)}
                  </span>
                  , which is less than your license cost{" "}
                  <span className="font-semibold">
                    {fmtCurrencyUSD(costPerLicense)}
                  </span>
                  . Enable Proof of AI or adjust inputs to reach break-even.
                </div>
              )}
              {!isFinite(daysToROI) && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  With the 1,575 R1 cap and current settings, total rewards
                  cannot reach your total investment. Increase R1 price, enable
                  Proof of AI, or reduce costs.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Tiers table */}
        <section id="tiers" className="mt-8 rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-3 text-lg font-semibold">Tier price list</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b tablebg">
                  <th className="p-2">Tier</th>
                  <th className="p-2">License USD</th>
                  <th className="p-2">Cost w/ VAT</th>
                  <th className="p-2">ROI (days)*</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => {
                  const licenseCostWithVat =
                    t.priceUSD +
                    (vatEnabled && isFinite(vatPct)
                      ? (t.priceUSD * vatPct) / 100
                      : 0);

                  const investment = licenseCostWithVat + hardwareUsd;

                  const roiDaysForTier = breakEvenDaysWithCap(
                    investment,
                    TOKENS_PER_DAY * effectiveR1USD, // PoA daily USD depends on price, not tier
                    AI_dailyUSD
                  );

                  return (
                    <tr key={t.id} className="border-b last:border-none">
                      <td className="p-2 font-medium">{t.id}</td>
                      <td className="p-2">{fmtCurrencyUSD(t.priceUSD)}</td>
                      <td className="p-2">
                        {fmtCurrencyUSD(licenseCostWithVat)}
                      </td>
                      <td className="p-2">
                        {isFinite(roiDaysForTier)
                          ? fmtNumber(roiDaysForTier, 1)
                          : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            *ROI includes optional VAT and hardware if enabled, and accounts for
            the PoA lifetime cap of {fmtNumber(MAX_R1_PER_LICENSE, 0)} R1 per
            license. After approximately {fmtNumber(CAP_DAYS, 0)} days, PoA
            stops and only Proof of AI (if any) contributes to rewards.
          </p>
        </section>

        {/* Explanations */}
        <section className="mt-8 text-sm text-slate-700">
          <h2 className="mb-2 text-base font-semibold">Formulae</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Rewards/day</span> = (
              {TOKENS_PER_DAY} R1 × R1 price) + (Proof of AI USD/month ÷ 30, if
              enabled).
            </li>
            <li>
              <span className="font-medium">PoA lifetime</span> = up to{" "}
              {fmtNumber(MAX_R1_PER_LICENSE, 0)} R1 (≈ {fmtNumber(CAP_DAYS, 0)}{" "}
              days at {TOKENS_PER_DAY} R1/day).
            </li>
            <li>
              <span className="font-medium">Final license cost</span> = Base
              license + VAT (if enabled).
            </li>
            <li>
              <span className="font-medium">Total investment</span> = Cost per
              license + Hardware (if enabled).
            </li>
            <li>
              <span className="font-medium">Break-even (with PoA cap)</span>: if
              investment ≤ (PoA/day + AI/day) × capDays → t = investment ÷
              (PoA/day + AI/day); otherwise (after PoA stops) → t = (investment
              − PoA/day × capDays) ÷ AI/day.
            </li>
            <li>
              <span className="font-medium">APR</span> = (Rewards/year ÷ Total
              investment) × 100 (based on current daily rate; PoA ends after
              cap).
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg tablebg px-3 py-2">
      <span className="textlight font-semibold">{label}</span>
      <span className="font-semibold accent sm:text-lg text-md">
        {children}
      </span>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  muted = false,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg tablebg px-3 py-2">
      <span
        className={muted ? "textlight font-medium" : "textlight font-semibold"}
      >
        {label}
      </span>
      <span
        className={
          strong ? "font-semibold accent text-lg" : "font-medium accent text-lg"
        }
      >
        {value}
      </span>
    </div>
  );
}
