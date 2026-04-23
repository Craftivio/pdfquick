# PDFQuick v2.1 — Fixes Bundle

This bundle contains all 23 files needed for the upgraded PDFQuick site. Drop them into your repo root (replacing the existing files) and redeploy.

## 🔧 Required Setup Before Deploy

### 1. GA4 Analytics ✅ (Already configured with ID: G-G0KEV25F42)

Every HTML file contains `G-G0KEV25F42` — replace this with your real Google Analytics 4 Measurement ID.

**How to get it:**
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a GA4 property for `usepdfquick.com`
3. Copy the Measurement ID (format: `G-ABC1234XYZ`)
4. Find & replace `G-G0KEV25F42` across all HTML files

**Quick sed command:**
```bash
find . -name "*.html" -exec sed -i 's/G-G0KEV25F42/G-YOUR-REAL-ID/g' {} \;
```

### 2. Update Contact Email (Optional)

`contact.html` uses `ashishsaha.work@gmail.com` as the support email. Either:
- Set up that email address with your domain provider, OR
- Find & replace `ashishsaha.work@gmail.com` with your actual email

### 3. Enable RLS in Supabase (if not already done)

Run this SQL in your Supabase SQL editor:

```sql
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON public.files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON public.files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON public.files
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. Configure GitHub OAuth (if not already done)

1. In Supabase → Authentication → Providers → GitHub → Enable
2. Paste your GitHub OAuth App Client ID & Secret
3. Save

---

## 📁 What's Included

| File | Purpose |
|------|---------|
| `index.html` | Homepage — 10 tools, FAQ, full SEO schema |
| `merge.html` | Merge PDF tool |
| `compress.html` | **Real** canvas-based PDF compression |
| `split.html` | Split PDF tool |
| `protect.html` | Password-protect PDFs |
| `unlock.html` | 🆕 Remove PDF password |
| `rotate.html` | Rotate pages |
| `watermark.html` | Text watermarks |
| `pdf-to-image.html` | PDF → JPG/PNG |
| `image-to-pdf.html` | JPG/PNG → PDF |
| `word-to-pdf.html` | 🆕 DOCX → PDF via mammoth.js |
| `dashboard.html` | User's file history (10 tools count, better empty state) |
| `login.html` | Login/signup + GitHub OAuth button |
| `contact.html` | 🆕 Contact form + support email |
| `privacy.html` | Privacy policy |
| `terms.html` | Terms of service |
| `script.js` | Core logic + cookie consent + GA event tracking |
| `supabase.js` | Supabase client init (unchanged) |
| `style.css` | All styles including cookie banner, related-tools |
| `favicon.svg` | Logo |
| `og-image.png` | 🆕 Social preview (1200×630) |
| `og-image.svg` | Source SVG for OG image |
| `robots.txt` | Correct sitemap URL + disallow login/dashboard |
| `sitemap.xml` | All 13 URLs with proper priorities |

---

## ✅ What Was Fixed in This Bundle

1. **OG image** — 1200×630 PNG finally exists (social shares now work)
2. **GA4 analytics** — Injected on every page (just swap ID)
3. **All tool pages** now have the full 10-tool footer (was showing only 4)
4. **Dashboard** — "10 Tools Available" stat, better empty state, quick-access grid
5. **Cookie consent banner** — GDPR compliant (required for AdSense)
6. **Contact page** — Real way for users to reach you
7. **Per-tool FAQ schema** — Each tool page has its own rich-results bait
8. **Breadcrumb schema** — Better Google SERP display
9. **Related tools cross-linking** — SEO internal linking + UX
10. **Auth retry logic** — Dashboard won't bounce users on transient session errors
11. **Event tracking** — `tool_start`, `tool_success`, `tool_error`, `login`, `sign_up` all fire to GA
12. **Error logging** — Tool failures auto-logged to console + GA
13. **XSS protection** — User-supplied strings (filenames, emails) now HTML-escaped
14. **Sitemap** — Includes contact.html and all 10 tools
15. **Robots.txt** — Correct domain, blocks login/dashboard from indexing

---

## 🚀 Deploy Steps

1. Upload all files to your repo root (overwrite existing)
2. Commit & push → Vercel auto-deploys
3. Verify `https://www.usepdfquick.com/og-image.png` loads
4. Test GitHub login flow
5. Paste your site URL into [Twitter Card Validator](https://cards-dev.twitter.com/validator) to confirm OG image shows
6. Submit sitemap to Google Search Console: `https://www.usepdfquick.com/sitemap.xml`

---

## 🎯 What's Still Optional (Not in This Bundle)

- **Blog posts** — Start with 3 targeting "how to merge PDF", "reduce PDF under 2MB", "convert PDF to JPG"
- **Real AdSense `<ins>` units** — You have the script loaded but no ad slots placed yet
- **Sentry error tracking** — Currently errors only go to GA; add Sentry for detailed stack traces
- **Image watermarks** — Currently text only
- **PDF to Word** — Not yet supported (complex to do client-side)

---

Built by Claude for PDFQuick. Happy shipping! ⚡
