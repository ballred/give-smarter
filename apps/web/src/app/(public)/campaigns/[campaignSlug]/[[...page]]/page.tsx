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
import { PeerToPeerOverview } from "../PeerToPeerOverview";
import {
  PeerClassroomDetail,
  PeerFundraiserDetail,
  PeerTeamDetail,
} from "../PeerToPeerDetail";
import { VolunteerSignupForm } from "../VolunteerSignupForm";
import { SponsorsPage } from "../SponsorsPage";
import styles from "../campaign-page.module.css";

type CampaignPageParams = {
  campaignSlug: string;
  page?: string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<CampaignPageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const campaign = await getCampaignBySlug(resolvedParams.campaignSlug);

  if (!campaign) {
    return { title: "Campaign not found" };
  }

  const pageSlug = resolvedParams.page?.[0] ?? "home";
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
  params: Promise<CampaignPageParams>;
  searchParams?: Promise<{
    success?: string;
    canceled?: string;
    watch?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    keyword?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const campaign = await getCampaignBySlug(resolvedParams.campaignSlug);

  if (!campaign) {
    notFound();
  }

  const pageSlug = resolvedParams.page?.[0] ?? "home";
  const page = campaign.pages.find((item) => item.slug === pageSlug);

  if (!page) {
    notFound();
  }

  const campaignPages = campaign.pages;
  const campaignSlug = campaign.slug;
  const enabledModules = campaign.modules.filter((module) => module.isEnabled);
  const donatePage = campaignPages.find((item) => item.slug === "donate");
  const currentPageHref =
    page.slug === "home"
      ? `/campaigns/${campaignSlug}`
      : `/campaigns/${campaignSlug}/${page.slug}`;

  function resolveCampaignHref(href: string) {
    const value = href.trim();
    if (!value.startsWith("#")) {
      return value;
    }

    const anchor = value.slice(1).trim().toLowerCase();
    if (!anchor) {
      return currentPageHref;
    }

    const targetPage = campaignPages.find(
      (item) => item.slug.toLowerCase() === anchor,
    );
    if (targetPage) {
      return targetPage.slug === "home"
        ? `/campaigns/${campaignSlug}`
        : `/campaigns/${campaignSlug}/${targetPage.slug}`;
    }

    return `${currentPageHref}#${anchor}`;
  }

  const donateHref = donatePage
    ? `/campaigns/${campaignSlug}/${donatePage.slug}`
    : currentPageHref;
  const auctionItemId = resolvedParams.page?.[1];
  const peerSection = resolvedParams.page?.[1];
  const peerSlug = resolvedParams.page?.[2];
  const showDonationForm = page.slug === "donate";
  const showTicketForm = page.slug === "tickets";
  const showStoreForm = page.slug === "store";
  const showRaffleForm = page.slug === "raffle";
  const showVotingForm = page.slug === "voting";
  const showAuctionCatalog = page.slug === "auction" && !auctionItemId;
  const showAuctionItem = page.slug === "auction" && Boolean(auctionItemId);
  const showVolunteerForm = page.slug === "volunteer";
  const showSponsorsPage = page.slug === "sponsors";
  const showPeerOverview = page.slug === "peer-to-peer" && !peerSection;
  const showPeerFundraiser =
    page.slug === "peer-to-peer" &&
    peerSection === "fundraisers" &&
    Boolean(peerSlug);
  const showPeerTeam =
    page.slug === "peer-to-peer" && peerSection === "teams" && Boolean(peerSlug);
  const showPeerClassroom =
    page.slug === "peer-to-peer" &&
    peerSection === "classrooms" &&
    Boolean(peerSlug);
  const showSuccess = resolvedSearchParams.success === "1";
  const showCanceled = resolvedSearchParams.canceled === "1";
  const showWatch = resolvedSearchParams.watch === "1";
  const tracking = {
    utmSource: resolvedSearchParams.utm_source,
    utmMedium: resolvedSearchParams.utm_medium,
    utmCampaign: resolvedSearchParams.utm_campaign,
    utmContent: resolvedSearchParams.utm_content,
    utmTerm: resolvedSearchParams.utm_term,
    keyword: resolvedSearchParams.keyword,
  };

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

          <BlockRenderer blocks={page.blocks} resolveHref={resolveCampaignHref} />
          {showDonationForm ? (
            <section id="donate">
              <DonationForm
                campaign={campaign}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
                tracking={tracking}
              />
            </section>
          ) : null}
          {showTicketForm ? (
            <section id="tickets">
              <TicketPurchaseForm
                campaign={campaign}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
              />
            </section>
          ) : null}
          {showStoreForm ? (
            <section id="store">
              <StorePurchaseForm
                campaign={campaign}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
              />
            </section>
          ) : null}
          {showRaffleForm ? (
            <section id="raffle">
              <RafflePurchaseForm
                campaign={campaign}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
              />
            </section>
          ) : null}
          {showVotingForm ? (
            <section id="voting">
              <VotingForm
                campaign={campaign}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
              />
            </section>
          ) : null}
          {showAuctionCatalog ? (
            <section id="auction">
              <AuctionCatalog campaign={campaign} />
            </section>
          ) : null}
          {showAuctionItem && auctionItemId ? (
            <section id="auction">
              <AuctionItemDetail
                itemId={auctionItemId}
                currency={campaign.currency ?? "USD"}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
                showWatch={showWatch}
              />
            </section>
          ) : null}
          {showVolunteerForm ? (
            <section id="volunteer">
              <VolunteerSignupForm
                campaign={campaign}
                showSuccess={showSuccess}
              />
            </section>
          ) : null}
          {showSponsorsPage && campaign.id ? (
            <section id="sponsors">
              <SponsorsPage campaignId={campaign.id} />
            </section>
          ) : null}
          {showPeerOverview ? (
            <section id="peer-to-peer">
              <PeerToPeerOverview
                campaignId={campaign.id ?? ""}
                campaignSlug={campaign.slug}
                currency={campaign.currency ?? "USD"}
              />
            </section>
          ) : null}
          {showPeerFundraiser && peerSlug ? (
            <section id="peer-to-peer">
              <PeerFundraiserDetail
                campaign={campaign}
                slug={peerSlug}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
                tracking={tracking}
              />
            </section>
          ) : null}
          {showPeerTeam && peerSlug ? (
            <section id="peer-to-peer">
              <PeerTeamDetail
                campaign={campaign}
                slug={peerSlug}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
                tracking={tracking}
              />
            </section>
          ) : null}
          {showPeerClassroom && peerSlug ? (
            <section id="peer-to-peer">
              <PeerClassroomDetail
                campaign={campaign}
                slug={peerSlug}
                showSuccess={showSuccess}
                showCanceled={showCanceled}
                tracking={tracking}
              />
            </section>
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
