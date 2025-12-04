"use client";

import { useState, useEffect, useRef } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { Modal } from "@/components/ui/Modal";
import { CourseCalendar } from "@/components/course/CourseCalendar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Play, Pause, RotateCcw, CheckCircle2, Timer as TimerIcon, Calendar } from "lucide-react";
import { cn, formatEventTitle } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { SpotifyPlayer } from "@/components/spotify/SpotifyPlayer";

export default function FocusPage() {
    const {
        courses,
        events,
        semesters,
        settings,
        user,
        setUser,
        fetchData,
        addFocusSession,
        timer,
        setTimerDuration,
        setTimerContext,
        toggleTimer,
        resetTimer,
        tickTimer,
        stopTimer
    } = useStudyStore();

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchData();
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchData();
        });

        return () => subscription.unsubscribe();
    }, [setUser, fetchData]);

    // Settings State
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Filter events based on selected course
    const courseEvents = events.filter(e => e.courseId === timer.timerCourseId && !e.isCompleted);

    // Timer Logic (Local tick when on this page)
    useEffect(() => {
        if (timer.timerIsActive && timer.timerTimeLeft > 0) {
            timerRef.current = setInterval(() => {
                tickTimer();
            }, 1000);
        } else if (timer.timerTimeLeft === 0 && timer.timerIsActive) {
            // Timer finished
            if (timerRef.current) clearInterval(timerRef.current);

            // Stop timer (saves session automatically)
            stopTimer();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timer.timerIsActive, timer.timerTimeLeft, tickTimer, stopTimer, addFocusSession, timer.timerCourseId, timer.timerEventId, timer.timerDuration]);

    // Filter events based on selected course


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((timer.timerDuration * 60 - timer.timerTimeLeft) / (timer.timerDuration * 60)) * 100;

    const selectedCourse = courses.find(c => c.id === timer.timerCourseId);
    const selectedEvent = events.find(e => e.id === timer.timerEventId);

    return (
        <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto relative flex flex-col items-center justify-center">
            <GradientBlob />

            <div className="relative z-10 w-full space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
                        <TimerIcon className="w-10 h-10 text-brand-blue" />
                        Focus Mode
                    </h1>
                    <p className="text-muted-foreground">Eliminate distractions and focus on your tasks.</p>
                </header>

                <GlassCard className="p-8 md:p-12 flex flex-col items-center gap-8">
                    {/* Focus Target Display */}
                    {(timer.timerIsActive || timer.timerIsPaused) && (selectedCourse || selectedEvent) && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-2">Focusing On</p>
                            <div className="flex flex-col items-center gap-2">
                                {selectedCourse && (
                                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                        {selectedCourse.code}
                                    </span>
                                )}
                                {selectedEvent && (
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {formatEventTitle(
                                            selectedEvent.title,
                                            selectedEvent,
                                            events,
                                            semesters.find(s => s.id === selectedCourse?.semesterId)?.startDate ? new Date(semesters.find(s => s.id === selectedCourse?.semesterId)!.startDate).getTime() : undefined,
                                            semesters.find(s => s.id === selectedCourse?.semesterId)?.breaks,
                                            settings?.workdays
                                        )}
                                    </h2>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timer Display */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        {/* Circular Progress Background */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-black/5 dark:text-white/5"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray="283"
                                strokeDashoffset={283 - (283 * progress) / 100} // Inverse logic for countdown? No, usually fills up or empties. Let's empty it.
                                // Actually, let's make it fill up as time passes, or empty as time passes.
                                // Let's empty it: start full, end empty.
                                // strokeDashoffset = 283 * (1 - timeLeft / totalTime) -> This fills it.
                                // strokeDashoffset = 283 * (1 - (totalTime - timeLeft) / totalTime) = 283 * (timeLeft / totalTime) -> This empties it.
                                className="text-brand-blue transition-all duration-1000 ease-linear"
                                style={{
                                    strokeDashoffset: 283 * ((timer.timerDuration * 60 - timer.timerTimeLeft) / (timer.timerDuration * 60)) // Fills up
                                }}
                            />
                        </svg>

                        <div className="text-7xl font-mono font-bold text-foreground tracking-tighter">
                            {formatTime(timer.timerTimeLeft)}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className={cn(
                                "w-16 h-16 rounded-full p-0 flex items-center justify-center transition-all hover:scale-110",
                                timer.timerIsActive ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-brand-blue hover:bg-blue-600 text-white"
                            )}
                            onClick={toggleTimer}
                        >
                            {timer.timerIsActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </Button>

                        {(timer.timerIsActive || timer.timerIsPaused) && (
                            <Button
                                size="lg"
                                variant="secondary"
                                className="w-16 h-16 rounded-full p-0 flex items-center justify-center transition-all hover:scale-110"
                                onClick={() => stopTimer()}
                            >
                                <RotateCcw className="w-6 h-6" />
                            </Button>
                        )}
                    </div>

                    {/* Spotify Player */}
                    <div className="w-full max-w-md mt-4">
                        <SpotifyPlayer />
                    </div>

                    {/* Settings (Hidden while active to reduce distraction) */}
                    <div className={cn(
                        "w-full grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 overflow-hidden",
                        timer.timerIsActive ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
                    )}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Duration (minutes)</label>
                            <input
                                type="number"
                                min="1"
                                max="180"
                                value={timer.timerDuration}
                                onChange={(e) => setTimerDuration(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Course</label>
                            <select
                                value={timer.timerCourseId || ""}
                                onChange={(e) => {
                                    setTimerContext(e.target.value, null);
                                }}
                                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground"
                            >
                                <option value="">Select Course...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Event (Optional)</label>
                            <div className="flex gap-2">
                                <div className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-foreground truncate flex items-center min-h-[42px]">
                                    {selectedEvent ? formatEventTitle(
                                        selectedEvent.title,
                                        selectedEvent,
                                        events,
                                        semesters.find(s => s.id === selectedCourse?.semesterId)?.startDate ? new Date(semesters.find(s => s.id === selectedCourse?.semesterId)!.startDate).getTime() : undefined,
                                        semesters.find(s => s.id === selectedCourse?.semesterId)?.breaks,
                                        settings?.workdays
                                    ) : <span className="text-muted-foreground/50">Select Event...</span>}
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsCalendarOpen(true)}
                                    disabled={!timer.timerCourseId}
                                    className="px-3"
                                    title="Select from Calendar"
                                >
                                    <Calendar className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Modal
                        isOpen={isCalendarOpen}
                        onClose={() => setIsCalendarOpen(false)}
                        title={`Select Event from ${selectedCourse?.code || 'Course'}`}
                        maxWidth="max-w-[95vw]"
                    >
                        <CourseCalendar
                            events={courseEvents}
                            semesterId={selectedCourse?.semesterId}
                            onEditEvent={(event) => {
                                setTimerContext(timer.timerCourseId!, event.id);
                                setIsCalendarOpen(false);
                            }}
                            onAddEvent={() => { }}
                        />
                    </Modal>
                </GlassCard>
            </div>
        </div>
    );
}
