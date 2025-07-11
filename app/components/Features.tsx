const features = [
  {
    emoji: '🤖',
    title: 'AI-Powered Safety Info',
    description: 'Get intelligent safety recommendations based on your destination and activities',
  },
  {
    emoji: '📱',
    title: 'Share with One Tap',
    description: 'Instantly share your trip details with family and friends',
  },
  {
    emoji: '🗺️',
    title: 'Trip Timeline',
    description: 'Create detailed itineraries with check-in points and emergency contacts',
  },
  {
    emoji: '🚨',
    title: 'Emergency Resources',
    description: 'Access local emergency numbers and safety resources for any location',
  },
  {
    emoji: '🌤️',
    title: 'Weather & Conditions',
    description: 'Stay updated with real-time weather and trail conditions',
  },
  {
    emoji: '💬',
    title: 'Playful Updates',
    description: 'Send fun, automated updates to keep everyone informed and entertained',
  },
]

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">
          Safety Doesn't Have to Be Boring!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:scale-105 transform transition-transform">
              <div className="text-5xl mb-4">{feature.emoji}</div>
              <h3 className="text-xl font-bold mb-2 text-sos-dark">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}