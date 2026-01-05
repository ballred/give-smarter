import Link from "next/link";
import { notFound } from "next/navigation";
import type { Campaign } from "@give-smarter/core";
import { prisma } from "@/lib/db";
import { DonationForm } from "./DonationForm";

type DetailProps = {
  campaign: Campaign;
  slug: string;
  showSuccess?: boolean;
  showCanceled?: boolean;
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

function progressPercent(total: number, goal?: number | null) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((total / goal) * 100));
}

async function getTotalRaised({
  fundraiserId,
  teamId,
  classroomId,
}: {
  fundraiserId?: string;
  teamId?: string;
  classroomId?: string;
}) {
  const attributions = await prisma.peerFundraisingAttribution.findMany({
    where: {
      fundraiserId,
      teamId,
      classroomId,
    },
    include: { orderLineItem: true },
  });

  return attributions.reduce(
    (sum, item) => sum + item.orderLineItem.totalAmount,
    0,
  );
}

export async function PeerFundraiserDetail({
  campaign,
  slug,
  showSuccess,
  showCanceled,
}: DetailProps) {
  const fundraiser = await prisma.peerFundraiser.findFirst({
    where: {
      campaignId: campaign.id ?? "",
      slug,
      status: "PUBLISHED",
    },
    include: {
      team: true,
      classroom: true,
    },
  });

  if (!fundraiser) {
    notFound();
  }

  const totalRaised = await getTotalRaised({ fundraiserId: fundraiser.id });
  const currency = campaign.currency ?? "USD";
  const goal = fundraiser.goalAmount ?? null;
  const percent = progressPercent(totalRaised, goal);

  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Fundraiser
            </p>
            <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
              {fundraiser.name}
            </h2>
            {fundraiser.story ? (
              <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                {fundraiser.story}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Raised
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {formatCurrency(totalRaised, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Goal
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {goal ? formatCurrency(goal, currency) : "No goal set"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Progress
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {percent}%
              </p>
            </div>
          </div>

          {(fundraiser.team || fundraiser.classroom) && (
            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
              {fundraiser.team ? (
                <Link
                  href={`/campaigns/${campaign.slug}/peer-to-peer/teams/${fundraiser.team.slug}`}
                  className="rounded-full border border-[color:var(--campaign-border)] bg-white px-4 py-2"
                >
                  Team: {fundraiser.team.name}
                </Link>
              ) : null}
              {fundraiser.classroom ? (
                <Link
                  href={`/campaigns/${campaign.slug}/peer-to-peer/classrooms/${fundraiser.classroom.slug}`}
                  className="rounded-full border border-[color:var(--campaign-border)] bg-white px-4 py-2"
                >
                  Classroom: {fundraiser.classroom.name}
                </Link>
              ) : null}
            </div>
          )}
        </div>

        <DonationForm
          campaign={campaign}
          showSuccess={showSuccess}
          showCanceled={showCanceled}
          attribution={{
            fundraiserId: fundraiser.id,
            teamId: fundraiser.teamId ?? undefined,
            classroomId: fundraiser.classroomId ?? undefined,
          }}
          returnPath={`/campaigns/${campaign.slug}/peer-to-peer/fundraisers/${fundraiser.slug}`}
        />
      </div>
    </section>
  );
}

export async function PeerTeamDetail({
  campaign,
  slug,
  showSuccess,
  showCanceled,
}: DetailProps) {
  const team = await prisma.peerFundraisingTeam.findFirst({
    where: { campaignId: campaign.id ?? "", slug },
    include: {
      fundraisers: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const totalRaised = await getTotalRaised({ teamId: team.id });
  const currency = campaign.currency ?? "USD";
  const goal = team.goalAmount ?? null;
  const percent = progressPercent(totalRaised, goal);

  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Team
            </p>
            <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
              {team.name}
            </h2>
            {team.story ? (
              <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                {team.story}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Raised
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {formatCurrency(totalRaised, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Goal
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {goal ? formatCurrency(goal, currency) : "No goal set"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Progress
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {percent}%
              </p>
            </div>
          </div>

          {team.fundraisers.length ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
                Fundraisers
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {team.fundraisers.map((fundraiser) => (
                  <Link
                    key={fundraiser.id}
                    href={`/campaigns/${campaign.slug}/peer-to-peer/fundraisers/${fundraiser.slug}`}
                    className="rounded-2xl border border-[color:var(--campaign-border)] bg-white px-4 py-3 text-sm text-[color:var(--campaign-ink)]"
                  >
                    {fundraiser.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DonationForm
          campaign={campaign}
          showSuccess={showSuccess}
          showCanceled={showCanceled}
          attribution={{ teamId: team.id }}
          returnPath={`/campaigns/${campaign.slug}/peer-to-peer/teams/${team.slug}`}
        />
      </div>
    </section>
  );
}

export async function PeerClassroomDetail({
  campaign,
  slug,
  showSuccess,
  showCanceled,
}: DetailProps) {
  const classroom = await prisma.peerFundraisingClassroom.findFirst({
    where: { campaignId: campaign.id ?? "", slug },
    include: {
      fundraisers: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classroom) {
    notFound();
  }

  const totalRaised = await getTotalRaised({ classroomId: classroom.id });
  const currency = campaign.currency ?? "USD";
  const goal = classroom.goalAmount ?? null;
  const percent = progressPercent(totalRaised, goal);

  return (
    <section className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <div className="rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] p-8 shadow-[0_20px_60px_rgba(18,15,12,0.08)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
              Classroom
            </p>
            <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
              {classroom.name}
            </h2>
            {classroom.grade ? (
              <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                {classroom.grade}
                {classroom.teacherName ? ` | ${classroom.teacherName}` : ""}
              </p>
            ) : classroom.teacherName ? (
              <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                {classroom.teacherName}
              </p>
            ) : null}
            {classroom.story ? (
              <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                {classroom.story}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Raised
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {formatCurrency(totalRaised, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Goal
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {goal ? formatCurrency(goal, currency) : "No goal set"}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--campaign-border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                Progress
              </p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--campaign-ink)]">
                {percent}%
              </p>
            </div>
          </div>

          {classroom.fundraisers.length ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
                Fundraisers
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {classroom.fundraisers.map((fundraiser) => (
                  <Link
                    key={fundraiser.id}
                    href={`/campaigns/${campaign.slug}/peer-to-peer/fundraisers/${fundraiser.slug}`}
                    className="rounded-2xl border border-[color:var(--campaign-border)] bg-white px-4 py-3 text-sm text-[color:var(--campaign-ink)]"
                  >
                    {fundraiser.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DonationForm
          campaign={campaign}
          showSuccess={showSuccess}
          showCanceled={showCanceled}
          attribution={{ classroomId: classroom.id }}
          returnPath={`/campaigns/${campaign.slug}/peer-to-peer/classrooms/${classroom.slug}`}
        />
      </div>
    </section>
  );
}
