import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Auto-rotating image carousel used inside the project modal.
function ImageCarousel({ images, interval = 4000 }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!images || images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images, interval])

  if (!images || images.length === 0) {
    return (
      <img
        src="https://placehold.co/800x450/6B7280/FFFFFF?text=Image+non+disponible"
        alt="Placeholder"
        className="w-full h-auto max-h-96 object-contain rounded-xl shadow-lg border border-gray-600 mb-4"
      />
    )
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-lg border border-gray-600 mb-4">
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        className="w-full h-full object-contain transition-opacity duration-500 ease-in-out"
        onError={(e) => {
          e.target.onerror = null
          e.target.src = 'https://placehold.co/600x400/6B7280/FFFFFF?text=Image+non+disponible'
        }}
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                currentIndex === index ? 'bg-persona-red' : 'bg-gray-400'
              } hover:bg-red-300 transition-colors duration-200`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Project / experience detail modal: carousel + optional YouTube + skills.
export default function GenericModal({ item, onClose, type }) {
  const [showVideo, setShowVideo] = useState(false)
  if (!item) return null

  const title = type === 'project' ? item.title : `${item.title} chez ${item.company}`
  const { description, images, videoUrl, skills } = item
  const externalLink = type === 'project' ? item.link : null
  const videoButtonThumbnail =
    images && images.length > 0 ? images[0] : 'https://placehold.co/100x100/6B7280/FFFFFF?text=Vidéo'

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative bg-gray-900 rounded-3xl shadow-2xl border-l-4 border-persona-red max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 md:p-10 transform scale-95 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
          aria-label="Fermer"
        >
          ×
        </button>

        <h2 className="font-title text-4xl md:text-5xl text-persona-cream mb-6 text-center uppercase" style={{ textShadow: '4px 4px 0 var(--red)' }}>
          {title}
        </h2>

        <div className="mb-6">
          {!showVideo && images && images.length > 0 ? (
            <ImageCarousel images={images} interval={4000} />
          ) : (
            videoUrl && (
              <div className="relative w-full aspect-video rounded-xl shadow-lg border border-gray-600 mb-4 overflow-hidden">
                <iframe
                  src={videoUrl}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            )
          )}
          {videoUrl && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-lg transform hover:scale-105 transition duration-300 ease-in-out animate-pulse-border-video overflow-hidden"
                style={{ backgroundImage: `url(${videoButtonThumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                aria-label={showVideo ? 'Voir les images' : 'Voir la vidéo'}
              >
                <div className="absolute inset-0 bg-black opacity-50 rounded-full" />
                {showVideo ? (
                  <svg className="w-10 h-10 relative z-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4h16v16H4z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 relative z-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 21V3l15 9-15 9z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        <p
          className="prose-read text-lg mb-6"
          dangerouslySetInnerHTML={{ __html: description }}
        />

        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h3 className="module-sub mb-3">Compétences clés</h3>
            <div className="flex flex-wrap">
              {skills.map((skill, index) => (
                <span key={index} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {externalLink && (
          <div className="text-center mt-8">
            <a href={externalLink} target="_blank" rel="noopener noreferrer" className="btn">
              <span>Visiter le site {type === 'project' ? 'du projet' : "de l'entreprise"}</span>
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
