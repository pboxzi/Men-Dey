import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SITE_URL = "https://www.cmagency.me"

serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("SUPABASE_PROJECT_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (!supabaseUrl || !supabaseKey) {
      return new Response("Missing Supabase credentials", { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date().toISOString().split("T")[0]

    const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = []

    // Static pages
    urls.push({ loc: SITE_URL, lastmod: now, priority: "1.0", changefreq: "weekly" })
    urls.push({ loc: `${SITE_URL}/?nav=about`, lastmod: now, priority: "0.8", changefreq: "monthly" })
    urls.push({ loc: `${SITE_URL}/?nav=journal`, lastmod: now, priority: "0.9", changefreq: "weekly" })
    urls.push({ loc: `${SITE_URL}/?nav=media`, lastmod: now, priority: "0.8", changefreq: "monthly" })
    urls.push({ loc: `${SITE_URL}/?nav=community`, lastmod: now, priority: "0.8", changefreq: "weekly" })
    urls.push({ loc: `${SITE_URL}/?nav=experiences`, lastmod: now, priority: "0.9", changefreq: "monthly" })
    urls.push({ loc: `${SITE_URL}/?nav=membership`, lastmod: now, priority: "0.9", changefreq: "monthly" })
    urls.push({ loc: `${SITE_URL}/?nav=events`, lastmod: now, priority: "0.9", changefreq: "weekly" })
    urls.push({ loc: `${SITE_URL}/?nav=faq`, lastmod: now, priority: "0.6", changefreq: "monthly" })

    // Journal entries — only published ones
    try {
      const { data: entries } = await supabase
        .from("journal_entries")
        .select("id, title, created_at, updated_at")
        .order("created_at", { ascending: false })

      if (entries) {
        for (const entry of entries) {
          const title = (entry.title as string) || entry.id as string
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          const lastmod = (entry.updated_at || entry.created_at || now).split("T")[0]
          urls.push({
            loc: `${SITE_URL}/journal/${slug}`,
            lastmod,
            priority: "0.7",
            changefreq: "monthly"
          })
        }
      }
    } catch (_e) { /* table may not exist yet */ }

    // Journal articles — only published ones
    try {
      const { data: articles } = await supabase
        .from("journal_articles")
        .select("slug, title, created_at, updated_at, status")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (articles) {
        for (const article of articles) {
          const slug = article.slug || ((article.title as string) || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          if (!slug) continue
          const lastmod = (article.updated_at || article.created_at || now).split("T")[0]
          urls.push({
            loc: `${SITE_URL}/journal/${slug}`,
            lastmod,
            priority: "0.8",
            changefreq: "weekly"
          })
        }
      }
    } catch (_e) { /* table may not exist yet */ }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*"
      }
    })
  } catch (err) {
    return new Response(`Error generating sitemap: ${err}`, { status: 500 })
  }
})
