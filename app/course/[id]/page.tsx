"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudyStore, Event } from "@/store/useStudyStore";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Loader2, Settings, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventModal } from "@/components/course/EventModal";
import { CourseModal } from "@/components/dashboard/CourseModal";
import { CourseCalendar } from "@/components/course/CourseCalendar";
import { CourseStatistics } from "@/components/course/CourseStatistics";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const { user, setUser, fetchData, isLoading, courses, events, settings } = useStudyStore();

    // Modal States
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
    const [isMounted, setIsMounted] = useState(false);
    const [filterType, setFilterType] = useState<string>("all");

    useEffect(() => {
        setIsMounted(true);

        // Check active session and fetch data if needed
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user && courses.length === 0) fetchData();
        });
    }, [setUser, fetchData, courses.length]);

    if (!isMounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const course = courses.find((c) => c.id === params.id);
    const courseEvents = events.filter((e) => e.courseId === params.id).sort((a, b) => a.date - b.date);
    const filteredCourseEvents = courseEvents.filter(e => filterType === "all" || e.type === filterType);

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-foreground gap-4">
                <p>Course not found or loading...</p>
                <Button onClick={() => router.push("/")}>Return Home</Button>
            </div>
        );
    }

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setInitialDate(undefined);
        setIsEventModalOpen(true);
    };

    const handleAddEvent = (date?: Date) => {
        setEditingEvent(undefined);
        setInitialDate(date);
        setIsEventModalOpen(true);
    };

    // ... (getScoreColor remains same) ...

    const getHexForColor = (colorName: string) => {
        if (colorName.startsWith('#')) return colorName;
        const colors: Record<string, string> = {
            blue: "#3b82f6",
            pink: "#ec4899",
            purple: "#a855f7",
            orange: "#f97316",
            green: "#10b981",
        };
        return colors[colorName] || colors.blue;
    };

    const colorHex = getHexForColor(course.color);

    return (
        <div className="min-h-screen p-8 md:p-12 max-w-[1600px] mx-auto relative">
            <GradientBlob />

            <div className="relative z-10 space-y-8">
                <header className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-2 transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border"
                                    style={{
                                        backgroundColor: `${colorHex}15`, // ~10% opacity
                                        borderColor: `${colorHex}30`, // ~20% opacity
                                        color: colorHex
                                    }}
                                >
                                    {course.code}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    {useStudyStore.getState().semesters.find(s => s.id === course.semesterId)?.name || "Unknown Semester"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-bold text-foreground">{course.title}</h1>
                                <button
                                    onClick={() => setIsCourseModalOpen(true)}
                                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <Button onClick={() => handleAddEvent()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </header>

                <section className="space-y-4">
                    <CourseStatistics courseId={course.id} />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-foreground/90">Course Schedule</h2>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-1.5 rounded-md text-sm font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none text-foreground capitalize"
                            >
                                <option value="all">All Types</option>
                                {(settings?.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other']).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-brand-blue/50" />
                                <span>Upcoming</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                                <span>High Score</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                <span>Medium</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <span>Low/Overdue</span>
                            </div>
                        </div>
                    </div>

                    <CourseCalendar
                        events={filteredCourseEvents}
                        semesterId={course.semesterId}
                        onEditEvent={handleEditEvent}
                        onAddEvent={handleAddEvent}
                    />
                </section>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                courseId={course.id}
                semesterId={course.semesterId}
                initialData={editingEvent}
                initialDate={initialDate}
            />

            <CourseModal
                isOpen={isCourseModalOpen}
                onClose={() => setIsCourseModalOpen(false)}
                initialData={course}
            />
        </div>
    );
}
