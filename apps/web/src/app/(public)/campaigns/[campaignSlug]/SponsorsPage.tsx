import { prisma } from "@/lib/db";

type SponsorsPageProps = {
  campaignId: string;
};

export async function SponsorsPage({ campaignId }: SponsorsPageProps) {
  const placements = await prisma.sponsorPlacement.findMany({
    where: { campaignId },
    include: { sponsor: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const sponsors = [];
  const seen = new Set<string>();
  for (const placement of placements) {
    if (seen.has(placement.sponsorId)) continue;
    seen.add(placement.sponsorId);
    sponsors.push(placement.sponsor);
  }

  return (
    <section id="sponsors" className="px-6 pb-16 pt-8 sm:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
            Sponsors
          </h2>
          <p className="text-sm text-[color:var(--campaign-ink-soft)]">
            Thanks to our sponsors for supporting this campaign.
          </p>
        </header>

        {sponsors.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl ?? "#"}
                className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-6 py-6 text-center text-sm text-[color:var(--campaign-ink)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(18,15,12,0.12)]"
              >
                {sponsor.logoUrl ? (
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
                    Sponsor
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-base font-semibold">{sponsor.name}</p>
                  {sponsor.level ? (
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                      {sponsor.level}
                    </p>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--campaign-border)] bg-white p-6 text-sm text-[color:var(--campaign-ink-muted)]">
            Sponsor highlights will appear here soon.
          </div>
        )}
      </div>
    </section>
  );
}
