import type { CSSProperties } from "react";
import type { CampaignBlock } from "@give-smarter/core";

const sectionBase = "px-6 py-16 sm:px-10 lg:px-16";
const sectionContainer = "mx-auto w-full max-w-6xl";

function renderCtaLink(
  label: string,
  href: string,
  variant: "primary" | "ghost" | "light" | "ghostLight"
) {
  if (variant === "primary") {
    return (
      <a
        className="inline-flex h-12 items-center justify-center rounded-full bg-[color:var(--campaign-accent)] px-6 text-sm font-semibold text-white transition hover:bg-[color:var(--campaign-accent-strong)]"
        href={href}
      >
        {label}
      </a>
    );
  }

  if (variant === "light") {
    return (
      <a
        className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[color:var(--campaign-accent-strong)] transition hover:bg-white/90"
        href={href}
      >
        {label}
      </a>
    );
  }

  if (variant === "ghostLight") {
    return (
      <a
        className="inline-flex h-12 items-center justify-center rounded-full border border-white/60 px-6 text-sm font-semibold text-white transition hover:border-white"
        href={href}
      >
        {label}
      </a>
    );
  }

  return (
    <a
      className="inline-flex h-12 items-center justify-center rounded-full border border-[color:var(--campaign-border)] px-6 text-sm font-semibold text-[color:var(--campaign-ink)] transition hover:border-[color:var(--campaign-accent)]"
      href={href}
    >
      {label}
    </a>
  );
}

export function BlockRenderer({ blocks }: { blocks: CampaignBlock[] }) {
  return (
    <div>
      {blocks.map((block, index) => {
        const style = { "--block-index": index } as CSSProperties;

        switch (block.type) {
          case "hero": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `hero-${index}`}
                data-campaign-block
                data-block-type="hero"
                style={{ ...style, backgroundImage: "var(--campaign-hero-gradient)" }}
                className={`${sectionBase} relative overflow-hidden bg-[color:var(--campaign-surface)] bg-cover bg-center`}
              >
                <div
                  data-campaign-float="slow"
                  className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[color:var(--campaign-highlight)] opacity-40 blur-3xl"
                />
                <div
                  data-campaign-float
                  className="absolute -bottom-28 left-6 h-72 w-72 rounded-full bg-[color:var(--campaign-accent)] opacity-25 blur-3xl"
                />
                <div className={`${sectionContainer} relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr]`}>
                  <div className="space-y-6">
                    {data.eyebrow ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--campaign-ink-muted)]">
                        {data.eyebrow}
                      </p>
                    ) : null}
                    <div className="space-y-4">
                      <h1 className="text-4xl font-semibold leading-tight text-[color:var(--campaign-ink)] sm:text-5xl lg:text-6xl font-[var(--font-campaign-display)]">
                        {data.title}
                      </h1>
                      {data.highlight ? (
                        <p className="max-w-xl text-base font-semibold text-[color:var(--campaign-accent-strong)]">
                          {data.highlight}
                        </p>
                      ) : null}
                      {data.subtitle ? (
                        <p className="max-w-xl text-lg leading-8 text-[color:var(--campaign-ink-soft)]">
                          {data.subtitle}
                        </p>
                      ) : null}
                    </div>
                    {data.stats && data.stats.length ? (
                      <div className="grid gap-4 sm:grid-cols-3">
                        {data.stats.map((stat, statIndex) => (
                          <div
                            key={`${stat.label}-${statIndex}`}
                            className="rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-4 py-3"
                          >
                            <p className="text-2xl font-semibold text-[color:var(--campaign-ink)]">
                              {stat.value}
                            </p>
                            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {data.primaryCta || data.secondaryCta ? (
                      <div className="flex flex-wrap gap-3">
                        {data.primaryCta
                          ? renderCtaLink(
                              data.primaryCta.label,
                              data.primaryCta.href,
                              "primary"
                            )
                          : null}
                        {data.secondaryCta
                          ? renderCtaLink(
                              data.secondaryCta.label,
                              data.secondaryCta.href,
                              "ghost"
                            )
                          : null}
                      </div>
                    ) : null}
                  </div>
                  {data.media ? (
                    <div className="relative">
                      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)]" />
                      <div className="relative overflow-hidden rounded-[32px] border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] shadow-[0_24px_60px_rgba(32,26,20,0.18)]">
                        <img
                          src={data.media.url}
                          alt={data.media.alt ?? ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {data.media.caption ? (
                        <p className="mt-3 text-sm text-[color:var(--campaign-ink-muted)]">
                          {data.media.caption}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          }
          case "story": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `story-${index}`}
                data-campaign-block
                data-block-type="story"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface-alt)]`}
              >
                <div className={`${sectionContainer} grid gap-10 lg:grid-cols-[0.95fr_1.05fr]`}>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                    <div className="space-y-4 text-base leading-7 text-[color:var(--campaign-ink-soft)]">
                      {data.body.map((paragraph, paragraphIndex) => (
                        <p key={`story-paragraph-${paragraphIndex}`}>{paragraph}</p>
                      ))}
                    </div>
                    {data.bullets && data.bullets.length ? (
                      <ul className="space-y-2 text-sm font-semibold text-[color:var(--campaign-ink)]">
                        {data.bullets.map((bullet, bulletIndex) => (
                          <li
                            key={`story-bullet-${bulletIndex}`}
                            className="flex items-center gap-3"
                          >
                            <span className="h-2 w-2 rounded-full bg-[color:var(--campaign-accent)]" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {data.image ? (
                    <div className="relative">
                      <div className="absolute -left-6 top-12 h-24 w-24 rounded-full bg-[color:var(--campaign-highlight)] opacity-50 blur-2xl" />
                      <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] shadow-[0_18px_50px_rgba(32,26,20,0.15)]">
                        <img
                          src={data.image.url}
                          alt={data.image.alt ?? ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          }
          case "impactStats": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `impact-${index}`}
                data-campaign-block
                data-block-type="impactStats"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface)]`}
              >
                <div className={`${sectionContainer} space-y-8`}>
                  {data.title ? (
                    <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.stats.map((stat, statIndex) => (
                      <div
                        key={`${stat.label}-${statIndex}`}
                        className="rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-5 py-4"
                      >
                        <p className="text-2xl font-semibold text-[color:var(--campaign-ink)]">
                          {stat.value}
                        </p>
                        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--campaign-ink-muted)]">
                          {stat.label}
                        </p>
                        {stat.detail ? (
                          <p className="mt-2 text-sm text-[color:var(--campaign-ink-soft)]">
                            {stat.detail}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          case "donationTiers": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `tiers-${index}`}
                id={block.id ?? "donate"}
                data-campaign-block
                data-block-type="donationTiers"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface-alt)]`}
              >
                <div className={`${sectionContainer} space-y-8`}>
                  <div className="space-y-3">
                    {data.title ? (
                      <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                        {data.title}
                      </h2>
                    ) : null}
                    {data.subtitle ? (
                      <p className="max-w-2xl text-base text-[color:var(--campaign-ink-soft)]">
                        {data.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.tiers.map((tier, tierIndex) => (
                      <div
                        key={`${tier.label}-${tierIndex}`}
                        className="group flex h-full flex-col justify-between rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-6 py-5 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(32,26,20,0.12)]"
                      >
                        <div className="space-y-3">
                          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--campaign-ink-muted)]">
                            {tier.label}
                          </p>
                          <p className="text-3xl font-semibold text-[color:var(--campaign-ink)]">
                            {tier.amount}
                          </p>
                          {tier.detail ? (
                            <p className="text-sm text-[color:var(--campaign-ink-soft)]">
                              {tier.detail}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-6">
                          {renderCtaLink("Select", "#donate", "primary")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          case "gallery": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `gallery-${index}`}
                data-campaign-block
                data-block-type="gallery"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface)]`}
              >
                <div className={`${sectionContainer} space-y-8`}>
                  {data.title ? (
                    <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.images.map((image, imageIndex) => (
                      <div
                        key={`${image.url}-${imageIndex}`}
                        className="overflow-hidden rounded-3xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)]"
                      >
                        <img
                          src={image.url}
                          alt={image.alt ?? ""}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          case "cta": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `cta-${index}`}
                data-campaign-block
                data-block-type="cta"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-accent)] text-white`}
              >
                <div className={`${sectionContainer} grid gap-8 lg:grid-cols-[1.1fr_0.9fr]`}>
                  <div className="space-y-4">
                    <h2 className="text-3xl font-semibold sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                    {data.body ? (
                      <p className="text-base text-white/90">{data.body}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    {renderCtaLink(data.primaryCta.label, data.primaryCta.href, "light")}
                    {data.secondaryCta
                      ? renderCtaLink(
                          data.secondaryCta.label,
                          data.secondaryCta.href,
                          "ghostLight"
                        )
                      : null}
                  </div>
                </div>
              </section>
            );
          }
          case "sponsors": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `sponsors-${index}`}
                data-campaign-block
                data-block-type="sponsors"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface-alt)]`}
              >
                <div className={`${sectionContainer} space-y-8`}>
                  {data.title ? (
                    <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {data.sponsors.map((sponsor, sponsorIndex) => (
                      <a
                        key={`${sponsor.name}-${sponsorIndex}`}
                        href={sponsor.href ?? "#"}
                        className="flex items-center justify-center rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-4 py-6 text-sm font-semibold text-[color:var(--campaign-ink)] transition hover:-translate-y-1"
                      >
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="h-10 w-auto object-contain"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          case "faq": {
            const { data } = block;
            return (
              <section
                key={block.id ?? `faq-${index}`}
                data-campaign-block
                data-block-type="faq"
                style={style}
                className={`${sectionBase} bg-[color:var(--campaign-surface)]`}
              >
                <div className={`${sectionContainer} space-y-6`}>
                  {data.title ? (
                    <h2 className="text-3xl font-semibold text-[color:var(--campaign-ink)] sm:text-4xl font-[var(--font-campaign-display)]">
                      {data.title}
                    </h2>
                  ) : null}
                  <div className="space-y-3">
                    {data.items.map((item, itemIndex) => (
                      <details
                        key={`${item.question}-${itemIndex}`}
                        className="group rounded-2xl border border-[color:var(--campaign-border)] bg-[color:var(--campaign-card)] px-5 py-4"
                      >
                        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--campaign-ink)]">
                          {item.question}
                        </summary>
                        <p className="mt-2 text-sm text-[color:var(--campaign-ink-soft)]">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
