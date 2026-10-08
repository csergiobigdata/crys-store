"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type ProductImage = { url: string; alt_text: string };

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return <div className="aspect-[4/5] rounded-2xl bg-rose-light/40" />;
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-rose-light/40">
        <Image
          src={active.url}
          alt={active.alt_text}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-blush",
                index === activeIndex ? "ring-rose" : "ring-transparent",
              )}
              aria-label={`Ver foto ${index + 1}`}
            >
              <Image src={image.url} alt={image.alt_text} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
