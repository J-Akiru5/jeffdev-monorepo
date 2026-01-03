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
 */

import { getCollection, closeConnection } from "@jeffdev/db";

// Keandrew Brand Definition
const KEANDREW_BRAND = {
  slug: "keandrew-photography",
  companyName: "Keandrew Photography Studio",
  tagline: "Capturing Life's Authentic Moments",
  industry: "photography",
  
  colors: {
    primary: "#1A1A1A",      // Rich black
    secondary: "#2D2D2D",    // Dark grey
    accent: "#A08B5B",       // Warm gold/bronze
    background: "#0F0F0F",   // Deep black
    surface: "#1A1A1A",      // Card black
    text: "#F5F2EE",         // Cream white
    textMuted: "#6B6B6B",    // Medium grey
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
    keywords: ["authentic", "timeless", "elegant", "intimate", "refined", "storytelling"],
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
  
  createdAt: new Date().toISOString(),
};

// Keandrew Prism Rules
const KEANDREW_RULES = [
  {
    name: "Keandrew Color System",
    category: "design",
    priority: 1,
    tags: ["colors", "brand", "keandrew"],
    isPublic: true,
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
    createdAt: new Date().toISOString(),
  },
  {
    name: "Keandrew Typography",
    category: "design",
    priority: 2,
    tags: ["typography", "fonts", "keandrew"],
    isPublic: true,
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
    createdAt: new Date().toISOString(),
  },
  {
    name: "Keandrew Component Patterns",
    category: "component",
    priority: 3,
    tags: ["components", "ui", "keandrew"],
    isPublic: true,
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
    createdAt: new Date().toISOString(),
  },
  {
    name: "Keandrew Voice & Tone",
    category: "voice",
    priority: 4,
    tags: ["copy", "voice", "keandrew"],
    isPublic: true,
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
    createdAt: new Date().toISOString(),
  },
];

// UI Component Examples (to be stored as "components" collection)
const KEANDREW_COMPONENTS = [
  {
    name: "Keandrew Hero Section",
    category: "section",
    framework: "nextjs",
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
    createdAt: new Date().toISOString(),
  },
  {
    name: "Keandrew Service Card",
    category: "component",
    framework: "nextjs",
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
    createdAt: new Date().toISOString(),
  },
  {
    name: "Keandrew Testimonial",
    category: "component",
    framework: "nextjs",
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
    createdAt: new Date().toISOString(),
  },
];

async function main() {
  console.log("🚀 Seeding Keandrew Photography Studio demo...");

  try {
    // Seed Brand
    const brandsCollection = await getCollection("brands");
    await brandsCollection.deleteMany({ slug: KEANDREW_BRAND.slug });
    await brandsCollection.insertOne({
      ...KEANDREW_BRAND,
      userId: "demo-user", // Special demo user
    });
    console.log("✅ Seeded Keandrew brand profile");

    // Seed Rules
    const rulesCollection = await getCollection("rules");
    await rulesCollection.deleteMany({ tags: { $in: ["keandrew"] } });
    await rulesCollection.insertMany(KEANDREW_RULES);
    console.log(`✅ Seeded ${KEANDREW_RULES.length} Keandrew rules`);

    // Seed Components
    const componentsCollection = await getCollection("components");
    await componentsCollection.deleteMany({ name: { $regex: /^Keandrew/ } });
    await componentsCollection.insertMany(KEANDREW_COMPONENTS);
    console.log(`✅ Seeded ${KEANDREW_COMPONENTS.length} Keandrew components`);

    console.log("\n🎉 Done! Keandrew demo data seeded successfully.");
    console.log("\nTo view the demo:");
    console.log("1. Navigate to /brand in the dashboard");
    console.log("2. Look for 'Keandrew Photography Studio'");
    console.log("3. Export rules to your IDE!\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();
