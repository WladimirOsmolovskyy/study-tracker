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

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [isMounted, setIsMounted] = useState(false);

  const { user, setUser, fetchData, isLoading, courses, events } = useStudyStore();

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
    if (courses.length === 0) {
      alert("Please create a course first!");
      return;
    }
    setEditingEvent(undefined);
    setInitialDate(date);
    // Default to first course if adding from dashboard
    setSelectedCourseId(courses[0].id);
    setIsEventModalOpen(true);
  };

  if (!isMounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <GradientBlob />
        <div className="relative z-10 text-center space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Study Tracker
          </h1>
          <p className="text-lg text-white/60">
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
    <div className="min-h-screen p-8 md:p-12 max-w-7xl mx-auto relative">
      <GradientBlob />

      <div className="relative z-10 space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 dark:from-white dark:to-white/60">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Manage your courses, track deadlines, and visualize your academic progress.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => supabase.auth.signOut()}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="shadow-brand-blue/20 shadow-xl"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Course
            </Button>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground/90">Your Courses</h2>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>
          <CourseGrid onAddClick={() => setIsAddModalOpen(true)} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground/90">Overview</h2>
          </div>
          <DashboardCalendar
            events={events}
            courses={courses}
            onEditEvent={handleEditEvent}
            onAddEvent={handleAddEvent}
          />
        </section>
      </div>

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
    </div>
  );
}
