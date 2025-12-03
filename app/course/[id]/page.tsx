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
import { supabase } from "@/lib/supabase";

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const { courses, events, user, setUser, fetchData, isLoading } = useStudyStore();

    // Modal States
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    const [isMounted, setIsMounted] = useState(false);

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
            <div className="min-h-screen flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const course = courses.find((c) => c.id === params.id);
    const courseEvents = events.filter((e) => e.courseId === params.id).sort((a, b) => a.date - b.date);

    if (!course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white gap-4">
                <p>Course not found or loading...</p>
                <Button onClick={() => router.push("/")}>Return Home</Button>
            </div>
        );
    }

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    const handleAddEvent = () => {
        setEditingEvent(undefined);
        setIsEventModalOpen(true);
    };

    const getScoreColor = (score: number | null | undefined) => {
        if (score === null || score === undefined) return "text-muted-foreground";
        if (score >= 80) return "text-green-500 font-bold";
        if (score >= 50) return "text-yellow-500 font-bold";
        return "text-red-500 font-bold";
    };

    return (
        <div className="min-h-screen p-8 md:p-12 max-w-5xl mx-auto relative">
            <GradientBlob />

            <div className="relative z-10 space-y-8">
                <header className="space-y-6">
                    <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 text-foreground",
                                )}>
                                    {course.code}
                                </span>
                                <span className="text-muted-foreground text-sm">{course.semester}</span>
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

                        <Button onClick={handleAddEvent}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </header>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground/90">Course Schedule</h2>
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
                        events={courseEvents}
                        onEditEvent={handleEditEvent}
                    />
                </section>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                courseId={course.id}
                initialData={editingEvent}
            />

            <CourseModal
                isOpen={isCourseModalOpen}
                onClose={() => setIsCourseModalOpen(false)}
                initialData={course}
            />
        </div>
    );
}
