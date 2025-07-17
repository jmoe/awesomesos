'use client'

import { useState, useEffect } from 'react'

const loadingStages = [
  {
    emoji: '🗺️',
    title: 'Unfolding the map...',
    messages: [
      'Finding the best routes for your adventure',
      'Plotting waypoints and scenic detours',
      'Checking for dragons (just kidding!)',
    ]
  },
  {
    emoji: '🏔️',
    title: 'Scouting the terrain...',
    messages: [
      'Analyzing elevation changes',
      'Identifying photo opportunities',
      'Looking for the best viewpoints',
    ]
  },
  {
    emoji: '🎒',
    title: 'Packing the essentials...',
    messages: [
      'Adding snacks (very important!)',
      'Double-checking the first aid kit',
      'Including emergency chocolate',
    ]
  },
  {
    emoji: '🌤️',
    title: 'Checking the weather...',
    messages: [
      'Consulting with local weather spirits',
      'Predicting perfect sunset times',
      'Planning for rainbow sightings',
    ]
  },
  {
    emoji: '🦺',
    title: 'Safety check in progress...',
    messages: [
      'Calculating safe rest points',
      'Finding cell coverage zones',
      'Locating nearby ice cream shops (for emergencies)',
    ]
  },
  {
    emoji: '📅',
    title: 'Creating your itinerary...',
    messages: [
      'Optimizing your daily adventures',
      'Adding time for spontaneous fun',
      'Building in snack breaks',
    ]
  },
  {
    emoji: '✨',
    title: 'Adding the magic touches...',
    messages: [
      'Sprinkling in some wonder',
      'Finalizing your epic journey',
      'Almost ready for adventure!',
    ]
  }
]

const adventureTips = [
  '💡 Did you know? The best adventures often happen when you take the scenic route!',
  '💡 Pro tip: Always pack one more snack than you think you need.',
  '💡 Fun fact: 87% of great stories start with "Remember that time we..."',
  '💡 Adventure wisdom: The journey is just as important as the destination.',
  '💡 Safety first: Tell someone your plans - they\'ll want to hear your stories later!',
  '💡 Remember: Every expert adventurer was once a beginner.',
  '💡 Travel hack: Download offline maps before you lose signal!',
]

export function TripGenerationLoader() {
  const [currentStage, setCurrentStage] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 2
      })
    }, 200)

    // Stage progression
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev >= loadingStages.length - 1) return prev
        return prev + 1
      })
    }, 3000)

    // Message rotation within each stage
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => {
        const stage = loadingStages[currentStage]
        return (prev + 1) % stage.messages.length
      })
    }, 1500)

    // Tip rotation
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % adventureTips.length)
    }, 4000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stageInterval)
      clearInterval(messageInterval)
      clearInterval(tipInterval)
    }
  }, [currentStage])

  const stage = loadingStages[currentStage]

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Main loading animation */}
      <div className="relative mb-8">
        {/* Spinning background circle */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-sos-orange/30"></div>
        </div>
        
        {/* Pulsing center emoji */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <span className="text-6xl animate-bounce-slow">{stage.emoji}</span>
        </div>
      </div>

      {/* Stage title */}
      <h3 className="text-2xl font-bold text-sos-dark mb-2 animate-fade-in">
        {stage.title}
      </h3>

      {/* Current message */}
      <p className="text-gray-600 mb-8 text-center animate-fade-in h-6">
        {stage.messages[currentMessage]}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-sos-blue to-sos-orange h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full bg-white/30 animate-shimmer"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Stage indicators */}
      <div className="flex gap-2 mb-8">
        {loadingStages.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index <= currentStage 
                ? 'w-8 bg-sos-orange' 
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Adventure tip */}
      <div className="max-w-md text-center p-4 bg-sos-light/20 rounded-lg animate-fade-in">
        <p className="text-sm text-gray-700">{adventureTips[tipIndex]}</p>
      </div>

      {/* Fun loading dots */}
      <div className="flex gap-1 mt-6">
        <span className="animate-bounce-delay-0">🏃</span>
        <span className="animate-bounce-delay-100">🏃‍♀️</span>
        <span className="animate-bounce-delay-200">🏃</span>
      </div>
    </div>
  )
}