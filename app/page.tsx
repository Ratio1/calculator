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

// Accept both "," and "." as decimal separators, return number or ""
function parseDecimalInput(value: string): number | "" {
  const cleaned = value.replace(/\s+/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === "." || cleaned === "-") return "";
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : "";
}

// Accessible, vertically-centered toggle
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
  const [manualR1USD, setManualR1USD] = useState<number | "">("");

  // Optional costs/production with toggles
  const [hardwareEnabled, setHardwareEnabled] = useState<boolean>(false);
  const [hardwarePrice, setHardwarePrice] = useState<number | "">("");

  const [vatEnabled, setVatEnabled] = useState<boolean>(false);
  const [vatPercent, setVatPercent] = useState<number | "">("");

  const proofOfAvailabilityPerDay = 1.45; // fixed R1/day

  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  // CHANGE: Proof of AI input is now USD/month
  const [proofOfAiUSDPerMonth, setProofOfAiUSDPerMonth] = useState<number | "">(
    ""
  );

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

  // When switching to manual, prefill with API price if empty
  function togglePriceMode() {
    setUseManualPrice((prev) => {
      const next = !prev;
      if (next && manualR1USD === "") setManualR1USD(apiR1USD);
      return next;
    });
  }

  const selected = useMemo(() => TIERS.find((t) => t.id === tier)!, [tier]);

  // Effective price based on mode
  const effectiveR1USD = useManualPrice
    ? typeof manualR1USD === "number"
      ? manualR1USD
      : 0
    : apiR1USD;

  // Production & Rewards
  const usdFromPoA = proofOfAvailabilityPerDay * effectiveR1USD;
  // CHANGE: Divide monthly Proof of AI by 30 to get daily
  const usdFromAI =
    aiEnabled && typeof proofOfAiUSDPerMonth === "number"
      ? proofOfAiUSDPerMonth / 30
      : 0;

  const dailyUsd = usdFromPoA + usdFromAI; // per license
  const monthlyUsd = dailyUsd * 30;
  const yearlyUsd = dailyUsd * 365;

  // Costs
  const licenseBasePrice = selected.priceUSD;
  const vatAmount =
    vatEnabled && typeof vatPercent === "number"
      ? (licenseBasePrice * vatPercent) / 100
      : 0;
  const costPerLicense = licenseBasePrice + vatAmount; // license + VAT only
  const hardwareUsd =
    hardwareEnabled && typeof hardwarePrice === "number" ? hardwarePrice : 0;
  const totalInvestment = costPerLicense + hardwareUsd; // total = license (+VAT) + hardware

  // ROI & APR
  const daysToROI =
    totalInvestment > 0 && dailyUsd > 0 ? totalInvestment / dailyUsd : Infinity;
  const weeksToROI = daysToROI / 7;
  const monthsToROI = daysToROI / 30;
  const apr =
    totalInvestment > 0 ? (yearlyUsd / totalInvestment) * 100 : Infinity;

  const breakEvenDate = useMemo(() => {
    if (!isFinite(daysToROI)) return null;
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(daysToROI));
    return d.toISOString().slice(0, 10);
  }, [daysToROI]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">ROI Calculator</h1>
        </header>
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
                volatility.
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
                      value={
                        typeof manualR1USD === "number"
                          ? String(manualR1USD)
                          : manualR1USD
                      }
                      onChange={(e) =>
                        setManualR1USD(parseDecimalInput(e.target.value))
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
                      value={
                        typeof vatPercent === "number"
                          ? String(vatPercent)
                          : vatPercent
                      }
                      placeholder="0"
                      onChange={(e) =>
                        setVatPercent(parseDecimalInput(e.target.value))
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
                      value={
                        typeof hardwarePrice === "number"
                          ? String(hardwarePrice)
                          : hardwarePrice
                      }
                      placeholder="0"
                      onChange={(e) =>
                        setHardwarePrice(parseDecimalInput(e.target.value))
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
                    1.45 R1 / day = {fmtCurrencyUSD(usdFromPoA)}
                  </span>
                </div>
              </div>

              {/* Proof of AI (optional) - now USD/month */}
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
                      value={
                        typeof proofOfAiUSDPerMonth === "number"
                          ? String(proofOfAiUSDPerMonth)
                          : proofOfAiUSDPerMonth
                      }
                      placeholder="0"
                      onChange={(e) =>
                        setProofOfAiUSDPerMonth(
                          parseDecimalInput(e.target.value)
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
                    vatEnabled && typeof vatPercent === "number"
                      ? `VAT (${fmtNumber(vatPercent, 1)}%)`
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
                <Row label="Estimated break-even date">
                  {breakEvenDate ?? "–"}
                </Row>
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
                  = Rewards/year ÷ Total investment
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                *APR is a simple ratio (no compounding). It does not account for
                fees, taxes (beyond optional VAT), downtime, or price volatility
                of R1/USD.
              </p>
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
                    (vatEnabled && typeof vatPercent === "number"
                      ? (t.priceUSD * vatPercent) / 100
                      : 0);
                  const roiDays = (licenseCostWithVat + hardwareUsd) / dailyUsd; // includes hardware if entered
                  return (
                    <tr key={t.id} className="border-b last:border-none">
                      <td className="p-2 font-medium">{t.id}</td>
                      <td className="p-2">{fmtCurrencyUSD(t.priceUSD)}</td>
                      <td className="p-2">
                        {fmtCurrencyUSD(licenseCostWithVat)}
                      </td>
                      <td className="p-2">
                        {isFinite(roiDays) ? fmtNumber(roiDays, 1) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            *ROI includes optional VAT and hardware if enabled.
          </p>
        </section>

        {/* Explanations */}
        <section className="mt-8 text-sm text-slate-700">
          <h2 className="mb-2 text-base font-semibold">Formulae</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Rewards/day</span> = (1.45 R1 × R1
              price) + (Proof of AI USD/month ÷ 30, if enabled).
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
              <span className="font-medium">Days to break-even</span> = Total
              investment ÷ Rewards/day.
            </li>
            <li>
              <span className="font-medium">APR</span> = (Rewards/year ÷ Total
              investment) × 100.
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
      <span className="font-semibold accent text-lg">{children}</span>
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
