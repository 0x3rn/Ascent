# Ascent — AI-Powered Career Toolkit

A premium, production-ready career toolkit that combines live A4 previews with AI-powered writing assistance across resumes, cover letters, and interview preparation. Built with Next.js 16 (App Router), Tailwind CSS v4, and DeepSeek AI.

## Features

### Resume Builder
- **Live A4 Preview** — Real-time split-screen workspace: edit on the left, see your resume update on the right
- **AI-Powered Writing** — Enhance bullet points, fix grammar, and tailor experience to specific job descriptions
- **Smart Paste (Magic Import)** — Paste raw LinkedIn text or old resumes; AI extracts and populates all form fields
- **ATS Matcher** — Paste a job description and get an ATS compatibility score, missing keywords, and actionable tips
- **Projects Section** — Dedicated section for GitHub projects with name, link, skills, and bullet points
- **PDF Export** — One-click A4 PDF download with print-optimized CSS and multi-page support
- **Markdown Support** — Summary and bullet points support Markdown formatting

### Cover Letter Builder
- **AI-Generated Letters** — Enter target role and company; AI crafts a tailored 3-4 paragraph cover letter
- **Sandbox Toggle** — Option to include your resume data as context, or generate a generalized letter
- **Skills Input** — Add up to 5 custom skills as pill badges for the AI to weave into the letter
- **Action Toolbar** — Copy Text, Shorten, Regenerate, Delete, and Download PDF
- **Business Letter Format** — Date, recipient, salutation, body paragraphs, and sign-off in standard format

### Interview Builder
- **Prep Guide Generator** — Generate tailored behavioral/technical interview questions with STAR answer outlines
- **Live Mock Interview** — Interactive AI chatbot that conducts a realistic mock interview based on your background and target role
- **Performance Report** — Get scored out of 100 on your mock interview with detailed feedback on your answers and areas for improvement
- **Export Ready** — Copy to clipboard or download your entire interview transcript and report as a beautifully formatted PDF

### Theme & Customization
- **Font Switcher** — Inter (Modern), Lora (Classic), Geist Mono (Tech) — affects all document previews
- **Accent Colors** — Slate, Navy, Forest — applied to name headings and section borders
- **Dark/Light Mode** — "Midnight & Frost" premium palette with Indigo accent and butter-smooth transitions
- **Zero FOUC** — next-themes with `suppressHydrationWarning` and `disableTransitionOnChange` prevents any flash

### Print & PDF
- **A4 Export** — All documents export as perfect A4 pages with 210mm width
- **Safari Fixes** — Table print hack ensures consistent margins on every page, even when content flows to page 2+
- **Mobile Parity** — Print output is identical whether on desktop or mobile (strict 210mm width enforced)
- **Cross-Bleeding Prevention** — Only the active document prints; builder UI is hidden via `print:hidden`

### Security
- **Cloudflare Turnstile** — Enterprise-grade bot protection integrated across all AI endpoints
- **Session Cookies** — Secure, seamless verification bypassing repeated CAPTCHAs during active sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Lucide React |
| State | React Context + useReducer |
| AI | DeepSeek (via OpenAI-compatible SDK) |
| Markdown | marked |
| PDF | react-to-print |
| Theme | next-themes |
| Fonts | Inter, Lora, Geist, Geist Mono (next/font/google) |

## Getting Started

### Prerequisites
- Node.js 18+
- A [DeepSeek API key](https://platform.deepseek.com/api_keys)

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
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
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
│   ├── actions/resume-ai.ts        # 8 DeepSeek server actions
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