"use client";
import { useEffect, useState, useRef } from "react";
import { useStudentLearning } from "../../hooks/use-student-learning";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";
import { Badge } from "@engducation/ui/components/badge";

interface LessonPlayerProps {
  courseId: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoPublicId: string | null;
    videoUrl: string | null;
    progressStatus: "learning" | "completed" | null;
    hasQuiz?: boolean;
  };
  onTakeQuiz: () => void;
}

export function LessonPlayer({ courseId, lesson, onTakeQuiz }: LessonPlayerProps) {
  const { trackContentProgress, getMediaUrl } = useStudentLearning(courseId);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const trackingInitiated = useRef<string | null>(null);

  const isVideo = lesson.videoPublicId || lesson.videoUrl;

  // Helper to fetch Signed URL
  const fetchSignedUrl = () => {
    setIsLoadingVideo(true);
    getMediaUrl.mutateAsync({ lessonId: lesson.id })
      .then((data) => {
        setSignedUrl(data.url);
        setExpiresAt(new Date(data.expiresAt));
        setIsLoadingVideo(false);
      })
      .catch(() => {
        setIsLoadingVideo(false);
      });
  };

  // Track page mount / lesson switch
  useEffect(() => {
    // Reset states
    setSignedUrl(null);
    setExpiresAt(null);
    setIsLoadingVideo(false);

    // Call IN_PROGRESS tracking on page mount/change for this lesson
    if (lesson.id && trackingInitiated.current !== lesson.id) {
      trackingInitiated.current = lesson.id;
      trackContentProgress.mutate({
        lessonId: lesson.id,
        status: "IN_PROGRESS",
      });
    }

    // If it's a video lesson, immediately fetch Cloudinary Signed URL
    if (isVideo) {
      fetchSignedUrl();
    }
  }, [lesson.id]);

  // Background timer to re-fetch URL 3 minutes before expiration (1 hour limit)
  useEffect(() => {
    if (!expiresAt || !signedUrl || !isVideo) return;

    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    // Schedule refresh 3 minutes (180,000ms) before actual expiration
    const refreshDelay = Math.max(0, timeUntilExpiry - 180000);

    const timer = setTimeout(() => {
      getMediaUrl.mutateAsync({ lessonId: lesson.id })
        .then((data) => {
          setSignedUrl(data.url);
          setExpiresAt(new Date(data.expiresAt));
        })
        .catch((err) => {
          console.error("Failed to background refresh signed URL:", err);
        });
    }, refreshDelay);

    return () => clearTimeout(timer);
  }, [expiresAt, signedUrl, lesson.id]);

  // Recover from playback failures (interruption / sudden expiration)
  const handleVideoError = () => {
    console.warn("Video playback failure or interruption. Re-fetching Signed URL...");
    getMediaUrl.mutateAsync({ lessonId: lesson.id })
      .then((data) => {
        setSignedUrl(data.url);
        setExpiresAt(new Date(data.expiresAt));
      });
  };

  const handleVideoPlay = () => {
    // Double safeguard to track in progress when playback actually starts
    trackContentProgress.mutate({
      lessonId: lesson.id,
      status: "IN_PROGRESS",
    });
  };

  const handleVideoEnded = () => {
    // Video ended event - track completed
    trackContentProgress.mutate({
      lessonId: lesson.id,
      status: "COMPLETED",
    });
  };

  const handleMarkCompleteManual = () => {
    trackContentProgress.mutate({
      lessonId: lesson.id,
      status: "COMPLETED",
    });
  };

  return (
    <Card className="border border-border rounded-md bg-card">
      <CardHeader className="py-3 border-b border-border flex flex-row items-center justify-between bg-muted/20">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
            {lesson.title}
          </CardTitle>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">Lesson ID: {lesson.id}</div>
        </div>
        {lesson.progressStatus === "completed" ? (
          <Badge className="text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
            COMPLETED
          </Badge>
        ) : lesson.progressStatus === "learning" ? (
          <Badge className="text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
            LEARNING
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] font-bold uppercase">
            NOT STARTED
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-foreground">
        {/* Short description */}
        {lesson.description ? (
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 border border-border rounded-md">
            {lesson.description}
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground bg-muted/30 p-3 border border-border rounded-md">
            Bài học này không có mô tả chi tiết.
          </p>
        )}

        {/* Video Player */}
        {isVideo ? (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Trình phát bài giảng (Cloudinary Secure Video Player)</label>
            <div className="aspect-video bg-black flex items-center justify-center border border-border rounded-lg relative overflow-hidden">
              {isLoadingVideo ? (
                <div className="text-xs text-slate-400 font-mono animate-pulse">ĐANG KÝ SIGNED URL CLOUDINARY...</div>
              ) : signedUrl ? (
                <video
                  src={signedUrl}
                  controls
                  onPlay={handleVideoPlay}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-rose-500 font-mono">KHÔNG THỂ TẢI VIDEO. VUI LÒNG THỬ LẠI.</div>
              )}
            </div>
            <div className="text-[9px] text-muted-foreground font-mono break-all line-clamp-1">
              Signed URL: {signedUrl ?? "chưa có"}
            </div>
          </div>
        ) : (
          /* Text Lesson Player */
          <div className="p-10 border border-dashed border-border bg-muted/10 rounded-md flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-2xl">📖</span>
            <div className="text-xs font-bold text-foreground">Bài học dạng Đọc tài liệu</div>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
              Bạn có thể đọc phần mô tả bài giảng phía trên. Sau khi đã nắm vững thông tin, hãy nhấn "Đánh dấu Hoàn thành" để cập nhật tiến trình!
            </p>
            <Button
              onClick={handleMarkCompleteManual}
              disabled={trackContentProgress.isPending}
              variant="default"
              className="w-full text-xs font-bold"
            >
              {trackContentProgress.isPending ? "ĐANG LƯU..." : "ĐÁNH DẤU HOÀN THÀNH (MARK COMPLETE)"}
            </Button>
          </div>
        )}

        {/* Footer controls & manual markers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex gap-2">
            {isVideo && (
              <Button
                variant="outline"
                onClick={handleMarkCompleteManual}
                disabled={trackContentProgress.isPending}
                className="text-xs font-bold"
              >
                {trackContentProgress.isPending ? "ĐANG LƯU..." : "ĐÁNH DẤU HOÀN THÀNH THỦ CÔNG"}
              </Button>
            )}
          </div>

          {lesson.hasQuiz && (
            <Button
              onClick={onTakeQuiz}
              disabled={lesson.progressStatus !== "completed"}
              variant={lesson.progressStatus === "completed" ? "default" : "outline"}
              className={`text-xs font-bold px-4 transition-all duration-500 rounded-xl ${
                lesson.progressStatus === "completed"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 scale-100 hover:scale-[1.03] active:scale-[0.98]"
                  : "opacity-40 cursor-not-allowed border-dashed text-muted-foreground select-none"
              }`}
            >
              {lesson.progressStatus === "completed" ? (
                "LÀM BÀI TẬP TRẮC NGHIỆM (QUIZ) ✍️"
              ) : (
                "🔒 XEM HẾT VIDEO ĐỂ MỞ KHÓA QUIZ"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
