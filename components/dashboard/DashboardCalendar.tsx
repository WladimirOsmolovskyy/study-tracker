import { useState, useMemo } from "react";
import { useStudyStore, Event, Course } from "@/store/useStudyStore";
import { cn, formatEventTitle, hexToRgb, getGradeColor } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardCalendarProps {
    events: Event[];
    courses: Course[];
    onEditEvent: (event: Event) => void;
    onAddEvent: (date: Date) => void;
}

export function DashboardCalendar({ events, courses, onEditEvent, onAddEvent }: DashboardCalendarProps) {
    const { semesters, activeSemesterId, settings } = useStudyStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate the 7 days of the current week
    const weekDays = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const goToToday = () => setCurrentDate(new Date());

    const goToSemesterStart = () => {
        const activeSemester = semesters.find(s => s.id === activeSemesterId);
        if (activeSemester) {
            setCurrentDate(new Date(activeSemester.startDate));
        }
    };

    const goToSemesterEnd = () => {
        const activeSemester = semesters.find(s => s.id === activeSemesterId);
        if (activeSemester) {
            setCurrentDate(new Date(activeSemester.endDate));
        }
    };

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
                className: "border"
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
            className: "border"
        };
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
        <div className="space-y-4">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">
                    {weekDays[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    {weekDays[0].getMonth() !== weekDays[6].getMonth() && ` - ${weekDays[6].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={goToSemesterStart}>
                        Start
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToSemesterEnd}>
                        End
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {/* Headers */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <div key={day} className={cn(
                        "text-center text-sm font-medium uppercase tracking-wider",
                        new Date().toDateString() === weekDays[i].toDateString() ? "text-brand-blue font-bold" : "text-muted-foreground"
                    )}>
                        {day}
                    </div>
                ))}

                {/* Days */}
                {weekDays.map((date, dayIndex) => {
                    const dayEvents = getEventsForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isPast = date < new Date() && !isToday;

                    return (
                        <GlassCard
                            key={dayIndex}
                            className={cn(
                                "min-h-[500px] p-3 flex flex-col gap-2 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5",
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
                                    const { style, className } = getScoreStyles(event.score);

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditEvent(event);
                                            }}
                                            className={cn(
                                                "text-xs p-2 rounded border cursor-pointer transition-all hover:scale-[1.02] relative overflow-hidden",
                                                className
                                            )}
                                            style={style}
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
                                                <span className="truncate font-medium leading-tight">
                                                    {formatEventTitle(
                                                        event.title,
                                                        event,
                                                        events,
                                                        semesters.find(s => s.id === activeSemesterId)?.startDate ? new Date(semesters.find(s => s.id === activeSemesterId)!.startDate).getTime() : undefined,
                                                        semesters.find(s => s.id === activeSemesterId)?.breaks,
                                                        settings?.workdays
                                                    )}
                                                </span>
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
        </div>
    );
}
