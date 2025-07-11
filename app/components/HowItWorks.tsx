const steps = [
  {
    step: 1,
    emoji: '📝',
    title: 'Tell Us Your Plans',
    description: 'Share your destination, activities, and timeline. The more details, the better our AI can help!',
    details: 'Just describe your adventure in plain English - hiking Mt. Washington, weekend camping, or city exploring.'
  },
  {
    step: 2,
    emoji: '🤖',
    title: 'AI Creates Your Safety Plan',
    description: 'Our AI generates personalized safety info, emergency contacts, and check-in reminders.',
    details: 'Get weather updates, local emergency numbers, trail conditions, and safety tips specific to your adventure.'
  },
  {
    step: 3,
    emoji: '🔗',
    title: 'Share with Loved Ones',
    description: 'Get a secure link to share your trip details with family and friends - no accounts needed!',
    details: 'They can see your itinerary, emergency contacts, and receive automated updates about your progress.'
  },
  {
    step: 4,
    emoji: '✅',
    title: 'Check In & Stay Safe',
    description: 'Follow your plan, check in at key points, and everyone stays informed automatically.',
    details: 'Send quick updates, get weather alerts, and have peace of mind knowing help is just a click away.'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-sos-light to-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-sos-dark">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From adventure planning to peace of mind in just 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {steps.map((step, index) => (
            <div key={index} className={`flex ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8`}>
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-sos-orange text-white flex items-center justify-center text-4xl font-bold shadow-lg">
                  {step.step}
                </div>
              </div>
              <div className="flex-1">
                <div className="card p-6 hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4">{step.emoji}</div>
                  <h3 className="text-2xl font-bold mb-3 text-sos-dark">{step.title}</h3>
                  <p className="text-lg text-gray-700 mb-3">{step.description}</p>
                  <p className="text-sm text-gray-500 italic">{step.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-sos-dark">
              🎯 Why Choose AwesomeSOS?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-semibold text-sos-dark mb-2">Lightning Fast</h4>
                <p className="text-sm text-gray-600">Create comprehensive safety plans in under 2 minutes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="font-semibold text-sos-dark mb-2">Privacy First</h4>
                <p className="text-sm text-gray-600">No accounts required, secure sharing, your data stays yours</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎭</div>
                <h4 className="font-semibold text-sos-dark mb-2">Fun & Friendly</h4>
                <p className="text-sm text-gray-600">Safety planning that doesn't feel like homework</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}