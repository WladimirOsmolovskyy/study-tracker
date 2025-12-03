"use client";

import { useStudyStore } from "@/store/useStudyStore";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { useMemo } from "react";

export function EventsMatrix() {
    const { courses, events } = useStudyStore();

    // 1. Determine Date Range (Start of earliest event to End of latest event, or current month)
    const dateRange = useMemo(() => {
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
    }, [events]);

    // 2. Group Events by Date and Course
    const getEventForCell = (courseId: string, date: Date) => {
        return events.find(e =>
            e.courseId === courseId &&
            new Date(e.date).toDateString() === date.toDateString()
        );
    };

    const getScoreColor = (score: number | null | undefined) => {
        if (score === null || score === undefined) return "bg-gray-500/20"; // No score yet
        if (score >= 80) return "bg-green-500 text-black font-bold";
        if (score >= 50) return "bg-yellow-500 text-black font-bold";
        return "bg-red-500 text-white font-bold";
    };

    if (courses.length === 0) return null;

    return (
        <GlassCard className="overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <h3 className="text-lg font-semibold text-foreground">Semester Overview</h3>
            </div>

            <div className="overflow-auto flex-1 relative">
                <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm">
                        <tr>
                            <th className="p-3 text-left font-medium text-muted-foreground border-b border-black/10 dark:border-white/10 min-w-[120px] sticky left-0 bg-background z-30">
                                Date
                            </th>
                            <th className="p-3 text-left font-medium text-muted-foreground border-b border-black/10 dark:border-white/10 min-w-[100px] sticky left-[120px] bg-background z-30 border-r border-black/10 dark:border-white/10">
                                Day
                            </th>
                            {courses.map(course => (
                                <th key={course.id} className="p-3 text-center font-bold border-b border-black/10 dark:border-white/10 min-w-[100px]" style={{ color: getCourseColor(course.color) }}>
                                    {course.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dateRange.map((date, i) => {
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                            return (
                                <tr key={i} className={cn(
                                    "border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                    isWeekend ? "bg-black/5 dark:bg-white/5" : ""
                                )}>
                                    <td className="p-3 text-foreground/80 sticky left-0 bg-background/95 backdrop-blur-sm z-10">
                                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="p-3 text-muted-foreground sticky left-[120px] bg-background/95 backdrop-blur-sm z-10 border-r border-black/10 dark:border-white/10">
                                        {date.toLocaleDateString(undefined, { weekday: 'long' })}
                                    </td>
                                    {courses.map(course => {
                                        const event = getEventForCell(course.id, date);
                                        return (
                                            <td key={`${course.id}-${i}`} className="p-1 text-center border-r border-black/5 dark:border-white/5 last:border-0">
                                                {event && (
                                                    <div className={cn(
                                                        "mx-auto w-12 h-8 rounded flex items-center justify-center text-xs transition-all cursor-default",
                                                        getScoreColor(event.score)
                                                    )} title={event.title}>
                                                        {event.score ?? "-"}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
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
