"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { upsertLessonProgress } from "@/lib/db";
import { CheckCircle, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  youtubeVideoId: string;
  lessonId: string;
  studentId: string;
  initialProgress?: number;
  onComplete?: () => void;
  title?: string;
}

export default function VideoPlayer({
  youtubeVideoId,
  lessonId,
  studentId,
  initialProgress = 0,
  onComplete,
  title,
}: VideoPlayerProps) {
  const [watchPercent, setWatchPercent] = useState(initialProgress);
  const [isCompleted, setIsCompleted] = useState(initialProgress >= 90);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef(initialProgress);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadPlayer = () => {
      if (!(window as any).YT) return;
      playerRef.current = new (window as any).YT.Player(`yt-player-${lessonId}`, {
        videoId: youtubeVideoId,
        playerVars: {
          rel: 0,         // no related videos
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            setDuration(e.target.getDuration());
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.PLAYING) {
              // Poll progress every 5 seconds
              intervalRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player) return;
                const current = player.getCurrentTime();
                const total = player.getDuration();
                if (total > 0) {
                  const pct = Math.round((current / total) * 100);
                  setWatchPercent(pct);
                  if (pct >= 90 && !isCompleted) {
                    setIsCompleted(true);
                    onComplete?.();
                  }
                  // Save every 10%
                  if (pct - lastSavedRef.current >= 10) {
                    lastSavedRef.current = pct;
                    upsertLessonProgress(studentId, lessonId, pct).catch(() => {});
                  }
                }
              }, 5000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
            // Mark complete on video end
            if (e.data === YT.PlayerState.ENDED) {
              setWatchPercent(100);
              setIsCompleted(true);
              upsertLessonProgress(studentId, lessonId, 100).catch(() => {});
              onComplete?.();
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      loadPlayer();
    } else {
      // Load the API script once
      if (!document.getElementById("yt-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [youtubeVideoId, lessonId]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (watchPercent > 0) {
        upsertLessonProgress(studentId, lessonId, watchPercent).catch(() => {});
      }
    };
  }, [watchPercent, studentId, lessonId]);

  return (
    <div className="w-full">
      {/* Player */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden"
        style={{ aspectRatio: "16/9" }}>
        <div id={`yt-player-${lessonId}`} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${watchPercent}%` }}
          />
        </div>
        <div className="flex-shrink-0">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </span>
          ) : (
            <span className="text-slate-400 text-xs">{watchPercent}% watched</span>
          )}
        </div>
      </div>
    </div>
  );
}
