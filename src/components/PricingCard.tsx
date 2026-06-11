"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

export interface PricingTier {
  id: string;
  tier: string;
  label: string;
  price: string;
  period: string;
  badge?: string;
  badgeStyle?: "popular" | "best-value" | "lms";
  features: Array<{ text: string; included: boolean; highlight?: boolean }>;
  ctaLabel: string;
  ctaVariant: "primary" | "secondary" | "ghost";
  highlighted?: boolean;
  onBuy?: () => void;
  isLoading?: boolean;
  isSignedIn?: boolean;
  isLoaded?: boolean;
  onTrialOpen?: () => void;
  isFree?: boolean;
  isCurrentPlan?: boolean;
}

const variantClasses: Record<PricingTier["ctaVariant"], string> = {
  primary:
    "w-full py-3 rounded-full bg-brand hover:bg-brand/90 text-brand-charcoal font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(5,130,202,0.2)]",
  secondary:
    "w-full py-3 rounded-full bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 font-bold text-[10px] tracking-widest uppercase transition-all",
  ghost:
    "w-full py-3 rounded-full border border-brand-border hover:border-brand/40 hover:text-brand font-bold text-[10px] tracking-widest uppercase transition-all",
};

/**
 * Reusable pricing tier card for /pricing page.
 * Extracted from the monolithic pricing page to enable independent testing.
 */
export default function PricingCard({
  tier,
  label,
  price,
  period,
  badge,
  badgeStyle,
  features,
  ctaLabel,
  ctaVariant,
  highlighted = false,
  onBuy,
  isLoading = false,
  isSignedIn = false,
  isLoaded = true,
  onTrialOpen,
  isFree = false,
  isCurrentPlan = false,
}: PricingTier) {
  const cardClass = highlighted
    ? "glass-panel border-brand/40 hover:border-brand p-6 rounded-3xl flex flex-col justify-between relative shadow-[0_0_30px_rgba(5,130,202,0.15)]"
    : "glass-panel border-brand-border/40 hover:border-brand-cream/10 p-6 rounded-3xl flex flex-col justify-between";

  const renderCTA = () => {
    if (!isLoaded) {
      return <div className="w-full h-11 bg-white/5 animate-pulse rounded-full" />;
    }

    if (!isSignedIn) {
      return (
        <SignInButton mode="modal">
          <button id={`pricing-signin-${tier}`} className={variantClasses[ctaVariant]}>
            Sign in to {isFree ? "start trial" : "buy"}
          </button>
        </SignInButton>
      );
    }

    if (isFree && onTrialOpen) {
      return (
        <button
          id={`pricing-trial-${tier}`}
          type="button"
          onClick={onTrialOpen}
          className={variantClasses["primary"]}
        >
          Start Free Trial
        </button>
      );
    }

    if (isCurrentPlan) {
      return (
        <Link
          href="/notes"
          id={`pricing-current-${tier}`}
          className={`text-center ${variantClasses["ghost"]}`}
        >
          Use Free Version
        </Link>
      );
    }

    return (
      <button
        id={`pricing-buy-${tier}`}
        disabled={isLoading}
        onClick={onBuy}
        className={variantClasses[ctaVariant]}
      >
        {isLoading ? "Processing..." : ctaLabel}
      </button>
    );
  };

  return (
    <motion.div whileHover={{ y: -5 }} className={cardClass} data-tier={tier}>
      {badge && badgeStyle === "popular" && (
        <div className="absolute top-3 right-4 bg-brand text-brand-charcoal text-[7px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
          {badge}
        </div>
      )}

      <div>
        {/* Tier label */}
        <span
          className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded border ${
            highlighted
              ? "text-brand bg-brand/10 border-brand/20"
              : "text-brand-cream/40 bg-white/5 border-white/5"
          }`}
        >
          {label}
        </span>

        {/* Title */}
        <h3 className="font-bebas text-2xl text-brand-cream mt-3 mb-4 tracking-wide">
          {tier.toUpperCase()}
        </h3>

        {/* Price */}
        <div className="flex items-baseline mb-6">
          <span className={`text-4xl font-bold ${highlighted ? "text-brand" : "text-brand-cream/80"}`}>
            {price}
          </span>
          <span className="text-xs text-brand-cream/40 ml-2">{period}</span>
        </div>

        {/* Feature list */}
        <ul className="text-[11px] text-brand-cream/75 space-y-3 mb-8">
          {features.map((f, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 ${!f.included ? "text-brand-cream/35" : ""} ${f.highlight ? "text-brand font-semibold" : ""}`}
            >
              <span className={`shrink-0 ${f.included ? "text-brand" : ""}`}>
                {f.included ? (f.highlight ? "★" : "✓") : "✕"}
              </span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {renderCTA()}
    </motion.div>
  );
}
