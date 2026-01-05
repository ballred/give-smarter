import Link from "next/link";
import { prisma } from "@/lib/db";

type Totals = {
  fundraiserTotals: Map<string, number>;
  teamTotals: Map<string, number>;
  classroomTotals: Map<string, number>;
};

type PeerToPeerOverviewProps = {
  campaignId: string;
  campaignSlug: string;
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

function buildTotals(attributions: Array<{ amount: number; fundraiserId?: string | null; teamId?: string | null; classroomId?: string | null; }>): Totals {
  const fundraiserTotals = new Map<string, number>();
  const teamTotals = new Map<string, number>();
  const classroomTotals = new Map<string, number>();

  for (const attribution of attributions) {
    if (attribution.fundraiserId) {
      fundraiserTotals.set(
        attribution.fundraiserId,
        (fundraiserTotals.get(attribution.fundraiserId) ?? 0) + attribution.amount,
      );
    }
    if (attribution.teamId) {
      teamTotals.set(
        attribution.teamId,
        (teamTotals.get(attribution.teamId) ?? 0) + attribution.amount,
      );
    }
    if (attribution.classroomId) {
      classroomTotals.set(
        attribution.classroomId,
        (classroomTotals.get(attribution.classroomId) ?? 0) + attribution.amount,
      );
    }
  }

  return { fundraiserTotals, teamTotals, classroomTotals };
}

export async function PeerToPeerOverview({
  campaignId,
  campaignSlug,
  currency,
}: PeerToPeerOverviewProps) {
  const [fundraisers, teams, classrooms, attributions] = await Promise.all([
    prisma.peerFundraiser.findMany({
      where: { campaignId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.peerFundraisingTeam.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.peerFundraisingClassroom.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.peerFundraisingAttribution.findMany({
      where: { campaignId },
      include: { orderLineItem: true },
    }),
  ]);

  const totals = buildTotals(
    attributions.map((item) => ({
      amount: item.orderLineItem.totalAmount,
      fundraiserId: item.fundraiserId,
      teamId: item.teamId,
      classroomId: item.classroomId,
    })),
  );

  const fundraiserCards = fundraisers
    .map((fundraiser) => ({
      ...fundraiser,
      totalRaised: totals.fundraiserTotals.get(fundraiser.id) ?? 0,
    }))
    .sort((a, b) => b.totalRaised - a.totalRaised);

  const teamCards = teams
    .map((team) => ({
      ...team,
      totalRaised: totals.teamTotals.get(team.id) ?? 0,
    }))
    .sort((a, b) => b.totalRaised - a.totalRaised);

  const classroomCards = classrooms
    .map((classroom) => ({
      ...classroom,
      totalRaised: totals.classroomTotals.get(classroom.id) ?? 0,
    }))
    .sort((a, b) => b.totalRaised - a.totalRaised);

  return (
    <section id="peer-to-peer" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="space-y-3">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Fundraise together
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Support a student, classroom, or team and watch their total grow in
            real time.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-6 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Top fundraisers
            </h3>
            <div className="mt-4 space-y-3">
              {fundraiserCards.slice(0, 5).map((fundraiser) => (
                <Link
                  key={fundraiser.id}
                  href={`/campaigns/${campaignSlug}/peer-to-peer/fundraisers/${fundraiser.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--campaign-border)] bg-white px-4 py-3 text-sm text-[color:var(--campaign-ink)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                >
                  <span className="font-semibold">{fundraiser.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                    {formatCurrency(fundraiser.totalRaised, currency)}
                  </span>
                </Link>
              ))}
              {!fundraiserCards.length ? (
                <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                  No fundraisers yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-6 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Classrooms
            </h3>
            <div className="mt-4 space-y-3">
              {classroomCards.slice(0, 5).map((classroom) => (
                <Link
                  key={classroom.id}
                  href={`/campaigns/${campaignSlug}/peer-to-peer/classrooms/${classroom.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--campaign-border)] bg-white px-4 py-3 text-sm text-[color:var(--campaign-ink)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                >
                  <span className="font-semibold">{classroom.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                    {formatCurrency(classroom.totalRaised, currency)}
                  </span>
                </Link>
              ))}
              {!classroomCards.length ? (
                <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                  No classrooms yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-6 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Teams
            </h3>
            <div className="mt-4 space-y-3">
              {teamCards.slice(0, 5).map((team) => (
                <Link
                  key={team.id}
                  href={`/campaigns/${campaignSlug}/peer-to-peer/teams/${team.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--campaign-border)] bg-white px-4 py-3 text-sm text-[color:var(--campaign-ink)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                >
                  <span className="font-semibold">{team.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                    {formatCurrency(team.totalRaised, currency)}
                  </span>
                </Link>
              ))}
              {!teamCards.length ? (
                <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                  No teams yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {fundraiserCards.length ? (
          <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-6 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              All fundraisers
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fundraiserCards.map((fundraiser) => (
                <Link
                  key={fundraiser.id}
                  href={`/campaigns/${campaignSlug}/peer-to-peer/fundraisers/${fundraiser.slug}`}
                  className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4 text-sm text-[color:var(--campaign-ink)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,15,12,0.12)]"
                >
                  <div className="space-y-2">
                    <p className="text-base font-semibold">{fundraiser.name}</p>
                    <p className="text-xs text-[color:var(--campaign-ink-soft)]">
                      {formatCurrency(fundraiser.totalRaised, currency)} raised
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
