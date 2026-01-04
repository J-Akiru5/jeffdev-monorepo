import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  ArrowLeft, 
  Check, 
  Crown,
  Sparkles,
  Users,
  Building2
} from "lucide-react";
import { GlassPanel, Button, Badge } from "@jdstudio/ui";

/**
 * Subscription Page
 * View current plan and upgrade options.
 */
export default async function SubscriptionPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Fetch user's current subscription (if any)
  const subscriptionsCollection = await getCollection("subscriptions");
  const subscription = await subscriptionsCollection.findOne({ userId });

  // Fetch usage stats
  const projectsCollection = await getCollection("projects");
  const rulesCollection = await getCollection("rules");
  
  const [projectCount, ruleCount] = await Promise.all([
    projectsCollection.countDocuments({ userId }),
    rulesCollection.countDocuments({ createdBy: userId }),
  ]);

  const currentTier = subscription?.tier || "free";

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

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
              {currentTier !== "free" && (
                <Badge variant="success">Pro</Badge>
              )}
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
        {/* Free Tier */}
        <PricingCard
          name="Free"
          description="Get started with the basics"
          price="₱0"
          period=""
          features={[
            "5 rules",
            "3 components",
            "1 project",
            "10 AI generations/month",
            "Export as Markdown"
          ]}
          current={currentTier === "free"}
          buttonLabel={currentTier === "free" ? "Current Plan" : "Downgrade"}
          disabled={currentTier === "free"}
        />

        {/* Pro Tier */}
        <PricingCard
          name="Pro"
          description="For serious developers"
          price="₱990"
          period="/month"
          icon={Crown}
          popular
          features={[
            "Unlimited rules",
            "Unlimited components",
            "10 projects",
            "500 AI generations/month",
            "IDE auto-sync",
            "All design systems",
            "All stack templates",
            "Priority support"
          ]}
          current={currentTier === "pro"}
          buttonLabel={currentTier === "pro" ? "Current Plan" : "Upgrade"}
          disabled={currentTier === "pro"}
          href="/api/subscriptions/checkout?tier=pro"
        />

        {/* Team Tier */}
        <PricingCard
          name="Team"
          description="Collaborate with your team"
          price="₱2,990"
          period="/month"
          icon={Users}
          features={[
            "Everything in Pro",
            "Unlimited projects",
            "2,000 AI generations/month",
            "Up to 10 team members",
            "Shared component library",
            "Team rule management",
            "Admin dashboard"
          ]}
          current={currentTier === "team"}
          buttonLabel={currentTier === "team" ? "Current Plan" : "Upgrade"}
          disabled={currentTier === "team"}
          href="/api/subscriptions/checkout?tier=team"
        />

        {/* Enterprise Tier */}
        <PricingCard
          name="Enterprise"
          description="Custom solutions for scale"
          price="Custom"
          period=""
          icon={Building2}
          features={[
            "Everything in Team",
            "Unlimited team members",
            "Unlimited AI generations",
            "SSO/SAML",
            "Audit logs",
            "Dedicated support",
            "Custom integrations"
          ]}
          current={currentTier === "enterprise"}
          buttonLabel="Contact Sales"
          href="mailto:enterprise@jeffdev.studio"
        />
      </div>

      {/* FAQ or Notes */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <FAQItem 
            question="Can I cancel anytime?"
            answer="Yes, you can cancel your subscription at any time. Your access continues until the end of your billing period."
          />
          <FAQItem 
            question="What payment methods do you accept?"
            answer="We accept PayPal for all subscriptions. This includes PayPal balance, linked cards, and bank accounts."
          />
          <FAQItem 
            question="How do I upgrade or downgrade?"
            answer="You can change your plan at any time. Upgrades are immediate, and downgrades take effect at the next billing cycle."
          />
        </div>
      </GlassPanel>
    </div>
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
  href
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
    <div className={`relative rounded-xl border p-6 transition-all ${
      popular 
        ? "border-cyan-500/30 bg-cyan-500/5" 
        : current
        ? "border-white/20 bg-white/5"
        : "border-white/10 bg-white/[0.02] hover:border-white/20"
    }`}>
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
          <Icon className={`h-6 w-6 mb-3 ${popular ? "text-cyan-400" : "text-white/40"}`} />
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
