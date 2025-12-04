import { useMemo } from "react";
import { useStudyStore, Event } from "@/store/useStudyStore";
import { cn, formatEventTitle, hexToRgb, getGradeColor } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle2, Circle } from "lucide-react";

interface CourseCalendarProps {
    events: Event[];
    semesterId?: string | null;
    onEditEvent: (event: Event) => void;
    onAddEvent: (date: Date) => void;
}

export function CourseCalendar({ events, semesterId, onEditEvent, onAddEvent }: CourseCalendarProps) {
    const { semesters, settings } = useStudyStore();

    // 1. Generate Calendar Grid (Weeks)
    const weeks = useMemo(() => {
        const semester = semesters.find(s => s.id === semesterId);

        let startDate: Date;
        let endDate: Date;

        if (semester) {
            startDate = new Date(semester.startDate);
            endDate = new Date(semester.endDate);
        } else {
            if (events.length === 0) return [];

            const timestamps = events.map(e => e.date);
            const minDate = new Date(Math.min(...timestamps));
            const maxDate = new Date(Math.max(...timestamps));

            startDate = minDate;
            endDate = maxDate;
        }

        // Adjust to start on Monday of the first week
        const start = new Date(startDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);

        // Adjust end date to end of the last week (Sunday)
        const end = new Date(endDate);
        const endDay = end.getDay();
        const endDiff = end.getDate() + (endDay === 0 ? 0 : 7 - endDay);
        end.setDate(endDiff);

        // Generate weeks
        const weeksArray: Date[][] = [];
        let current = new Date(start);

        while (current <= end) {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            weeksArray.push(week);
        }

        return weeksArray;
    }, [events, semesterId, semesters]);

    const getEventsForDate = (date: Date) => {
        return events.filter(e =>
            new Date(e.date).toDateString() === date.toDateString()
        ).sort((a, b) => {
            // Sort by completion (incomplete first) then by type
            if (a.isCompleted === b.isCompleted) return 0;
            return a.isCompleted ? 1 : -1;
        });
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

    if (events.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No events scheduled. Add one to see the calendar!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-7 gap-4 mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-4">
                        {week.map((date, dayIndex) => {
                            const dayEvents = getEventsForDate(date);
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isPast = date < new Date() && !isToday;

                            return (
                                <GlassCard
                                    key={dayIndex}
                                    className={cn(
                                        "min-h-[120px] p-3 flex flex-col gap-2 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
                                        isToday ? "ring-1 ring-brand-blue/50 bg-brand-blue/5" : "",
                                        isPast ? "opacity-70" : ""
                                    )}
                                    hoverEffect={false}
                                    onClick={() => onAddEvent(date)}
                                >
                                    <div className={cn(
                                        "text-xs font-medium mb-1",
                                        isToday ? "text-brand-blue" : "text-muted-foreground"
                                    )}>
                                        {date.getDate()} {date.getDate() === 1 && date.toLocaleDateString(undefined, { month: 'short' })}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {dayEvents.map(event => {
                                            const { style, className } = getScoreStyles(event.score);
                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditEvent(event);
                                                    }}
                                                    className={cn(
                                                        "text-xs p-2 rounded border cursor-pointer transition-all hover:scale-[1.02]",
                                                        className
                                                    )}
                                                    style={style}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="truncate font-medium">
                                                            {formatEventTitle(
                                                                event.title,
                                                                event,
                                                                events,
                                                                semesters.find(s => s.id === semesterId)?.startDate ? new Date(semesters.find(s => s.id === semesterId)!.startDate).getTime() : undefined,
                                                                semesters.find(s => s.id === semesterId)?.breaks,
                                                                settings?.workdays
                                                            )}
                                                        </span>
                                                    </div>
                                                    {event.score !== null && event.score !== undefined && (
                                                        <div className="mt-1 text-[10px] font-bold">
                                                            {event.score}%
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
