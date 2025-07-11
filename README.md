# AwesomeSOS 🚨🎒

> When life goes sideways, AwesomeSOS is on your side!

AI-powered adventure safety service that helps people stay safe on their adventures by generating intelligent safety information that can be shared with friends and family.

## Features

- 🤖 AI-powered safety recommendations
- 📱 Mobile-friendly design
- 🗺️ Trip planning and itinerary creation
- 🚨 Emergency contact information
- 🌤️ Weather and condition alerts
- 💬 Playful safety updates for loved ones

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
awesomesos/
├── app/
│   ├── components/     # Reusable UI components
│   ├── lib/           # Utilities and configurations
│   │   └── supabase/  # Supabase client setup
│   ├── types/         # TypeScript type definitions
│   ├── create-trip/   # Trip creation page
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles
├── public/            # Static assets
└── package.json       # Dependencies
```

## Next Steps

- Set up Supabase database schema for trips
- Integrate AI service for safety recommendations
- Add user authentication
- Implement trip sharing functionality
- Add real-time weather integration