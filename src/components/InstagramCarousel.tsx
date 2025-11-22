import { useEffect, useState } from 'react'
import { instagramPhotos } from '../data/instagram'

const SLIDE_INTERVAL_MS = 5000

export default function InstagramCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const slideCount = instagramPhotos.length

  useEffect(() => {
    if (slideCount <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((previousIndex) => (previousIndex + 1) % slideCount)
    }, SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [slideCount])

  if (!slideCount) {
    return null
  }

  return (
    <section className="rounded-3xl bg-white px-8 py-10 ring-1 ring-stone-200 shadow-sm">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">Instagram Gallery</p>
          <h2 className="mt-3 text-3xl font-bold text-stone-900">Fresh Prints from Instagram</h2>
          <p className="mt-3 text-stone-600">
            A quick peek at the latest resin and FDM projects straight from our feed. Tap through for a closer look and
            follow along for more behind-the-scenes builds.
          </p>
          <a
            href="https://www.instagram.com/mg_mini_factory/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[var(--brand)]/90 transition"
          >
            Follow on Instagram
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M12.293 4.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 1 1-1.414-1.414L14.586 10l-2.293-2.293a1 1 0 0 1 0-1.414Z" />
              <path d="M4 10a1 1 0 0 1 1-1h11a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Z" />
            </svg>
          </a>
        </div>
        <div className="flex-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
            <div
              className="flex h-full w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {instagramPhotos.map((photo) => (
                <a
                  key={photo.id}
                  href={photo.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full w-full min-w-full"
                >
                  <img src={photo.imageUrl} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" />
                </a>
              ))}
            </div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/70 px-3 py-1 backdrop-blur">
              {instagramPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`Show Instagram photo ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    index === activeIndex ? 'bg-[var(--brand)]' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
