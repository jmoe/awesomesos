"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-sos-blue to-sos-dark text-white">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4">AwesomeS🤩S</h1>
        <p className="text-2xl md:text-3xl font-medium mb-6 text-yellow-300">
          When life goes sideways we got your back!
        </p>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Share your adventure plans with AI-powered safety info to keep your
          loved ones in the loop 🎒
        </p>
        <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
          <Link
            href="/create-trip"
            className="btn-primary inline-block w-full md:w-auto"
          >
            Create Trip Plan
          </Link>
          <Link
            href="/trips"
            className="bg-white text-sos-blue px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-block w-full md:w-auto"
          >
            Browse Adventures
          </Link>
        </div>
      </div>
    </section>
  );
}
