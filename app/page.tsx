"use client";

import { useState, useEffect } from "react";
import { GradientBlob } from "@/components/ui/GradientBlob";
import { Button } from "@/components/ui/Button";
import { CourseGrid } from "@/components/dashboard/CourseGrid";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CourseModal } from "@/components/dashboard/CourseModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Plus, LogOut, Loader2 } from "lucide-react";
import { useStudyStore } from "@/store/useStudyStore";
import { supabase } from "@/lib/supabase";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { EventModal } from "@/components/course/EventModal";
import { Event } from "@/store/useStudyStore";

import { EventsMatrix } from "@/components/dashboard/EventsMatrix";
import { cn } from "@/lib/utils";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { Settings } from "lucide-react";

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "matrix">("calendar");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  // Event Modal State
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

  const handleAddEvent = (date?: Date) => {
    setEditingEvent(undefined);
    setInitialDate(date);
    // If we have courses, default to the first one, otherwise empty string will trigger selection
    setSelectedCourseId(courses.length > 0 ? courses[0].id : "");
    setIsEventModalOpen(true);
  };

  if (!isMounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <GradientBlob />
        <div className="relative z-10 text-center space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 dark:from-white dark:to-white/60">
            Study Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Your academic journey, beautifully organized. Sign in to sync your courses across devices.
          </p>
          <Button size="lg" onClick={() => setIsAuthModalOpen(true)} className="shadow-brand-pink/20 shadow-xl">
            Get Started
          </Button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 md:p-12 max-w-[1600px] mx-auto relative">
      <GradientBlob />

      <div className="relative z-10 space-y-48">

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground/90">Your Courses</h2>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>
          <CourseGrid onAddClick={() => setIsAddModalOpen(true)} />
        </section>

        <section className="min-h-screen flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground/90">Overview</h2>
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
              <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "calendar"
                      ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode("matrix")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "matrix"
                      ? "bg-white dark:bg-white/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Matrix
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsSettingsModalOpen(true)} className="ml-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <DashboardCalendar
              events={filteredEvents}
              courses={courses}
              onEditEvent={handleEditEvent}
              onAddEvent={handleAddEvent}
            />
          ) : (
            <EventsMatrix
              events={filteredEvents}
              onEditEvent={handleEditEvent}
              onAddEvent={(date, courseId) => {
                setEditingEvent(undefined);
                setInitialDate(date);
                setSelectedCourseId(courseId);
                setIsEventModalOpen(true);
              }}
            />
          )}
        </section>
      </div >

      <CourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        courseId={selectedCourseId}
        initialData={editingEvent}
        initialDate={initialDate}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div >
  );
}
