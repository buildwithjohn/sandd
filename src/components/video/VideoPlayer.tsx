"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { upsertLessonProgress } from "@/lib/db";
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle } from "lucide-react";

interface VideoPlayerProps {
  bunnyVideoId: string;
  lessonId: string;
  studentId: string;
  initialProgress?: number;
  onComplete?: () => void;
  title?: string;
}

export default function VideoPlayer({
  bunnyVideoId,
  lessonId,
  studentId,
  initialProgress = 0,
  onComplete,
  title,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [watchPercent, setWatchPercent] = useState(initialProgress);
  const [isCompleted, setIsCompleted] = useState(initialProgress >= 90);
  const [lastSaved, setLastSaved] = useState(0);
  const saveThrottle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bunny.net embed URL
  // Format: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  // Library ID comes from env var
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID ?? "YOUR_LIBRARY_ID";
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?autoplay=false&responsive=true`;

  // Listen for Bunny.net player events via postMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Bunny.net sends timeupdate and ended events
      if (event.data?.type === "timeupdate") {
        const { currentTime, duration } = event.data;
        if (duration && duration > 0) {
          const percent = Math.round((currentTime / duration) * 100);
          setWatchPercent(percent);

          // Mark as completed when 90%+ watched
          if (percent >= 90 && !isCompleted) {
            setIsCompleted(true);
            onComplete?.();
          }

          // Save progress every 10 percentage points
          if (percent - lastSaved >= 10) {
            setLastSaved(percent);
            saveProgress(percent);
          }
        }
      }

      if (event.data?.type === "ended") {
        setWatchPercent(100);
        setIsCompleted(true);
        saveProgress(100);
        onComplete?.();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isCompleted, lastSaved]);

  const saveProgress = useCallback(
    async (percent: number) => {
      if (saveThrottle.current) clearTimeout(saveThrottle.current);
      saveThrottle.current = setTimeout(async () => {
        await upsertLessonProgress(studentId, lessonId, percent);
      }, 1000);
    },
    [studentId, lessonId]
  );

  // Save on unmount
  useEffect(() => {
    return () => {
      if (watchPercent > 0) {
        upsertLessonProgress(studentId, lessonId, watchPercent);
      }
    };
  }, [watchPercent, studentId, lessonId]);

  return (
    <div className="w-full">
      {/* Player container */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-blue"
        style={{ aspectRatio: "16/9" }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={title ?? "Lesson Video"}
        />
      </div>

      {/* Progress bar beneath player */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${watchPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <span className="text-slate-400 text-xs">{watchPercent}% watched</span>
          )}
        </div>
      </div>
    </div>
  );
}
