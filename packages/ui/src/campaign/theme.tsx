import type { CSSProperties, ReactNode } from "react";
import type { CampaignThemeTokens } from "@give-smarter/core";
import { defaultCampaignTheme } from "@give-smarter/core";

type CampaignThemeProviderProps = {
  theme?: Partial<CampaignThemeTokens>;
  className?: string;
  children: ReactNode;
};

export function CampaignThemeProvider({
  theme,
  className,
  children,
}: CampaignThemeProviderProps) {
  const resolved = { ...defaultCampaignTheme, ...theme };
  const style = {
    "--campaign-surface": resolved.surface,
    "--campaign-surface-alt": resolved.surfaceAlt,
    "--campaign-ink": resolved.ink,
    "--campaign-ink-soft": resolved.inkSoft,
    "--campaign-ink-muted": resolved.inkMuted,
    "--campaign-accent": resolved.accent,
    "--campaign-accent-strong": resolved.accentStrong,
    "--campaign-highlight": resolved.highlight,
    "--campaign-border": resolved.border,
    "--campaign-card": resolved.card,
    "--campaign-hero-gradient": resolved.heroGradient,
  } as CSSProperties;

  return (
    <div
      style={style}
      className={`min-h-screen bg-[color:var(--campaign-surface)] text-[color:var(--campaign-ink)] ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
