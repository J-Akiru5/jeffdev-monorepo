-- Site pages table (CMS content management for static/marketing pages)
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_site_pages_slug ON site_pages(slug);

-- RLS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view site pages)
CREATE POLICY "Anyone can view site pages" ON site_pages
  FOR SELECT USING (true);

-- Authenticated users can insert site pages
CREATE POLICY "Authenticated users can insert site pages" ON site_pages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update site pages
CREATE POLICY "Authenticated users can update site pages" ON site_pages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_site_pages_updated_at BEFORE UPDATE ON site_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: default About page content
INSERT INTO site_pages (slug, content) VALUES (
  'about',
  $json${
    "hero": {
      "tagline": "// About.studio",
      "heading1": "We Build Systems",
      "heading2": "That Launch",
      "description": "Syntaxure Labs is a new-breed development agency architecting high-performance systems for ambitious startups. We don't just write code — we partner with founders to turn 'Zero to One' ideas into scalable reality.",
      "subDescription": "Est. 2025. Built on 5+ years of the founder's hands-on experience shipping production systems across SaaS, AI, and enterprise platforms."
    },
    "stats": [
      { "label": "Niche Focus", "value": "Specialized" },
      { "label": "Founder Exp", "value": "5+" },
      { "label": "Dedication", "value": "100%" },
      { "label": "Uptime SLA", "value": "99.9%" }
    ],
    "founder": {
      "name": "Jeff Edrick Martinez",
      "title": "Lead Architect & Founder",
      "bio": "Full-stack engineer with 5+ years building production systems. Specializing in Next.js, cloud architecture, and AI integration. Previously worked on projects for education, e-commerce, and SaaS clients.",
      "image": "/profilepic.webp",
      "email": "jeff@jeffdev.studio",
      "location": "Iloilo City, Philippines",
      "availability": "Available for Q1 2026 projects"
    },
    "techStack": {
      "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP"],
      "backend": ["Node.js", "Laravel", "PostgreSQL", "Firebase"],
      "cloud": ["Vercel", "AWS", "Cloudflare", "Docker"],
      "ai": ["OpenAI", "Claude", "Langchain", "Pinecone"]
    },
    "values": [
      {
        "title": "Clarity Over Complexity",
        "description": "We write code that's readable, maintainable, and built to last. No clever hacks — just clean architecture."
      },
      {
        "title": "Fixed Investment, No Surprises",
        "description": "We scope properly, quote fairly, and deliver on time. You know exactly what you're getting before we start."
      },
      {
        "title": "Partnership, Not Vendorship",
        "description": "We invest in your success. Our best clients become long-term partners who come back project after project."
      }
    ],
    "brandAssets": {
      "title": "Digital Business Card",
      "description": "High-resolution PNG",
      "image": "/syntaxure-business-card.png",
      "downloadUrl": "/syntaxure-business-card.png"
    }
  }$json$::jsonb
) ON CONFLICT (slug) DO NOTHING;
