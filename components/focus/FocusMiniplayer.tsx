"use client";

import { useEffect, useRef } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Maximize2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { formatEventTitle } from "@/lib/utils";
import { SpotifyPlayer } from "@/components/spotify/SpotifyPlayer";

export function FocusMiniplayer() {
    const {
        timer,
        toggleTimer,
        stopTimer,
        tickTimer,
        courses,
        events,
        semesters,
        settings,
        addFocusSession
    } = useStudyStore();

    const pathname = usePathname();
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Global Timer Logic
    useEffect(() => {
        // Don't tick if on focus page (it handles its own tick)
        if (pathname === "/focus") return;

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
    }, [timer.timerIsActive, timer.timerTimeLeft, tickTimer, stopTimer, addFocusSession, timer.timerCourseId, timer.timerEventId, timer.timerDuration, pathname]);

    // Don't show if not active/paused OR if on focus page
    if ((!timer.timerIsActive && !timer.timerIsPaused) || pathname === "/focus") {
        return null;
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const course = courses.find(c => c.id === timer.timerCourseId);
    const event = events.find(e => e.id === timer.timerEventId);
    const semester = semesters.find(s => s.id === course?.semesterId);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                drag
                dragMomentum={false}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                className="fixed bottom-6 right-6 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl p-4 w-80 cursor-grab overflow-hidden"
            >
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-brand-blue/20 w-full"
                >
                    <div
                        className="h-full bg-brand-blue transition-all duration-1000 ease-linear"
                        style={{
                            width: `${((timer.timerDuration * 60 - timer.timerTimeLeft) / (timer.timerDuration * 60)) * 100}%`
                        }}
                    />
                </div>

                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {course && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                                    {course.code}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground truncate">
                                {event ? "Event Focus" : "Course Focus"}
                            </span>
                        </div>
                        <div className="font-medium truncate text-sm">
                            {event ? formatEventTitle(
                                event.title,
                                event,
                                events,
                                semester?.startDate,
                                semester?.breaks,
                                settings?.workdays
                            ) : (course?.title || "Unknown Course")}
                        </div>
                    </div>

                    <div className="text-2xl font-mono font-bold text-foreground tabular-nums">
                        {formatTime(timer.timerTimeLeft)}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 relative z-10">
                    <button
                        onClick={() => router.push("/focus")}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Expand to Full Screen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTimer}
                            className={`p-3 rounded-full transition-all ${timer.timerIsActive
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                : "bg-brand-blue hover:bg-blue-600 text-white"
                                }`}
                        >
                            {timer.timerIsActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                            onClick={() => stopTimer()}
                            className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                            title="Stop & Save"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    </div>
                </div>

                {/* Spotify Player Section */}
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 relative z-10">
                    <SpotifyPlayer />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
