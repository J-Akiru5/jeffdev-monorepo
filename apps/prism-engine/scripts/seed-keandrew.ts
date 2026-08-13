/**
 * 🎨 Keandrew Photography Studio - Brand Seed Script
 *
 * Seeds the database with:
 * 1. Keandrew brand profile
 * 2. Prism Rules for the brand
 * 3. Component design patterns
 *
 * Run: npm run seed:keandrew
 *
 * The npm script uses dotenv-cli to load .env.local before running tsx.
 *
 * Migration note: the Cosmos-era version tagged everything with a literal
 * `userId: "demo-user"` string and left rules/components owner fields unset
 * entirely. Postgres requires a real UUID for prism_brands.user_id /
 * prism_rules.created_by / prism_components.user_id (all FK'd to
 * user_profiles), so this version creates/reuses one real demo Supabase
 * auth user and uses its id consistently. It also remaps the demo rule
 * categories ("design", "component", "voice") onto the governance category
 * enum prism_rules.category now enforces (architecture/styling/security/
 * performance/testing/documentation/custom) — Mongo never enforced that
 * enum at the DB level, this seed script just relied on it being absent.
 */

import { createClient } from "@supabase/supabase-js";
import { getPrismDb } from "@syntaxure-labs/db/prism";

const DEMO_EMAIL = "demo-keandrew@syntaxure.dev";
const DEMO_PASSWORD = `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`;

// Keandrew Brand Definition
const KEANDREW_BRAND = {
  slug: "keandrew-photography",
  companyName: "Keandrew Photography Studio",
  tagline: "Capturing Life's Authentic Moments",
  industry: "photography",

  colors: {
    primary: "#1A1A1A", // Rich black
    secondary: "#2D2D2D", // Dark grey
    accent: "#A08B5B", // Warm gold/bronze
    background: "#0F0F0F", // Deep black
    surface: "#1A1A1A", // Card black
    text: "#F5F2EE", // Cream white
    textMuted: "#6B6B6B", // Medium grey
  },

  typography: {
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Plus Jakarta Sans",
    monoFont: "JetBrains Mono",
    accentFont: "Cormorant Garamond", // For elegant quotes
    scale: "default",
  },

  voice: {
    personality: "minimal",
    formality: "balanced",
    keywords: [
      "authentic",
      "timeless",
      "elegant",
      "intimate",
      "refined",
      "storytelling",
    ],
  },

  imagery: {
    style: "photography",
    mood: "moody",
    subjects: ["portraits", "weddings", "events", "studio shots"],
  },

  spacing: {
    unit: 4,
    borderRadius: "sm",
  },
};

// Keandrew Prism Rules
const KEANDREW_RULES = [
  {
    name: "Keandrew Color System",
    category: "styling", // was "design" — not a valid prism_rules.category value
    priority: 1,
    tags: ["colors", "brand", "keandrew"],
    content: `# Keandrew Color System

## Primary Palette
The Keandrew brand uses a sophisticated dark palette with warm accents.

### Colors
- **Background**: \`#0F0F0F\` - Deep black, main canvas
- **Surface**: \`#1A1A1A\` - Cards and elevated elements
- **Primary**: \`#1A1A1A\` - Rich black for key elements
- **Accent**: \`#A08B5B\` - Warm bronze/gold for CTAs and highlights
- **Text**: \`#F5F2EE\` - Cream white for readability
- **Muted**: \`#6B6B6B\` - Grey for secondary text

## Usage Guidelines
1. Never use pure white (#FFFFFF) - always use cream (#F5F2EE)
2. Accent gold should be used sparingly for impact
3. Maintain high contrast between text and background
4. Use the grey (#6B6B6B) for captions and metadata`,
  },
  {
    name: "Keandrew Typography",
    category: "styling", // was "design"
    priority: 2,
    tags: ["typography", "fonts", "keandrew"],
    content: `# Keandrew Typography

## Font Stack
- **Primary**: Plus Jakarta Sans (Headings + Body)
- **Accent**: Cormorant Garamond (Quotes + Elegant Text)
- **Mono**: JetBrains Mono (Technical/Pricing)

## Heading Hierarchy
- H1: 48px / Bold / Plus Jakarta Sans / -0.02em tracking
- H2: 36px / SemiBold / Plus Jakarta Sans
- H3: 24px / Medium / Plus Jakarta Sans
- H4: 18px / Medium / Plus Jakarta Sans

## Body Text
- Default: 16px / Regular / Plus Jakarta Sans
- Small: 14px / Regular / Plus Jakarta Sans
- Caption: 12px / Regular / Plus Jakarta Sans (use muted color)

## Special Usage
- Client testimonials: Cormorant Garamond, Italic, 20px
- Pricing: JetBrains Mono for numbers
- Studio name in hero: Cormorant Garamond, 64px+`,
  },
  {
    name: "Keandrew Component Patterns",
    category: "architecture", // was "component"
    priority: 3,
    tags: ["components", "ui", "keandrew"],
    content: `# Keandrew Component Patterns

## Button Component
\`\`\`jsx
// Primary Button (Gold accent)
<button className="bg-[#A08B5B] text-[#0F0F0F] px-6 py-3 font-medium hover:bg-[#8A7549] transition-colors">
  Book a Session
</button>

// Secondary Button (Border only)
<button className="border border-white/20 text-[#F5F2EE] px-6 py-3 hover:bg-white/5 transition-colors">
  View Portfolio
</button>
\`\`\`

## Card Component
\`\`\`jsx
<div className="bg-[#1A1A1A] border border-white/5 p-6 hover:border-white/10 transition-colors">
  <img src="..." className="aspect-[4/5] object-cover" />
  <h3 className="font-medium text-[#F5F2EE] mt-4">Wedding Photography</h3>
  <p className="text-[#6B6B6B] text-sm mt-2">From ₱45,000</p>
</div>
\`\`\`

## Service Badge
\`\`\`jsx
<span className="bg-[#A08B5B]/10 text-[#A08B5B] px-3 py-1 text-xs font-medium uppercase tracking-wider">
  Studio Session
</span>
\`\`\`

## Image Gallery Grid
- Use 4:5 aspect ratio for portraits
- 3:2 for landscape shots
- Hover effect: slight zoom (scale 1.02) with brightness adjustment
- Gap: 16px (4 spacing units)`,
  },
  {
    name: "Keandrew Voice & Tone",
    category: "documentation", // was "voice"
    priority: 4,
    tags: ["copy", "voice", "keandrew"],
    content: `# Keandrew Voice & Tone

## Personality
**Minimal & Sophisticated** - We speak with quiet confidence. Less is more.

## Key Principles
1. **Authentic** - No stock phrases. Write like a real human.
2. **Intimate** - Speak directly to the client, use "you" frequently
3. **Elegant** - Avoid slang. Use refined vocabulary.
4. **Storytelling** - Focus on moments, not just photos

## Copy Examples

### Hero Tagline
✅ "Capturing Life's Authentic Moments"
❌ "Best Photographer in Town!"

### Service Description
✅ "Every wedding tells a story. We're here to preserve yours—every glance, every tear, every stolen kiss."
❌ "We offer professional wedding photography services."

### Call to Action
✅ "Let's create something timeless"
✅ "Book your session"
❌ "Click here to book NOW!!!"

## Word Bank (Use These)
authentic, intimate, timeless, curated, refined, cherished, moment, legacy, craft, artistry

## Avoid
cheap, discount, amazing, awesome, super, best ever, professional (overused)`,
  },
];

// UI Component Examples (stored in prism_components)
const KEANDREW_COMPONENTS = [
  {
    name: "Keandrew Hero Section",
    designSystem: "custom",
    stack: "nextjs",
    code: `export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-40">
        <img
          src="/images/hero-wedding.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1
          className="text-6xl md:text-7xl font-normal text-[#F5F2EE]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Keandrew
        </h1>
        <p className="text-[#6B6B6B] uppercase tracking-[0.3em] text-sm mt-4">
          Photography Studio
        </p>
        <p className="text-[#F5F2EE]/80 text-lg mt-8 font-light max-w-2xl mx-auto">
          Capturing life's authentic moments—from intimate portraits
          to the grandest celebrations.
        </p>
        <div className="flex gap-4 justify-center mt-12">
          <button className="bg-[#A08B5B] text-[#0F0F0F] px-8 py-3 font-medium hover:bg-[#8A7549] transition-colors">
            Book a Session
          </button>
          <button className="border border-[#F5F2EE]/20 text-[#F5F2EE] px-8 py-3 hover:bg-white/5 transition-colors">
            View Portfolio
          </button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    name: "Keandrew Service Card",
    designSystem: "custom",
    stack: "nextjs",
    code: `interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  image: string;
  category: "studio" | "wedding" | "event" | "portrait";
}

export function ServiceCard({ title, description, price, image, category }: ServiceCardProps) {
  const categoryColors = {
    studio: "#A08B5B",
    wedding: "#D4AF37",
    event: "#8B7355",
    portrait: "#C9B896",
  };

  return (
    <div className="group bg-[#1A1A1A] border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <span
          className="text-xs uppercase tracking-wider px-2 py-1 rounded"
          style={{
            backgroundColor: \`\${categoryColors[category]}15\`,
            color: categoryColors[category]
          }}
        >
          {category}
        </span>

        <h3 className="text-lg font-medium text-[#F5F2EE] mt-4">
          {title}
        </h3>
        <p className="text-[#6B6B6B] text-sm mt-2 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <span className="font-mono text-[#F5F2EE]">{price}</span>
          <button className="text-[#A08B5B] text-sm hover:underline">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    name: "Keandrew Testimonial",
    designSystem: "custom",
    stack: "nextjs",
    code: `interface TestimonialProps {
  quote: string;
  author: string;
  event: string;
}

export function Testimonial({ quote, author, event }: TestimonialProps) {
  return (
    <blockquote className="bg-[#1A1A1A] border border-white/5 p-8">
      <p
        className="text-xl text-[#F5F2EE] italic leading-relaxed"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        "{quote}"
      </p>
      <footer className="mt-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#A08B5B]/30" />
        <div className="text-right">
          <p className="text-[#F5F2EE] font-medium">{author}</p>
          <p className="text-[#6B6B6B] text-sm">{event}</p>
        </div>
      </footer>
    </blockquote>
  );
}

// Usage
<Testimonial
  quote="He didn't just capture our wedding—he told our story. Every photo feels like a cherished memory."
  author="Maria & James"
  event="December 2024 Wedding"
/>`,
  },
];

/**
 * Get or create the demo Supabase auth user that owns all Keandrew seed
 * data, and its matching user_profiles row (prism_brands/prism_rules/
 * prism_components all FK to a real user id now).
 */
async function getOrCreateDemoUser(): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Keandrew Demo" },
  });
  if (error) throw error;

  await supabase.from("user_profiles").upsert(
    {
      id: data.user.id,
      email: DEMO_EMAIL,
      full_name: "Keandrew Demo",
      role: "client",
      tier: "free",
    },
    { onConflict: "id" },
  );

  return data.user.id;
}

async function main() {
  console.log("🚀 Seeding Keandrew Photography Studio demo...");

  try {
    const demoUserId = await getOrCreateDemoUser();
    const db = getPrismDb();

    // Seed Brand
    await db.from("prism_brands").delete().eq("slug", KEANDREW_BRAND.slug);
    const { error: brandError } = await db.from("prism_brands").insert({
      user_id: demoUserId,
      slug: KEANDREW_BRAND.slug,
      company_name: KEANDREW_BRAND.companyName,
      tagline: KEANDREW_BRAND.tagline,
      industry: KEANDREW_BRAND.industry,
      colors: KEANDREW_BRAND.colors,
      typography: KEANDREW_BRAND.typography,
      voice: KEANDREW_BRAND.voice,
      imagery: KEANDREW_BRAND.imagery,
      spacing: KEANDREW_BRAND.spacing,
    });
    if (brandError) throw brandError;
    console.log("✅ Seeded Keandrew brand profile");

    // Seed Rules
    await db.from("prism_rules").delete().overlaps("tags", ["keandrew"]);
    const { error: rulesError } = await db.from("prism_rules").insert(
      KEANDREW_RULES.map((r) => ({
        name: r.name,
        category: r.category,
        priority: r.priority,
        tags: r.tags,
        content: r.content,
        created_by: demoUserId,
        is_active: true,
      })),
    );
    if (rulesError) throw rulesError;
    console.log(`✅ Seeded ${KEANDREW_RULES.length} Keandrew rules`);

    // Seed Components
    await db.from("prism_components").delete().ilike("name", "Keandrew%");
    const crypto = await import("crypto");
    const { error: componentsError } = await db.from("prism_components").insert(
      KEANDREW_COMPONENTS.map((c) => ({
        id: `comp_${crypto.randomBytes(12).toString("hex")}`,
        user_id: demoUserId,
        name: c.name,
        design_system: c.designSystem,
        stack: c.stack,
        code: c.code,
        generated_by: "manual",
      })),
    );
    if (componentsError) throw componentsError;
    console.log(`✅ Seeded ${KEANDREW_COMPONENTS.length} Keandrew components`);

    console.log("\n🎉 Done! Keandrew demo data seeded successfully.");
    console.log("\nTo view the demo:");
    console.log("1. Navigate to /brand in the dashboard");
    console.log("2. Look for 'Keandrew Photography Studio'");
    console.log("3. Export rules to your IDE!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
