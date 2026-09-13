"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export default function Carousel({
  images = [],
  className,
  autoPlay = false,
  interval = 5000,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <p className="text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex] || {};

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border bg-muted", className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Current Image */}
      <div className="aspect-video overflow-hidden">
        {currentImage.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage.url}
            alt={`Product image ${currentIndex + 1}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <p>Image not available</p>
          </div>
        )}
      </div>

      {/* Navigation Arrows (shown on hover) */}
      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100",
              isHovering && "opacity-70",
            )}
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 transition-opacity hover:opacity-100",
              isHovering && "opacity-70",
            )}
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to image ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-primary"
                  : "bg-muted-foreground/40 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}