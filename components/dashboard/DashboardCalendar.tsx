import { useMemo } from "react";
import { Event, Course } from "@/store/useStudyStore";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface DashboardCalendarProps {
    events: Event[];
    courses: Course[];
    onEditEvent: (event: Event) => void;
    onAddEvent: (date: Date) => void;
}

export function DashboardCalendar({ events, courses, onEditEvent, onAddEvent }: DashboardCalendarProps) {
    // 1. Generate Calendar Grid (Weeks)
    const weeks = useMemo(() => {
        if (events.length === 0) {
            // If no events, show current week + next 3 weeks
            const now = new Date();
            const start = new Date(now);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);

            const weeksArray: Date[][] = [];
            let current = new Date(start);

            for (let i = 0; i < 4; i++) {
                const week: Date[] = [];
                for (let j = 0; j < 7; j++) {
                    week.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                }
                weeksArray.push(week);
            }
            return weeksArray;
        }

        const timestamps = events.map(e => e.date);
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));

        // Pad with current date to ensure we see today if events are old/future
        const now = new Date();
        if (now < minDate) minDate.setTime(now.getTime());
        if (now > maxDate) maxDate.setTime(now.getTime());

        // Adjust to start on Monday of the first week
        const startDate = new Date(minDate);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startDate.setDate(diff);

        // Adjust end date to end of the last week (Sunday)
        const endDate = new Date(maxDate);
        const endDay = endDate.getDay();
        const endDiff = endDate.getDate() + (endDay === 0 ? 0 : 7 - endDay);
        endDate.setDate(endDiff);

        // Generate weeks
        const weeksArray: Date[][] = [];
        let current = new Date(startDate);

        while (current <= endDate) {
            const week: Date[] = [];
            for (let i = 0; i < 7; i++) {
                week.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            weeksArray.push(week);
        }

        return weeksArray;
    }, [events]);

    const getEventsForDate = (date: Date) => {
        return events.filter(e =>
            new Date(e.date).toDateString() === date.toDateString()
        ).sort((a, b) => {
            // Sort by completion (incomplete first) then by type
            if (a.isCompleted === b.isCompleted) return 0;
            return a.isCompleted ? 1 : -1;
        });
    };

    const getScoreColor = (score: number | null | undefined) => {
        if (score === null || score === undefined) return "bg-brand-blue/20 text-brand-blue border-brand-blue/30";
        if (score >= 80) return "bg-green-500/20 text-green-500 border-green-500/30";
        if (score >= 50) return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
        return "bg-red-500/20 text-red-500 border-red-500/30";
    };

    const getCourseColor = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course?.color || "blue";
    };

    const getCourseCode = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course?.code || "";
    };

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
                                        "min-h-[120px] p-3 flex flex-col gap-2 transition-all cursor-pointer hover:bg-white/5",
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
                                            const courseColor = getCourseColor(event.courseId);
                                            const isCustomColor = courseColor.startsWith('#');

                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditEvent(event);
                                                    }}
                                                    className={cn(
                                                        "text-xs p-2 rounded border cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden",
                                                        getScoreColor(event.score)
                                                    )}
                                                >
                                                    {/* Course Indicator Bar */}
                                                    <div
                                                        className={cn(
                                                            "absolute left-0 top-0 bottom-0 w-1",
                                                            !isCustomColor && `bg-gradient-to-b from-${courseColor}-500 to-${courseColor}-400`
                                                        )}
                                                        style={isCustomColor ? { backgroundColor: courseColor } : {}}
                                                    />

                                                    <div className="pl-2 flex flex-col gap-0.5">
                                                        <span className="text-[10px] opacity-70 uppercase tracking-wider font-bold">
                                                            {getCourseCode(event.courseId)}
                                                        </span>
                                                        <span className="truncate font-medium leading-tight">{event.title}</span>
                                                    </div>

                                                    {event.score !== null && event.score !== undefined && (
                                                        <div className="mt-1 pl-2 text-[10px] font-bold">
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
