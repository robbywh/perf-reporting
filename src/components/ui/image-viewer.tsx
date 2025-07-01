"use client";

import { ZoomIn, Loader } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ImageViewerProps {
  src: string | null;
  alt: string;
  className?: string;
  aspectRatio?: string;
  height?: string;
  zoomEnabled?: boolean;
  placeholderText?: string;
  onLoad?: () => void;
}

export function ImageViewer({
  src,
  alt,
  className = "",
  aspectRatio = "aspect-auto",
  height = "h-60",
  zoomEnabled = true,
  placeholderText = "No image available",
  onLoad,
}: ImageViewerProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Base container classes
  const containerClasses = `relative ${aspectRatio} ${height} w-full overflow-hidden rounded-lg border ${className}`;

  if (!src) {
    return (
      <div
        className={`${containerClasses} flex items-center justify-center bg-muted/10`}
      >
        <p className="text-muted-foreground">{placeholderText}</p>
      </div>
    );
  }

  const handleImageLoad = () => {
    setIsImageLoading(false);
    onLoad?.();
  };

  return (
    <>
      <div className={containerClasses}>
        {zoomEnabled && (
          <>
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center opacity-0 transition-opacity hover:bg-black/20 group-hover:opacity-100"
              onClick={() => setIsZoomOpen(true)}
            >
              <div className="rounded-full bg-black/50 p-3 transition-transform group-hover:scale-110">
                <ZoomIn className="size-6 text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-xs text-white opacity-70">
              Click to zoom
            </div>
          </>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          priority
          onLoad={handleImageLoad}
        />
      </div>

      {zoomEnabled && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-h-[95vh] w-[95vw] max-w-5xl overflow-hidden p-0">
            <DialogTitle className="sr-only">{alt} Preview</DialogTitle>
            <DialogDescription className="sr-only">
              Full-size view of the {alt}
            </DialogDescription>
            <div className="relative h-[85vh] w-full">
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader className="size-8 animate-spin" />
                </div>
              )}
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
                onLoad={() => setIsImageLoading(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
