"use client";

import { useStudyStore, Event } from "@/store/useStudyStore";
import { cn, getGradeColor, hexToRgb, formatEventTitle } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMemo } from "react";

interface EventsMatrixProps {
    events: Event[];
    onEditEvent: (event: Event) => void;
    onAddEvent: (date: Date, courseId: string) => void;
    fullPage?: boolean;
}

export function EventsMatrix({ events, onEditEvent, onAddEvent, fullPage = false }: EventsMatrixProps) {
    const { courses, semesters, activeSemesterId, settings } = useStudyStore();

    // 1. Determine Date Range (Start of earliest event to End of latest event, or current month)
    const dateRange = useMemo(() => {
        const activeSemester = semesters.find(s => s.id === activeSemesterId);

        if (activeSemester) {
            const start = new Date(activeSemester.startDate);
            const end = new Date(activeSemester.endDate);
            const dates: Date[] = [];
            let current = new Date(start);
            while (current <= end) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            return dates;
        }

        if (events.length === 0) return [];

        const timestamps = events.map(e => e.date);
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));

        // Pad with a few days
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 14);

        const dates: Date[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [events, semesters, activeSemesterId]);

    // 2. Group Events by Date and Course
    const getEventsForCell = (courseId: string, date: Date) => {
        return events.filter(e =>
            e.courseId === courseId &&
            new Date(e.date).toDateString() === date.toDateString()
        );
    };

    const getScoreStyles = (score: number | null | undefined) => {
        const undefinedColor = settings?.undefinedColor || "#71717a";
        const gradeColors = settings?.gradeColors || [
            { min: 80, color: "#22c55e" },
            { min: 50, color: "#eab308" },
            { min: 0, color: "#ef4444" }
        ];

        if (score === null || score === undefined) {
            const rgb = hexToRgb(undefinedColor);
            const bg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)` : undefinedColor;
            return {
                style: {
                    backgroundColor: bg,
                    color: undefinedColor,
                    borderColor: bg
                },
                className: "font-medium border"
            };
        }

        const color = getGradeColor(score, gradeColors);
        const rgb = hexToRgb(color);
        const bg = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)` : color;

        return {
            style: {
                backgroundColor: bg,
                color: color,
                borderColor: bg
            },
            className: "font-bold border"
        };
    };

    if (courses.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground/80">Semester Matrix</h3>
            </div>

            <GlassCard className={cn(
                "flex flex-col border-0 bg-transparent shadow-none",
                fullPage ? "" : "overflow-hidden h-[80vh]"
            )}>
                <div className={cn(
                    "relative rounded-xl border border-black/10 dark:border-white/10 bg-background/50 backdrop-blur-xl",
                    fullPage ? "" : "overflow-auto flex-1"
                )}>
                    <div className="w-full min-w-max">
                        {/* Header Row */}
                        <div className="flex sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-black/10 dark:border-white/10">
                            <div className="w-32 p-4 font-medium text-muted-foreground sticky left-0 bg-background z-40 border-r border-black/10 dark:border-white/10 shrink-0">
                                Date
                            </div>
                            {courses.map(course => (
                                <div key={course.id} className="flex-1 min-w-[120px] p-4 text-center font-bold border-r border-black/5 dark:border-white/5 last:border-0" style={{ color: course.color }}>
                                    {course.code}
                                </div>
                            ))}
                        </div>

                        {/* Body Rows */}
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            {dateRange.map((date, i) => {
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = new Date().toDateString() === date.toDateString();

                                return (
                                    <div key={i} className={cn(
                                        "flex hover:bg-black/5 dark:hover:bg-white/5 transition-colors group",
                                        isWeekend ? "bg-black/[0.02] dark:bg-white/[0.02]" : "",
                                        isToday ? "bg-brand-blue/5" : ""
                                    )}>
                                        <div className={cn(
                                            "w-32 p-3 text-sm flex flex-col justify-center sticky left-0 z-20 border-r border-black/10 dark:border-white/10 bg-background/95 backdrop-blur-sm group-hover:bg-background/80 transition-colors shrink-0",
                                            isToday ? "text-brand-blue font-medium" : "text-muted-foreground"
                                        )}>
                                            <span className="font-medium text-foreground">
                                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-xs opacity-70">
                                                {date.toLocaleDateString(undefined, { weekday: 'short' })}
                                            </span>
                                        </div>

                                        {courses.map(course => {
                                            const cellEvents = getEventsForCell(course.id, date);
                                            return (
                                                <div
                                                    key={`${course.id}-${i}`}
                                                    className={cn(
                                                        "flex-1 min-w-[120px] p-1 flex border-r border-black/5 dark:border-white/5 last:border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                                        cellEvents.length > 0 ? "flex-col gap-1 justify-center" : "items-center justify-center"
                                                    )}
                                                    onClick={() => {
                                                        onAddEvent(date, course.id);
                                                    }}
                                                >
                                                    {cellEvents.length > 0 ? (
                                                        cellEvents.map(event => {
                                                            const { style, className } = getScoreStyles(event.score);
                                                            return (
                                                                <div
                                                                    key={event.id}
                                                                    className={cn(
                                                                        "w-full min-h-[40px] rounded-lg flex flex-col items-center justify-center text-xs transition-all p-1 gap-0.5 hover:scale-105 shadow-sm",
                                                                        className
                                                                    )}
                                                                    style={style}
                                                                    title={formatEventTitle(
                                                                        event.title,
                                                                        event,
                                                                        events,
                                                                        semesters.find(s => s.id === activeSemesterId)?.startDate ? new Date(semesters.find(s => s.id === activeSemesterId)!.startDate).getTime() : undefined,
                                                                        semesters.find(s => s.id === activeSemesterId)?.breaks,
                                                                        settings?.workdays
                                                                    )}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEditEvent(event);
                                                                    }}
                                                                >
                                                                    <span className="truncate max-w-full font-medium">
                                                                        {formatEventTitle(
                                                                            event.title,
                                                                            event,
                                                                            events,
                                                                            semesters.find(s => s.id === activeSemesterId)?.startDate ? new Date(semesters.find(s => s.id === activeSemesterId)!.startDate).getTime() : undefined,
                                                                            semesters.find(s => s.id === activeSemesterId)?.breaks,
                                                                            settings?.workdays
                                                                        )}
                                                                    </span>
                                                                    {event.score !== null && event.score !== undefined && (
                                                                        <span className="text-[10px] opacity-80">{event.score}%</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="w-1 h-1 rounded-full bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

// Helper to map gradient names to hex colors for text
function getCourseColor(colorName: string) {
    const colors: Record<string, string> = {
        blue: "#3b82f6",
        pink: "#ec4899",
        purple: "#a855f7",
        orange: "#f97316",
        green: "#10b981",
    };
    return colors[colorName] || colors.blue;
}
