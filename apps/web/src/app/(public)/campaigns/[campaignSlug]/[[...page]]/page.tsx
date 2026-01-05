import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockRenderer, CampaignThemeProvider } from "@give-smarter/ui";
import { moduleTypeLabels } from "@give-smarter/core";
import { getCampaignBySlug } from "../campaign-data";
import { DonationForm } from "../DonationForm";
import { TicketPurchaseForm } from "../TicketPurchaseForm";
import { AuctionCatalog } from "../AuctionCatalog";
import { AuctionItemDetail } from "../AuctionItemDetail";
import { StorePurchaseForm } from "../StorePurchaseForm";
import { RafflePurchaseForm } from "../RafflePurchaseForm";
import { VotingForm } from "../VotingForm";
import styles from "../campaign-page.module.css";

type CampaignPageParams = {
  campaignSlug: string;
  page?: string[];
};

export async function generateMetadata({
  params,
}: {
  params: CampaignPageParams;
}): Promise<Metadata> {
  const campaign = await getCampaignBySlug(params.campaignSlug);

  if (!campaign) {
    return { title: "Campaign not found" };
  }

  const pageSlug = params.page?.[0] ?? "home";
  const page = campaign.pages.find((item) => item.slug === pageSlug);
  const title = page?.title
    ? `${page.title} | ${campaign.name}`
    : campaign.name;

  return {
    title,
    description: campaign.description,
  };
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: CampaignPageParams;
  searchParams?: { success?: string; canceled?: string };
}) {
  const campaign = await getCampaignBySlug(params.campaignSlug);

  if (!campaign) {
    notFound();
  }

  const pageSlug = params.page?.[0] ?? "home";
  const page = campaign.pages.find((item) => item.slug === pageSlug);

  if (!page) {
    notFound();
  }

  const enabledModules = campaign.modules.filter((module) => module.isEnabled);
  const donatePage = campaign.pages.find((item) => item.slug === "donate");
  const donateHref = donatePage
    ? `/campaigns/${campaign.slug}/${donatePage.slug}`
    : "#donate";
  const auctionItemId = params.page?.[1];
  const showDonationForm = page.slug === "donate";
  const showTicketForm = page.slug === "tickets";
  const showStoreForm = page.slug === "store";
  const showRaffleForm = page.slug === "raffle";
  const showVotingForm = page.slug === "voting";
  const showAuctionCatalog = page.slug === "auction" && !auctionItemId;
  const showAuctionItem = page.slug === "auction" && Boolean(auctionItemId);
  const showSuccess = searchParams?.success === "1";
  const showCanceled = searchParams?.canceled === "1";

  return (
    <CampaignThemeProvider theme={campaign.theme} className={styles.page}>
      <div className="relative">
        <header className="sticky top-0 z-20 border-b border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
            <Link
              href={`/campaigns/${campaign.slug}`}
              className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink)]"
            >
              {campaign.name}
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-[color:var(--campaign-ink-soft)] md:flex">
              {campaign.pages.map((item) => {
                const href =
                  item.slug === "home"
                    ? `/campaigns/${campaign.slug}`
                    : `/campaigns/${campaign.slug}/${item.slug}`;
                const isActive = item.slug === page.slug;
                return (
                  <Link
                    key={item.slug}
                    href={href}
                    className={
                      isActive
                        ? "text-[color:var(--campaign-ink)]"
                        : "transition hover:text-[color:var(--campaign-ink)]"
                    }
                  >
                    {item.title ?? item.slug}
                  </Link>
                );
              })}
            </nav>
            <Link
              href={donateHref}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
            >
              Donate
            </Link>
          </div>
        </header>

        <main>
          {enabledModules.length ? (
            <section className="px-6 pt-10 sm:px-10">
              <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3">
                {enabledModules.map((module) => (
                  <span
                    key={module.type}
                    className="inline-flex items-center rounded-full border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]"
                  >
                    {module.label ?? moduleTypeLabels[module.type]}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <BlockRenderer blocks={page.blocks} />
          {showDonationForm ? (
            <DonationForm
              campaign={campaign}
              showSuccess={showSuccess}
              showCanceled={showCanceled}
            />
          ) : null}
          {showTicketForm ? (
            <TicketPurchaseForm
              campaign={campaign}
              showSuccess={showSuccess}
              showCanceled={showCanceled}
            />
          ) : null}
          {showStoreForm ? (
            <StorePurchaseForm
              campaign={campaign}
              showSuccess={showSuccess}
              showCanceled={showCanceled}
            />
          ) : null}
          {showRaffleForm ? (
            <RafflePurchaseForm
              campaign={campaign}
              showSuccess={showSuccess}
              showCanceled={showCanceled}
            />
          ) : null}
          {showVotingForm ? (
            <VotingForm
              campaign={campaign}
              showSuccess={showSuccess}
              showCanceled={showCanceled}
            />
          ) : null}
          {showAuctionCatalog ? <AuctionCatalog campaign={campaign} /> : null}
          {showAuctionItem && auctionItemId ? (
            <AuctionItemDetail
              itemId={auctionItemId}
              currency={campaign.currency ?? "USD"}
            />
          ) : null}
        </main>

        <footer className="border-t border-[color:var(--campaign-border)] bg-[color:var(--campaign-surface)] px-6 py-10 sm:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[color:var(--campaign-ink)]">
                {campaign.name}
              </p>
              {campaign.description ? (
                <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                  {campaign.description}
                </p>
              ) : null}
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
              Powered by GiveSmarter
            </div>
          </div>
        </footer>
      </div>
    </CampaignThemeProvider>
  );
}
