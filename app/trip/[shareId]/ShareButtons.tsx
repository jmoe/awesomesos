'use client'

interface ShareButtonsProps {
  url: string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    sms: `sms:?body=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=Check%20out%20my%20trip%20safety%20plan%3A%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
      >
        📱 WhatsApp
      </a>
      <a
        href={shareLinks.sms}
        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
      >
        💬 Text Message
      </a>
      <a
        href={shareLinks.email}
        className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
      >
        ✉️ Email
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
      >
        📘 Facebook
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
      >
        𝕏 Twitter
      </a>
    </div>
  )
}