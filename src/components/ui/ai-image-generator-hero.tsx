"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCard {
  id: string;
  src: string;
  alt: string;
  rotation: number;
}

interface ImageCarouselHeroProps {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  onCtaClick?: () => void;
  images: ImageCard[];
  features?: Array<{
    title: string;
    description: string;
  }>;
}

export function ImageCarouselHero({
  title,
  subtitle,
  description,
  ctaText,
  onCtaClick,
  images,
  features = [
    {
      title: "Realistic Results",
      description: "Photos that look professionally crafted",
    },
    {
      title: "Fast Generation",
      description: "Turn ideas into images in seconds.",
    },
    {
      title: "Diverse Styles",
      description: "Choose from a wide range of artistic options.",
    },
  ],
}: ImageCarouselHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const [rotatingCards, setRotatingCards] = useState<number[]>([]);

  // Initialize rotating cards
  useEffect(() => {
    setRotatingCards(images.map((_, i) => i * (360 / images.length)));
  }, [images.length]);

  // Continuous rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingCards((prev) =>
        prev.map((v) => (v + (isHovering ? 0.2 : 0.5)) % 360),
      );
    }, 50);
    return () => clearInterval(interval);
  }, [isHovering]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const perspectiveX = (mousePosition.x - 0.5) * 20;
  const perspectiveY = (mousePosition.y - 0.5) * 20;

  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-12 pb-16">
        {/* Carousel Container */}
        <div
          className="relative mb-10 h-[320px] w-full max-w-[520px] select-none sm:h-[420px]"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          style={{ perspective: "1000px" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `rotateY(${perspectiveX}deg) rotateX(${-perspectiveY}deg)`,
              transformStyle: "preserve-3d",
              transition: "transform 0.2s ease-out",
            }}
          >
            {images.map((image, index) => {
              const angle = ((rotatingCards[index] || 0) * Math.PI) / 180;
              const radius = 170;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius * 0.55; // flatten to an ellipse
              const z = Math.sin(angle) * 80;
              const scale = 0.7 + (z + 80) / 320;

              return (
                <div
                  key={image.id}
                  className="absolute h-32 w-24 sm:h-40 sm:w-32"
                  style={{
                    transform: `translate3d(${x}px, ${y}px, ${z}px) rotate(${image.rotation}deg) scale(${scale})`,
                    zIndex: Math.round(z + 100),
                  }}
                >
                  <div
                    className={cn(
                      "relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
                    )}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {/* Shine effect */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex max-w-3xl flex-col items-center text-center">
          <span className="mb-3 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            {subtitle}
          </span>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            {description}
          </p>

          {/* CTA Button */}
          <button
            type="button"
            onClick={onCtaClick}
            className="group mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {ctaText}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Features Section */}
        <div className="mt-14 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card/50 p-5 text-left"
            >
              <h3 className="text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
