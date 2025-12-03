import { useMemo } from "react";
import { Event } from "@/store/useStudyStore";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle2, Circle } from "lucide-react";

interface CourseCalendarProps {
    events: Event[];
    onEditEvent: (event: Event) => void;
}

export function CourseCalendar({ events, onEditEvent }: CourseCalendarProps) {
    // 1. Generate Calendar Grid (Weeks)
    const weeks = useMemo(() => {
        if (events.length === 0) return [];

        const timestamps = events.map(e => e.date);
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));

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
                                        "min-h-[120px] p-3 flex flex-col gap-2 transition-all",
                                        isToday ? "ring-1 ring-brand-blue/50 bg-brand-blue/5" : "",
                                        isPast ? "opacity-70" : ""
                                    )}
                                    hoverEffect={false}
                                >
                                    <div className={cn(
                                        "text-xs font-medium mb-1",
                                        isToday ? "text-brand-blue" : "text-muted-foreground"
                                    )}>
                                        {date.getDate()} {date.getDate() === 1 && date.toLocaleDateString(undefined, { month: 'short' })}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                onClick={() => onEditEvent(event)}
                                                className={cn(
                                                    "text-xs p-2 rounded border cursor-pointer transition-all hover:scale-[1.02]",
                                                    getScoreColor(event.score)
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="truncate font-medium">{event.title}</span>
                                                </div>
                                                {event.score !== null && event.score !== undefined && (
                                                    <div className="mt-1 text-[10px] font-bold">
                                                        {event.score}%
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
