"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudyStore } from "@/store/useStudyStore";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddEventModal } from "@/components/course/AddEventModal";
import { supabase } from "@/lib/supabase";

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const { courses, events, toggleEventCompletion, deleteEvent, user, setUser, fetchData, isLoading } = useStudyStore();
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
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
                            <h1 className="text-4xl font-bold text-foreground">{course.title}</h1>
                        </div>

                        <Button onClick={() => setIsAddEventModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </header>

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground/90">Upcoming Events</h2>

                    {courseEvents.length === 0 ? (
                        <GlassCard className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                            <Calendar className="w-8 h-8 text-muted-foreground/30" />
                            <p className="text-muted-foreground">No events scheduled yet.</p>
                        </GlassCard>
                    ) : (
                        <div className="grid gap-4">
                            {courseEvents.map((event) => (
                                <GlassCard key={event.id} className="flex items-center gap-4 p-4">
                                    <button
                                        onClick={() => toggleEventCompletion(event.id)}
                                        className={cn(
                                            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            event.isCompleted
                                                ? "bg-green-500 border-green-500 text-white"
                                                : "border-black/30 dark:border-white/30 hover:border-black/50 dark:hover:border-white/50"
                                        )}
                                    >
                                        {event.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                    </button>

                                    <div className="flex-grow min-w-0">
                                        <h3 className={cn(
                                            "font-medium truncate transition-all",
                                            event.isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                                        )}>
                                            {event.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="capitalize">{event.type}</span>
                                            <span>•</span>
                                            <span>{new Date(event.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Trackers placeholder */}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <AddEventModal
                isOpen={isAddEventModalOpen}
                onClose={() => setIsAddEventModalOpen(false)}
                courseId={course.id}
            />
        </div>
    );
}
