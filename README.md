# Ascent - AI-Powered Career Toolkit

A premium, production-ready career toolkit that combines live A4 previews with AI-powered writing assistance across resumes, cover letters, and interview preparation. Built with Next.js 16 (App Router), Tailwind CSS v4, and Gemini on Google Vertex AI.

## Features

### Resume Builder
- **Live A4 Preview:** Real-time split-screen workspace: edit on the left, see your resume update on the right
- **AI-Powered Writing:** Enhance bullet points, fix grammar, and tailor experience to specific job descriptions
- **Smart Paste (Magic Import):** Paste raw LinkedIn text or old resumes; AI extracts and populates all form fields
- **ATS Matcher:** Paste a job description and get an ATS compatibility score, missing keywords, and actionable tips
- **Projects Section:** Dedicated section for GitHub projects with name, link, skills, and bullet points
- **PDF Export:** One-click A4 PDF download with print-optimized CSS and multi-page support
- **Markdown Support:** Summary and bullet points support Markdown formatting

### Cover Letter Builder
- **AI-Generated Letters:** Enter target role and company; AI crafts a tailored 3-4 paragraph cover letter
- **Sandbox Toggle:** Option to include your resume data as context, or generate a generalized letter
- **Skills Input:** Add up to 5 custom skills as pill badges for the AI to weave into the letter
- **Action Toolbar:** Copy Text, Shorten, Regenerate, Delete, and Download PDF
- **Business Letter Format:** Date, recipient, salutation, body paragraphs, and sign-off in standard format

### Interview Builder
- **Prep Guide Generator:** Generate tailored behavioral/technical interview questions with STAR answer outlines
- **Live Mock Interview:** Interactive AI chatbot that conducts a realistic mock interview based on your background and target role
- **Performance Report:** Get scored out of 100 on your mock interview with detailed feedback on your answers and areas for improvement
- **Export Ready:** Copy to clipboard or download your entire interview transcript and report as a beautifully formatted PDF

### Theme & Customization
- **Font Switcher:** Inter (Modern), Lora (Classic), Geist Mono (Tech); affects all document previews
- **Accent Colors:** Slate, Navy, Forest; applied to name headings and section borders
- **Dark/Light Mode:** "Midnight & Frost" premium palette with Indigo accent and butter-smooth transitions
- **Zero FOUC:** next-themes with `suppressHydrationWarning` and `disableTransitionOnChange` prevents any flash

### Print & PDF
- **A4 Export:** All documents export as perfect A4 pages with 210mm width
- **Safari Fixes:** Table print hack ensures consistent margins on every page, even when content flows to page 2+
- **Mobile Parity:** Print output is identical whether on desktop or mobile (strict 210mm width enforced)
- **Cross-Bleeding Prevention:** Only the active document prints; builder UI is hidden via `print:hidden`

### Security
- **Cloudflare Turnstile:** Enterprise-grade bot protection integrated across all AI endpoints
- **Session Cookies:** Secure, seamless verification bypassing repeated CAPTCHAs during active sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Lucide React |
| State | React Context + useReducer |
| AI | Gemini on Google Vertex AI (via OpenAI-compatible SDK) |
| Markdown | marked |
| PDF | react-to-print |
| Theme | next-themes |
| Fonts | Inter, Lora, Geist, Geist Mono (next/font/google) |

## Getting Started

### Prerequisites
- Node.js 22+
- A Google Cloud project with Vertex AI enabled
- A service account permitted to use Vertex AI

### Installation

```bash
git clone https://github.com/0x3rn/Ascent.git
cd Ascent
npm install
```

### Environment Variables

Copy the example env file and add your keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-google-cloud-project-id","private_key":"your-private-key","client_email":"service-account@your-google-cloud-project-id.iam.gserviceaccount.com"}
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

### Cloudflare Workers deployment

Vercel remains the default deployment path. Cloudflare Workers is available through the additive OpenNext adapter, so the normal `next build` and `next start` commands are unchanged.

Install dependencies, then preview the Worker runtime locally:

```bash
npm install
cp .dev.vars.example .dev.vars
npm run preview:cloudflare
```

On PowerShell, use `Copy-Item .dev.vars.example .dev.vars` instead of `cp` if your shell does not provide the alias.

Deploy to a Cloudflare Worker after authenticating Wrangler:

```bash
npx wrangler login
npm run deploy:cloudflare
```

#### Cloudflare Workers Builds settings

If the Worker is connected to this repository through Cloudflare's Workers Builds, use these settings at the project root:

| Setting | Value |
|---------|-------|
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy` |
| Version command | Leave blank for normal production deploys. For gradual or preview versions, use `npx @opennextjs/cloudflare upload` |
| Root directory | `/` (the repository root) |

The regular `npm run build` command is intentionally kept for Vercel and produces a standard Next.js build. It does not create the `.open-next` Worker bundle, so using it as Cloudflare's build command causes deployment to fail with "Could not find compiled Open Next config". The equivalent repository scripts are `npm run build:cloudflare` and `npm run deploy:cloudflare` for local use.

The version command uploads a new Worker version without promoting it immediately. Use it only when you plan to manage a gradual rollout; it is not needed for the normal production deploy path.

The Cloudflare configuration is in `wrangler.jsonc`, the adapter settings are in `open-next.config.ts`, and the generated `.open-next` directory is ignored by Git. Set the same application secrets used by Vercel in Cloudflare Workers Build variables and secrets. The public Turnstile site key must be available as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the Google Cloud project, service-account JSON, and Turnstile secret remain server-only variables.

The Cloudflare adapter is pinned to a release compatible with the current Next.js 16.2.7 version. I can upgrade that pin when the project moves to a supported Next.js version.

OpenNext currently warns that its Worker bundler is not fully compatible with Windows. If the local Cloudflare build cannot create junctions or symlinks, run `npm run preview:cloudflare` in WSL or let Cloudflare Workers Builds run it in its Linux build environment. The Vercel build remains fully supported on this Windows checkout.

## AI Features

### Resume Actions

| Action | Description |
|--------|-------------|
| **Enhance Bullet** | Rewrites bullets with strong action verbs and metric-driven phrasing |
| **Fix Grammar** | Corrects spelling, grammar, and punctuation; improves sentence flow |
| **Tailor to Job** | Rewords bullets to match keywords from a target job description |
| **Enhance Summary** | Rewrites the professional summary to be more compelling and concise |
| **Magic Import** | Parses raw LinkedIn/resume text into structured form data via AI |

### Cover Letter Actions

| Action | Description |
|--------|-------------|
| **Generate** | Creates a 3-4 paragraph cover letter tailored to role and company |
| **Regenerate** | Generates a fresh cover letter using the same form inputs |
| **Shorten** | Condenses the cover letter to 2 highly impactful paragraphs |

### Interview Prep Actions

| Action | Description |
|--------|-------------|
| **Generate Prep Guide** | Creates 5 STAR-method behavioral/technical interview questions |
| **Live Mock Interview** | Start an interactive AI chatbot that interviews you in real-time |

### Analysis

| Action | Description |
|--------|-------------|
| **ATS Match** | Scores resume against job description (0-100), gives actionable bullet point rewrites, and skill gap analysis |

## Project Structure

```
├── app/
│   ├── actions/resume-ai.ts        # Gemini server actions with a commented DeepSeek fallback
│   ├── globals.css                 # Tailwind, HSL theme, print styles, transitions
│   ├── layout.tsx                  # Root layout + ThemeProvider
│   └── page.tsx                    # Split-screen workspace
├── components/
│   ├── builder/                    # Form sections
│   │   ├── personal-info-section.tsx
│   │   ├── experience-section.tsx
│   │   ├── projects-section.tsx
│   │   ├── education-section.tsx
│   │   ├── skills-section.tsx
│   │   ├── cover-letter-builder.tsx
│   │   └── ai-magic-button.tsx
│   ├── preview/                    # A4 document previews
│   │   ├── resume-preview.tsx
│   │   ├── cover-letter-preview.tsx
│   │   ├── interview-preview.tsx
│   │   └── pdf-export-button.tsx
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── skeleton.tsx
├── lib/
│   ├── resume-context.tsx          # Global state management (useReducer)
│   ├── resume-types.ts             # TypeScript schema + default sample data
│   └── utils.ts                    # cn() utility
└── public/                         # Static assets
```

## License

MIT
