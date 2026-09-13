"use client";

import { useEffect, useState } from "react";
import type { BannerSlideShape } from "@/lib/banner";

export default function BannerCarousel({
  slides,
  autoplaySeconds = 5,
}: {
  slides: BannerSlideShape[];
  autoplaySeconds?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const ms = Math.max(2, autoplaySeconds) * 1000;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearInterval(timer);
  }, [slides.length, autoplaySeconds]);

  // No slides configured (or none with an image) — the section doesn't render at all.
  if (slides.length === 0) return null;

  function goTo(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  const slide = slides[index] ?? slides[0];

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.imageUrl} alt={slide.title ?? ""} className="banner-carousel__image" />
      {(slide.title || slide.subtitle || slide.buttonLabel) && (
        <div className="banner-carousel__caption">
          {slide.title && <h2>{slide.title}</h2>}
          {slide.subtitle && <p>{slide.subtitle}</p>}
          {slide.buttonLabel && <span className="btn btn--primary">{slide.buttonLabel}</span>}
        </div>
      )}
    </>
  );

  return (
    <section className="banner-carousel">
      <div className="banner-carousel__frame">
        {slide.link ? (
          <a href={slide.link} className="banner-carousel__slide">
            {content}
          </a>
        ) : (
          <div className="banner-carousel__slide">{content}</div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="banner-carousel__nav banner-carousel__nav--prev"
              aria-label="Previous slide"
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="banner-carousel__nav banner-carousel__nav--next"
              aria-label="Next slide"
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
            <div className="banner-carousel__dots" role="tablist" aria-label="Banner slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1}`}
                  className={`banner-carousel__dot${i === index ? " banner-carousel__dot--active" : ""}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
