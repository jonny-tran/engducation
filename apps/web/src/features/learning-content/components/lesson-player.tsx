"use client";
import { useEffect, useState, useRef } from "react";
import { useStudentLearning } from "../hooks/use-student-learning";
import { Button } from "@engducation/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@engducation/ui/components/card";

interface LessonPlayerProps {
  courseId: string;
  lesson: {
    id: string;
    title: string;
    description: string | null;
    videoPublicId: string | null;
    videoUrl: string | null;
    progressStatus: "learning" | "completed" | null;
  };
  onTakeQuiz: () => void;
}

export function LessonPlayer({ courseId, lesson, onTakeQuiz }: LessonPlayerProps) {
  const { trackProgress, getMediaUrl } = useStudentLearning(courseId);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const trackingInitiated = useRef<string | null>(null);

  const isVideo = lesson.videoPublicId || lesson.videoUrl;

  // Track page mount / lesson switch
  useEffect(() => {
    // Reset signed URL
    setSignedUrl(null);
    setIsLoadingVideo(false);

    // Call IN_PROGRESS tracking on page mount/change for this lesson
    if (lesson.id && trackingInitiated.current !== lesson.id) {
      trackingInitiated.current = lesson.id;
      trackProgress.mutate({
        lessonId: lesson.id,
        status: "IN_PROGRESS",
      });
    }

    // If it's a video lesson, immediately fetch Cloudinary Signed URL
    if (isVideo) {
      setIsLoadingVideo(true);
      getMediaUrl.mutateAsync({ lessonId: lesson.id })
        .then((data) => {
          setSignedUrl(data.url);
          setIsLoadingVideo(false);
        })
        .catch(() => {
          setIsLoadingVideo(false);
        });
    }
  }, [lesson.id]);

  const handleVideoPlay = () => {
    // Double safeguard to track in progress when playback actually starts
    trackProgress.mutate({
      lessonId: lesson.id,
      status: "IN_PROGRESS",
    });
  };

  const handleVideoEnded = () => {
    // Video ended event - track completed
    trackProgress.mutate({
      lessonId: lesson.id,
      status: "COMPLETED",
    });
  };

  const handleMarkCompleteManual = () => {
    trackProgress.mutate({
      lessonId: lesson.id,
      status: "COMPLETED",
    });
  };

  return (
    <Card className="border border-slate-300 dark:border-slate-800 rounded-none bg-slate-50/50 dark:bg-slate-900/50">
      <CardHeader className="py-3 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            {lesson.title}
          </CardTitle>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Lesson ID: {lesson.id}</div>
        </div>
        <span
          className={`px-1.5 py-0.5 border text-[9px] font-bold ${
            lesson.progressStatus === "completed"
              ? "border-green-300 bg-green-50 text-green-500 dark:bg-green-950/20"
              : lesson.progressStatus === "learning"
              ? "border-yellow-300 bg-yellow-50 text-yellow-500 dark:bg-yellow-950/20"
              : "border-slate-300 bg-slate-50 text-slate-500 dark:bg-slate-900"
          }`}
        >
          {lesson.progressStatus === "completed"
            ? "COMPLETED"
            : lesson.progressStatus === "learning"
            ? "LEARNING"
            : "NOT STARTED"}
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Short description */}
        {lesson.description ? (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            {lesson.description}
          </p>
        ) : (
          <p className="text-xs italic text-slate-400 bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            Bài học này không có mô tả chi tiết.
          </p>
        )}

        {/* Video Player */}
        {isVideo ? (
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400">Trình phát bài giảng (Cloudinary Secure Video Player)</label>
            <div className="aspect-video bg-black flex items-center justify-center border border-slate-300 dark:border-slate-800 relative overflow-hidden">
              {isLoadingVideo ? (
                <div className="text-xs text-slate-400 font-mono animate-pulse">ĐANG KÝ SIGNED URL CLOUDINARY...</div>
              ) : signedUrl ? (
                <video
                  src={signedUrl}
                  controls
                  onPlay={handleVideoPlay}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-red-400 font-mono">KHÔNG THỂ TẢI VIDEO. VUI LÒNG THỬ LẠI.</div>
              )}
            </div>
            <div className="text-[9px] text-slate-400 font-mono break-all line-clamp-1">
              Signed URL: {signedUrl ?? "chưa có"}
            </div>
          </div>
        ) : (
          /* Text Lesson Player */
          <div className="p-10 border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-2xl">📖</span>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Bài học dạng Đọc tài liệu</div>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Bạn có thể đọc phần mô tả bài giảng phía trên. Sau khi đã nắm vững thông tin, hãy nhấn "Đánh dấu Hoàn thành" để cập nhật tiến trình!
            </p>
            <Button
              onClick={handleMarkCompleteManual}
              disabled={trackProgress.isPending}
              className="rounded-none bg-slate-950 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-bold py-1 h-8"
            >
              {trackProgress.isPending ? "ĐANG LƯU..." : "ĐÁNH DẤU HOÀN THÀNH (MARK COMPLETE)"}
            </Button>
          </div>
        )}

        {/* Footer controls & manual markers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-2">
            {isVideo && (
              <Button
                variant="outline"
                onClick={handleMarkCompleteManual}
                disabled={trackProgress.isPending}
                className="rounded-none border-slate-300 dark:border-slate-800 text-xs font-bold h-8"
              >
                {trackProgress.isPending ? "ĐANG LƯU..." : "ĐÁNH DẤU HOÀN THÀNH THỦ CÔNG"}
              </Button>
            )}
          </div>

          <Button
            onClick={onTakeQuiz}
            className="rounded-none bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold h-8 px-4"
          >
            LÀM BÀI TẬP TRẮC NGHIỆM (TAKE QUIZ) ✍️
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
