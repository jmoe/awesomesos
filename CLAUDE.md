# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev              # Start development server with turbopack
pnpm build           # Production build  
pnpm start           # Start production server
pnpm lint            # ESLint with Next.js config
pnpm type-check      # TypeScript type checking
```

### Testing
No testing framework is currently configured. Consider adding Jest/Vitest for unit tests.

## Architecture

**AwesomeSOS** is an AI-powered adventure safety service built with Next.js 15 and TypeScript.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **AI**: OpenAI GPT-4o-mini and Anthropic Claude 3.5 Sonnet
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS v4 with custom sos-* color scheme
- **Type Safety**: TypeScript strict mode with comprehensive schemas

### Key Directories
```
app/                 # Next.js App Router
├── api/trips/      # Trip management API routes
├── components/     # Reusable UI components  
├── create-trip/    # Trip creation flow
└── trip/[shareId]/ # Anonymous trip sharing

lib/                # Core utilities
├── ai.ts          # AI integration with structured prompts
└── supabase/      # Database clients (client/server)

types/              # TypeScript definitions
supabase/           # Database schema and migrations
```

### Architecture Patterns
- **AI-First Design**: Structured prompt engineering with Zod schemas for type-safe AI outputs
- **Privacy-Focused**: Anonymous trip sharing via unique share IDs, no authentication required
- **Server Components**: Leverage Next.js App Router for optimal performance
- **Database Security**: Supabase RLS policies for secure data access

### Configuration Notes
- **TypeScript**: Strict mode enabled, never use `any` type
- **ESLint**: Custom rules enforcing TypeScript best practices and modern JS
- **Tailwind**: Custom color scheme (sos-orange, sos-blue, sos-light, sos-dark)
- **Environment**: Requires OPENAI_API_KEY, ANTHROPIC_API_KEY, and Supabase credentials

### AI Integration
The `lib/ai.ts` module handles AI safety content generation with:
- Structured prompts for consistent outputs
- Zod schemas for type-safe AI responses  
- Fallback handling for API failures
- Support for both OpenAI and Claude models

### Development Workflow
- Always run `pnpm lint` and `pnpm type-check` before commits
- Follow existing component patterns in `app/components/`
- Use server components by default, client components only when needed
- Maintain database schema in `supabase/migrations/`