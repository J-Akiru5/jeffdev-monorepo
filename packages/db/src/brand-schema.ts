import { z } from "zod";

/**
 * 🎨 Prism Brand Schema
 * Defines the structure for enterprise brand profiles.
 * Used for generating Prism Rules, design tokens, and multi-IDE exports.
 */

// Color validation (hex format)
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color");

/**
 * Brand color palette
 */
export const BrandColorsSchema = z.object({
  primary: HexColorSchema.describe("Primary brand color"),
  secondary: HexColorSchema.describe("Secondary brand color"),
  accent: HexColorSchema.describe("Accent/highlight color"),
  background: HexColorSchema.describe("Main background color"),
  surface: HexColorSchema.describe("Card/surface color"),
  text: HexColorSchema.describe("Primary text color"),
  textMuted: HexColorSchema.describe("Muted/secondary text color"),
});

export type BrandColors = z.infer<typeof BrandColorsSchema>;

/**
 * Typography configuration
 */
export const BrandTypographySchema = z.object({
  headingFont: z.string().min(1).describe("Font family for headings"),
  bodyFont: z.string().min(1).describe("Font family for body text"),
  monoFont: z.string().optional().describe("Font family for code/monospace"),
  scale: z.enum(["compact", "default", "spacious"]).describe("Typography scale"),
});

export type BrandTypography = z.infer<typeof BrandTypographySchema>;

/**
 * Voice and tone settings
 */
export const BrandVoiceSchema = z.object({
  personality: z.enum([
    "minimal",      // Clean, understated
    "warm",         // Friendly, approachable
    "bold",         // Confident, impactful
    "playful",      // Fun, creative
    "corporate",    // Professional, formal
  ]).describe("Brand personality"),
  formality: z.enum(["casual", "balanced", "formal"]).describe("Communication formality"),
  keywords: z.array(z.string()).max(10).describe("Brand keywords/values"),
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;

/**
 * Imagery and visual style
 */
export const BrandImagerySchema = z.object({
  style: z.enum(["photography", "illustration", "3d", "mixed"]).describe("Primary visual style"),
  mood: z.enum(["light", "dark", "moody", "vibrant"]).describe("Visual mood"),
  subjects: z.array(z.string()).max(10).describe("Common image subjects"),
});

export type BrandImagery = z.infer<typeof BrandImagerySchema>;

/**
 * Design spacing and geometry
 */
export const BrandSpacingSchema = z.object({
  unit: z.number().min(2).max(8).default(4).describe("Base spacing unit in pixels"),
  borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).describe("Border radius style"),
});

export type BrandSpacing = z.infer<typeof BrandSpacingSchema>;

/**
 * Complete Brand Profile
 */
export const PrismBrandSchema = z.object({
  id: z.string().describe("Unique brand identifier"),
  userId: z.string().describe("Owner's Clerk user ID"),
  
  // Identity
  companyName: z.string().min(1).max(100).describe("Company/brand name"),
  tagline: z.string().max(200).optional().describe("Brand tagline/slogan"),
  industry: z.enum([
    "photography",
    "tech",
    "agency",
    "ecommerce",
    "saas",
    "healthcare",
    "finance",
    "education",
    "other",
  ]).describe("Industry category"),
  
  // Design System
  colors: BrandColorsSchema,
  typography: BrandTypographySchema,
  voice: BrandVoiceSchema,
  imagery: BrandImagerySchema,
  spacing: BrandSpacingSchema,
  
  // Metadata
  createdAt: z.string().datetime().describe("Creation timestamp"),
  updatedAt: z.string().datetime().optional().describe("Last update timestamp"),
});

export type PrismBrand = z.infer<typeof PrismBrandSchema>;

/**
 * Brand creation input (without generated fields)
 */
export const CreateBrandSchema = PrismBrandSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;
