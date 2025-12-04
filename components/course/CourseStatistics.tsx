"use client";

import { useMemo, useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatEventTitle } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Calendar, BarChart3, History, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CourseStatisticsProps {
    courseId: string;
}

type Timeframe = "week" | "month" | "semester" | "all";

export function CourseStatistics({ courseId }: CourseStatisticsProps) {
    const { focusSessions, events, courses, semesters, settings, deleteFocusSession } = useStudyStore();
    const [timeframe, setTimeframe] = useState<Timeframe>("week");
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const course = courses.find(c => c.id === courseId);
    const semester = semesters.find(s => s.id === course?.semesterId);

    // Filter sessions by course and timeframe
    const filteredSessions = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const startOfSemester = semester ? new Date(semester.startDate) : new Date(0);

        return focusSessions.filter(s => {
            if (s.courseId !== courseId) return false;
            const sessionDate = new Date(s.createdAt);

            switch (timeframe) {
                case "week":
                    return sessionDate >= startOfWeek;
                case "month":
                    return sessionDate >= startOfMonth;
                case "semester":
                    return sessionDate >= startOfSemester;
                case "all":
                default:
                    return true;
            }
        });
    }, [focusSessions, courseId, timeframe, semester]);

    // Calculate totals
    const totalDuration = filteredSessions.reduce((acc, s) => acc + s.duration, 0);

    // Group by Event Type
    const byType = useMemo(() => {
        const types: Record<string, number> = {};
        filteredSessions.forEach(s => {
            const event = events.find(e => e.id === s.eventId);
            const type = event?.type || "Unspecified";
            types[type] = (types[type] || 0) + s.duration;
        });
        return Object.entries(types).sort((a, b) => b[1] - a[1]);
    }, [filteredSessions, events]);

    // Group by Event (Top 3)
    const topEvents = useMemo(() => {
        const eventDurations: Record<string, number> = {};
        filteredSessions.forEach(s => {
            if (s.eventId) {
                eventDurations[s.eventId] = (eventDurations[s.eventId] || 0) + s.duration;
            }
        });

        return Object.entries(eventDurations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([eventId, duration]) => {
                const event = events.find(e => e.id === eventId);
                return {
                    event,
                    duration
                };
            });
    }, [filteredSessions, events]);

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!course) return null;

    return (
        <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground/80 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Focus Statistics
                </h3>

                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setIsHistoryOpen(true)} className="h-8 gap-2">
                        <History className="w-4 h-4" />
                        History
                    </Button>
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                        {(["week", "month", "semester", "all"] as Timeframe[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${timeframe === t
                                    ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Time Card */}
                <GlassCard className="p-6 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-full bg-brand-blue/10 text-brand-blue mb-2">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{formatDuration(totalDuration)}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Focus Time</div>
                </GlassCard>

                {/* By Type Chart */}
                <GlassCard className="p-6 flex flex-col gap-4 col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time by Event Type</h4>
                    <div className="space-y-3">
                        {byType.length > 0 ? byType.map(([type, duration]) => {
                            const percentage = Math.round((duration / totalDuration) * 100);
                            return (
                                <div key={type} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="capitalize font-medium">{type}</span>
                                        <span className="text-muted-foreground">{formatDuration(duration)} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="h-full bg-brand-blue rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">No data for this period</div>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Top Events */}
            {topEvents.length > 0 && (
                <GlassCard className="p-6">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Top Events</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {topEvents.map(({ event, duration }, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <div className="font-bold text-brand-blue text-lg">#{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                        {event ? formatEventTitle(
                                            event.title,
                                            event,
                                            events,
                                            semester?.startDate,
                                            semester?.breaks,
                                            settings?.workdays
                                        ) : "Unknown Event"}
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">{event?.type || "Unspecified"}</div>
                                </div>
                                <div className="text-sm font-bold whitespace-nowrap">{formatDuration(duration)}</div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="Focus History"
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.sort((a, b) => b.createdAt - a.createdAt).map(session => {
                            const event = events.find(e => e.id === session.eventId);
                            return (
                                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="font-medium truncate">
                                            {event ? formatEventTitle(
                                                event.title,
                                                event,
                                                events,
                                                semester?.startDate,
                                                semester?.breaks,
                                                settings?.workdays
                                            ) : (course?.title || "Course Focus")}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="capitalize">{event?.type || "General"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold">{formatDuration(session.duration)}</span>
                                        <button
                                            onClick={() => deleteFocusSession(session.id)}
                                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No sessions found for this period.</div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
