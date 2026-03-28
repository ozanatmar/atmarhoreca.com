'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: Props) {
  const [selected, setSelected] = useState(0)
  const src = images[selected] ?? 'https://atmar.bg/atmar_horeca_logo_512x512.jpg'

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full max-w-lg rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          unoptimized
          sizes="(max-width: 640px) 100vw, 512px"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-[#6B3D8F]' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image src={img} alt={`${alt} ${i + 1}`} fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
