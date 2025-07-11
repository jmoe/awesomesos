import Link from 'next/link'
import { Hero } from './components/Hero'
import { Features } from './components/Features'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <section className="px-4 py-16 text-center bg-sos-orange text-white">
        <h2 className="text-3xl font-bold mb-6">Ready for Your Next Adventure?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Let's make sure your loved ones know you're safe while you're out exploring!
        </p>
        <Link href="/create-trip" className="inline-block bg-white text-sos-orange px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transform transition-transform">
          Start Your Trip Plan 🚀
        </Link>
      </section>
    </main>
  )
}