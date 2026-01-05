"use client";

import { useEffect, useMemo, useState } from "react";

type LiveDisplayData = {
  totalRaised: number;
  donationTotal: number;
  pledgeTotal: number;
  goalAmount: number | null;
  currency: string;
  updatedAt: string;
};

type LiveDisplayClientProps = {
  campaignId: string;
  campaignName: string;
  goalAmount: number | null;
  currency: string;
};

function formatCurrency(amount: number, currency: string) {
  const hasCents = amount % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount / 100);
}

export function LiveDisplayClient({
  campaignId,
  campaignName,
  goalAmount,
  currency,
}: LiveDisplayClientProps) {
  const [data, setData] = useState<LiveDisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchTotals() {
      try {
        const response = await fetch(`/api/live-display/${campaignId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load totals.");
        }

        const payload = (await response.json()) as {
          data?: LiveDisplayData;
        };

        if (isActive && payload.data) {
          setData(payload.data);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unable to load totals.");
        }
      }
    }

    fetchTotals();
    const interval = window.setInterval(fetchTotals, 2000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [campaignId]);

  const resolvedData = data ?? {
    totalRaised: 0,
    donationTotal: 0,
    pledgeTotal: 0,
    goalAmount,
    currency,
    updatedAt: "",
  };

  const progress = useMemo(() => {
    if (!resolvedData.goalAmount || resolvedData.goalAmount <= 0) {
      return 0;
    }
    return Math.min(
      100,
      Math.round((resolvedData.totalRaised / resolvedData.goalAmount) * 100),
    );
  }, [resolvedData.goalAmount, resolvedData.totalRaised]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-10 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">
            Live display
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{campaignName}</h1>
        </div>
        <div className="text-right text-sm text-zinc-400">
          {error ? "Offline" : "Updating"}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-10 py-12 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">
            Total raised
          </p>
          <h2 className="mt-4 text-6xl font-semibold">
            {formatCurrency(resolvedData.totalRaised, resolvedData.currency)}
          </h2>
        </div>

        {resolvedData.goalAmount ? (
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-400">
              <span>Goal</span>
              <span>
                {formatCurrency(resolvedData.goalAmount, resolvedData.currency)}{" "}
                | {progress}%
              </span>
            </div>
            <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Donations
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatCurrency(resolvedData.donationTotal, resolvedData.currency)}
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Paddle raise
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatCurrency(resolvedData.pledgeTotal, resolvedData.currency)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
