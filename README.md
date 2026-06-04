# Ascent — AI-Powered Resume Builder

A premium, production-ready resume builder that combines a live A4 preview with AI-powered writing assistance. Built with Next.js, Tailwind CSS, and DeepSeek AI.

## Features

- **Live A4 Preview** — See exactly how your resume looks on paper as you type
- **AI-Powered Writing** — Enhance bullet points, fix grammar, and tailor to job descriptions
- **Secure by Design** — All AI calls use Next.js Server Actions; API key never exposed to the client
- **PDF Export** — One-click A4 PDF download with proper print-optimized CSS
- **ATS-Friendly** — Classic serif typography optimized for applicant tracking systems
- **Markdown Support** — Summary and bullet points support Markdown formatting

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

Copy the example env file and add your DeepSeek API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
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

Three distinct AI actions available on every experience bullet section:

| Action | Description |
|--------|-------------|
| **Fix Grammar** | Corrects spelling, grammar, and punctuation; improves sentence flow |
| **Enhance** | Rewrites bullets with strong action verbs and metric-driven phrasing |
| **Tailor to Job** | Rewords bullets to match keywords from a target job description |

There's also an **Enhance Summary** action for the professional summary field.

## Project Structure

```
├── app/
│   ├── actions/resume-ai.ts        # Secure DeepSeek server actions
│   ├── globals.css                 # Tailwind, print styles, typography
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Split-screen workspace
├── components/
│   ├── builder/                    # Form sections (Personal, Experience, Education, Skills)
│   ├── preview/                    # A4 preview + PDF export
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── resume-context.tsx          # Global state management
│   ├── resume-types.ts             # TypeScript schema + defaults
│   └── utils.ts                    # Utility functions
└── public/                         # Static assets
```

## License

MIT