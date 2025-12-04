"use client";

import { useState, useEffect } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { EventsMatrix } from "@/components/dashboard/EventsMatrix";
import { EventModal } from "@/components/course/EventModal";
import { Event } from "@/store/useStudyStore";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MatrixPage() {
    const [filterType, setFilterType] = useState<string>("all");
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
    const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    const { user, setUser, fetchData, isLoading, courses, events, settings } = useStudyStore();

    const filteredEvents = events.filter(e => filterType === "all" || e.type === filterType);

    useEffect(() => {
        setIsMounted(true);

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

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setInitialDate(undefined);
        setSelectedCourseId(event.courseId);
        setIsEventModalOpen(true);
    };

    if (!isMounted) return null;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Please sign in to view your schedule.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 relative flex flex-col">
            <GradientBlob />

            <div className="relative z-10 flex-1 flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Semester Matrix</h1>
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                    </div>

                    <div className="flex items-center gap-3">
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
                </div>

                <div className="flex-1">
                    <EventsMatrix
                        events={filteredEvents}
                        onEditEvent={handleEditEvent}
                        onAddEvent={(date, courseId) => {
                            setEditingEvent(undefined);
                            setInitialDate(date);
                            setSelectedCourseId(courseId);
                            setIsEventModalOpen(true);
                        }}
                        fullPage={true}
                    />
                </div>
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                courseId={selectedCourseId}
                initialData={editingEvent}
                initialDate={initialDate}
            />
        </div>
    );
}
