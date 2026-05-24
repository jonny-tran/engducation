"use client";
import React from "react";
import { Badge } from "@engducation/ui/components/badge";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "rose" | "blue" | "emerald" | "amber" | "purple";
}

interface AdminHeaderBannerProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  courseId?: string;
  stats?: StatItem[];
  rightAction?: React.ReactNode;
}

const colorMap = {
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300 dark:bg-rose-500/20 border border-rose-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300 dark:bg-blue-500/20 border border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 dark:bg-emerald-500/20 border border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300 dark:bg-amber-500/20 border border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-300 dark:bg-purple-500/20 border border-purple-500/20",
};

export function AdminHeaderBanner({
  title,
  subtitle,
  icon,
  courseId,
  stats,
  rightAction,
}: AdminHeaderBannerProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-card/90 via-muted/30 to-muted/20 dark:from-slate-950 dark:to-slate-900 p-5 md:p-6 rounded-2xl border border-muted/60 dark:border-white/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
      
      {/* Decorative Blur Orbs for visual layout depth */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left side: Icon & Title Metadata */}
      <div className="flex items-start gap-4 z-10 min-w-0">
        {icon && (
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl shrink-0 shadow-xs flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-black text-foreground tracking-tight leading-normal uppercase">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
              {subtitle}
            </p>
          )}

          {courseId && (
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <Badge className="bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider leading-none">
                Khóa học
              </Badge>
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-muted/80 dark:bg-white/5 border border-muted dark:border-white/10 px-2.5 py-0.5 rounded-lg select-all leading-none font-bold">
                ID: {courseId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Reusable Stats or Action items */}
      <div className="flex items-center gap-4 shrink-0 flex-wrap z-10">
        
        {/* Render Stats Grid conditionally */}
        {stats && stats.map((stat, idx) => {
          const colorClass = colorMap[stat.color ?? "rose"];
          return (
            <div
              key={idx}
              className="bg-card/85 border border-muted/50 dark:bg-white/5 dark:border-white/10 px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-md hover:bg-muted/15 dark:hover:bg-white/8 transition-all duration-200"
            >
              {stat.icon && (
                <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                  {stat.icon}
                </div>
              )}
              <div>
                <div className="text-xs md:text-sm font-black text-foreground font-mono leading-none">
                  {stat.value}
                </div>
                <div className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground mt-1.5 leading-none">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* Action Button slot */}
        {rightAction && (
          <div className="shrink-0">
            {rightAction}
          </div>
        )}

      </div>
    </div>
  );
}
