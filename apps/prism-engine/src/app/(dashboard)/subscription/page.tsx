import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import {
  Check,
  Crown,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import { GlassPanel, Button, Badge, PageContainer } from "@syntaxure/ui";
import { getPricingPlans, getPricingFAQs } from "@/lib/pricing-db";
import type { SubscriptionDoc } from "@/lib/types";

/**
 * Subscription Page
 * View current plan and upgrade options.
 */
export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userId = user.id;
  const db = getPrismDb();

  // Fetch user's current subscription (if any)
  const { data: subscriptionRow } = await db
    .from("prism_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .maybeSingle();
  const subscription = subscriptionRow as unknown as SubscriptionDoc | null;

  // Fetch usage stats
  const countOpts = { count: "exact" as const, head: true };
  const [
    { count: projectCountRaw },
    { count: ruleCountRaw },
    pricingPlans,
    faqs,
  ] = await Promise.all([
    db.from("prism_projects").select("id", countOpts).eq("user_id", userId),
    db.from("prism_rules").select("id", countOpts).eq("created_by", userId),
    getPricingPlans(),
    getPricingFAQs(),
  ]);
  const projectCount = projectCountRaw ?? 0;
  const ruleCount = ruleCountRaw ?? 0;

  const currentTier = subscription?.tier || "free";

  // Build pricing cards from dynamic data
  const tierIcons: Record<string, typeof Crown | undefined> = {
    pro: Crown,
    team: Users,
    enterprise: Building2,
  };

  return (
    <PageContainer className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Subscription</h1>
        <p className="text-sm text-white/50 mt-1">
          Choose the plan that fits your needs.
        </p>
      </div>

      {/* Current Plan Banner */}
      <GlassPanel className="p-6 border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">Current Plan</p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-semibold text-white capitalize">
                {currentTier}
              </h2>
              {currentTier === "free" && (
                <Badge variant="default">Active</Badge>
              )}
              {currentTier !== "free" && <Badge variant="success">Pro</Badge>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50">Usage This Month</p>
            <p className="text-lg font-semibold text-white mt-1">
              {projectCount} projects • {ruleCount} rules
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan) => {
          const Icon = tierIcons[plan.tier_slug];
          const isCurrent = currentTier === plan.tier_slug;

          // Format price display
          let priceDisplay: string;
          let periodDisplay: string;
          if (plan.pricePhp.monthly === null) {
            priceDisplay = "Custom";
            periodDisplay = "";
          } else if (plan.pricePhp.monthly === 0) {
            priceDisplay = "₱0";
            periodDisplay = "";
          } else {
            priceDisplay = `₱${plan.pricePhp.monthly.toLocaleString()}`;
            periodDisplay = "/month";
          }

          // Determine button label and href
          let buttonLabel: string;
          let href: string | undefined;
          if (isCurrent) {
            buttonLabel = "Current Plan";
          } else if (plan.tier_slug === "free") {
            buttonLabel = "Downgrade";
          } else if (plan.tier_slug === "enterprise") {
            buttonLabel = "Contact Sales";
            href = "mailto:enterprise@syntaxure.dev";
          } else {
            buttonLabel = "Upgrade";
            href = `/api/subscriptions/checkout?tier=${plan.tier_slug}`;
          }

          return (
            <PricingCard
              key={plan.tier_slug}
              name={plan.name}
              description={plan.tagline}
              price={priceDisplay}
              period={periodDisplay}
              icon={Icon}
              features={plan.features}
              popular={plan.popular}
              current={isCurrent}
              buttonLabel={buttonLabel}
              disabled={isCurrent}
              href={href}
            />
          );
        })}
      </div>

      {/* FAQ or Notes */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </GlassPanel>
    </PageContainer>
  );
}

function PricingCard({
  name,
  description,
  price,
  period,
  icon: Icon,
  features,
  popular,
  current,
  buttonLabel,
  disabled,
  href,
}: {
  name: string;
  description: string;
  price: string;
  period: string;
  icon?: typeof Crown;
  features: string[];
  popular?: boolean;
  current?: boolean;
  buttonLabel: string;
  disabled?: boolean;
  href?: string;
}) {
  return (
    <div
      className={`relative rounded-xl border p-6 transition-all ${
        popular
          ? "border-cyan-500/30 bg-cyan-500/5"
          : current
            ? "border-white/20 bg-white/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="info" className="bg-cyan-500 text-white border-none">
            <Sparkles className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-4">
        {Icon && (
          <Icon
            className={`h-6 w-6 mb-3 ${popular ? "text-cyan-400" : "text-white/40"}`}
          />
        )}
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="text-sm text-white/50">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-white/50">{period}</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <Check className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {href ? (
        <Button
          variant={popular ? "primary" : "secondary"}
          className="w-full"
          asChild
          disabled={disabled}
        >
          <Link href={href}>{buttonLabel}</Link>
        </Button>
      ) : (
        <Button
          variant={popular ? "primary" : "secondary"}
          className="w-full"
          disabled={disabled}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-white/5 pb-4 last:border-0">
      <h4 className="text-sm font-medium text-white">{question}</h4>
      <p className="text-sm text-white/50 mt-1">{answer}</p>
    </div>
  );
}
