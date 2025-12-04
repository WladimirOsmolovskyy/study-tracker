import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { calculateAcademicWeek, GradeColor } from "@/lib/utils";

export interface Event {
    id: string;
    courseId: string;
    title: string;
    type: string;
    date: number; // Timestamp
    isCompleted: boolean;
    score?: number | null;
    userId: string;
    recurrenceId?: string | null;
}

export interface FocusSession {
    id: string;
    userId: string;
    courseId: string;
    eventId?: string | null;
    duration: number;
    createdAt: number;
}

// ...



export interface Tracker {
    id: string;
    eventId: string;
    title: string;
    value: number;
    maxValue: number;
    userId: string;
}

export type Course = {
    id: string;
    title: string;
    code: string;
    color: string;
    semesterId: string | null;
    createdAt: number;
    userId: string;
    orderIndex: number;
};

export interface SemesterBreak {
    id: string;
    startDate: number;
    endDate: number;
}

export interface Semester {
    id: string;
    name: string;
    startDate: number;
    endDate: number;
    breaks: SemesterBreak[];
    userId: string;
}

export interface Settings {
    userId: string;
    workdays: number[];
    gradeColors: GradeColor[];
    undefinedColor: string;
    eventTypes: string[];
}

export interface TimerState {
    timerDuration: number; // minutes
    timerTimeLeft: number; // seconds
    timerIsActive: boolean;
    timerIsPaused: boolean;
    timerCourseId: string | null;
    timerEventId: string | null;
}

// ...

interface StudyStore {
    user: User | null;
    courses: Course[];
    events: Event[];
    focusSessions: FocusSession[];
    trackers: Tracker[];
    semesters: Semester[];
    activeSemesterId: string | null;
    settings: Settings | null;
    isLoading: boolean;

    // Timer State
    timer: TimerState;

    setUser: (user: User | null) => void;
    fetchData: () => Promise<void>;

    addCourse: (course: Omit<Course, "id" | "userId" | "createdAt" | "orderIndex">) => Promise<void>;
    updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;
    reorderCourses: (courses: Course[]) => Promise<void>;

    addEvent: (event: Omit<Event, "id" | "userId" | "isCompleted">) => Promise<void>;
    addRecurringEvents: (baseEvent: Omit<Event, "id" | "userId" | "isCompleted">, dates: number[]) => Promise<boolean>;
    addMultipleEvents: (events: Omit<Event, "id" | "userId" | "isCompleted" | "recurrenceId">[], recurrenceId?: string) => Promise<boolean>;
    updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
    updateRecurringEvent: (id: string, updates: Partial<Event>, mode: 'single' | 'all') => Promise<boolean>;
    updateEventScore: (id: string, score: number | null) => Promise<void>;
    toggleEventCompletion: (id: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    deleteCourseEvents: (courseId: string) => Promise<void>;

    addSemester: (semester: Omit<Semester, "id" | "userId">) => Promise<void>;
    updateSemester: (id: string, updates: Partial<Semester>) => Promise<void>;
    deleteSemester: (id: string) => Promise<void>;
    setActiveSemester: (id: string | null) => void;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
    addFocusSession: (session: Omit<FocusSession, "id" | "userId" | "createdAt">) => Promise<void>;
    deleteFocusSession: (id: string) => Promise<void>;

    // Timer Actions
    setTimerDuration: (minutes: number) => void;
    setTimerContext: (courseId: string, eventId: string | null) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    stopTimer: () => Promise<void>;
}

export const useStudyStore = create<StudyStore>((set, get) => ({
    user: null,
    courses: [],
    events: [],
    focusSessions: [],
    trackers: [],
    semesters: [],
    activeSemesterId: typeof window !== 'undefined' ? localStorage.getItem("activeSemesterId") : null,
    settings: null,
    isLoading: false,

    timer: {
        timerDuration: 25,
        timerTimeLeft: 25 * 60,
        timerIsActive: false,
        timerIsPaused: false,
        timerCourseId: null,
        timerEventId: null,
    },

    setUser: (user) => set({ user }),

    fetchData: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        // ... existing fetches ...
        const { data: courses } = await supabase.from("courses").select("*").eq("user_id", user.id);
        const { data: events } = await supabase.from("events").select("*").eq("user_id", user.id);
        const { data: trackers } = await supabase.from("trackers").select("*").eq("user_id", user.id);
        const { data: semesters } = await supabase.from("semesters").select("*").eq("user_id", user.id).order("start_date", { ascending: true });
        const { data: settings } = await supabase.from("settings").select("*").eq("user_id", user.id).single();
        const { data: focusSessions } = await supabase.from("focus_sessions").select("*").eq("user_id", user.id);

        // ... existing formatting ...
        const formattedCourses = courses?.map(c => ({
            ...c,
            userId: c.user_id,
            semesterId: c.semester_id,
            createdAt: new Date(c.created_at).getTime(),
            orderIndex: c.order_index ?? 0
        })).sort((a, b) => a.orderIndex - b.orderIndex) || [];

        const formattedEvents = events?.map(e => ({
            ...e,
            courseId: e.course_id,
            isCompleted: e.is_completed,
            userId: e.user_id,
            recurrenceId: e.recurrence_id
        })) || [];

        const formattedTrackers = trackers?.map(t => ({
            ...t,
            eventId: t.event_id,
            maxValue: t.max_value,
            userId: t.user_id
        })) || [];

        const formattedSemesters = semesters?.map(s => ({
            ...s,
            userId: s.user_id,
            startDate: new Date(s.start_date).getTime(),
            endDate: new Date(s.end_date).getTime(),
            breaks: (s.breaks || []).map((b: any) => ({
                id: b.id,
                startDate: new Date(b.startDate).getTime(),
                endDate: new Date(b.endDate).getTime()
            }))
        })) || [];

        const formattedSettings = settings ? {
            userId: settings.user_id,
            workdays: settings.workdays || [1, 2, 3, 4, 5],
            gradeColors: settings.grade_colors || [
                { min: 80, color: "#22c55e" },
                { min: 50, color: "#eab308" },
                { min: 0, color: "#ef4444" }
            ],
            undefinedColor: settings.undefined_color || "#71717a",
            eventTypes: settings.event_types || ['lecture', 'homework', 'exam', 'lab', 'other'] // Added
        } : {
            userId: user.id,
            workdays: [1, 2, 3, 4, 5],
            gradeColors: [
                { min: 80, color: "#22c55e" },
                { min: 50, color: "#eab308" },
                { min: 0, color: "#ef4444" }
            ],
            undefinedColor: "#71717a",
            eventTypes: ['lecture', 'homework', 'exam', 'lab', 'other'] // Added
        };

        const formattedFocusSessions = focusSessions?.map(s => ({
            id: s.id,
            userId: s.user_id,
            courseId: s.course_id,
            eventId: s.event_id,
            duration: s.duration,
            createdAt: new Date(s.created_at).getTime()
        })) || [];

        set((state) => ({
            user: user,
            courses: formattedCourses,
            events: formattedEvents,
            focusSessions: formattedFocusSessions,
            trackers: formattedTrackers,
            semesters: formattedSemesters,
            activeSemesterId: state.activeSemesterId, // Keep existing activeSemesterId from localStorage
            settings: formattedSettings,
            isLoading: false,
        }));
    },

    // ... existing actions ...


    addCourse: async (courseData) => {
        const { user, courses } = get();
        if (!user) return;

        const maxOrderIndex = courses.length > 0 ? Math.max(...courses.map(c => c.orderIndex)) : -1;

        const newCourse = {
            user_id: user.id,
            title: courseData.title,
            code: courseData.code,
            color: courseData.color,
            semester_id: courseData.semesterId,
            order_index: maxOrderIndex + 1
        };

        const { data, error } = await supabase
            .from("courses")
            .insert(newCourse)
            .select()
            .single();

        if (error) {
            console.error("Error adding course:", error);
            return;
        }

        set((state) => ({
            courses: [...state.courses, {
                ...data,
                userId: data.user_id,
                semesterId: data.semester_id,
                createdAt: new Date(data.created_at).getTime(),
                orderIndex: data.order_index
            }],
        }));
    },

    updateCourse: async (id, updates) => {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.code !== undefined) payload.code = updates.code;
        if (updates.color !== undefined) payload.color = updates.color;
        if (updates.semesterId !== undefined) payload.semester_id = updates.semesterId;

        const { error } = await supabase
            .from("courses")
            .update(payload)
            .eq("id", id);

        if (error) {
            console.error("Error updating course:", error);
            return;
        }

        set((state) => ({
            courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
    },

    deleteCourse: async (id) => {
        const { error } = await supabase.from("courses").delete().eq("id", id);
        if (error) {
            console.error("Error deleting course:", error);
            return;
        }
        set((state) => ({
            courses: state.courses.filter((c) => c.id !== id),
            events: state.events.filter((e) => e.courseId !== id),
        }));
    },

    addEvent: async (eventData) => {
        const { user } = get();
        if (!user) return;

        const newEvent = {
            course_id: eventData.courseId,
            title: eventData.title,
            type: eventData.type,
            date: eventData.date,
            is_completed: false,
            ...(eventData.score != null ? { score: eventData.score } : {}),
            user_id: user.id,
        };

        const { data, error } = await supabase
            .from("events")
            .insert(newEvent)
            .select()
            .single();

        if (error) {
            console.error("Error adding event:", error);
            return;
        }

        set((state) => ({
            events: [...state.events, { ...data, courseId: data.course_id, isCompleted: data.is_completed, userId: data.user_id }],
        }));
    },

    addRecurringEvents: async (baseEvent, dates) => {
        const { user } = get();
        if (!user) return false;

        const recurrenceId = crypto.randomUUID();

        const eventsToAdd = dates.map(date => ({
            course_id: baseEvent.courseId,
            title: baseEvent.title,
            type: baseEvent.type,
            date: date, // Pass as number (timestamp)
            is_completed: false,
            user_id: user.id,
            recurrence_id: recurrenceId
        }));

        const { data, error } = await supabase.from("events").insert(eventsToAdd).select();

        if (error) {
            console.error("Error adding recurring events:", JSON.stringify(error, null, 2));
            return false;
        }

        if (data) {
            const newEvents = data.map(e => ({
                id: e.id,
                courseId: e.course_id,
                title: e.title,
                type: e.type,
                date: new Date(e.date).getTime(),
                isCompleted: e.is_completed,
                userId: e.user_id,
                recurrenceId: e.recurrence_id
            }));

            set((state) => ({
                events: [...state.events, ...newEvents]
            }));
            return true;
        }
        return false;
    },

    addFocusSession: async (sessionData) => {
        const { user } = get();
        if (!user) return;

        const newSession = {
            user_id: user.id,
            course_id: sessionData.courseId,
            event_id: sessionData.eventId,
            duration: sessionData.duration
        };

        const { data, error } = await supabase
            .from("focus_sessions")
            .insert(newSession)
            .select()
            .single();

        if (error) {
            console.error("Error adding focus session:", error);
            return;
        }

        set((state) => ({
            focusSessions: [...state.focusSessions, {
                id: data.id,
                userId: data.user_id,
                courseId: data.course_id,
                eventId: data.event_id,
                duration: data.duration,
                createdAt: new Date(data.created_at).getTime()
            }]
        }));
    },

    deleteFocusSession: async (id) => {
        const { error } = await supabase.from("focus_sessions").delete().eq("id", id);
        if (error) {
            console.error("Error deleting focus session:", error);
            return;
        }
        set((state) => ({
            focusSessions: state.focusSessions.filter((s) => s.id !== id),
        }));
    },

    // Timer Actions
    setTimerDuration: (minutes) => {
        set((state) => ({
            timer: {
                ...state.timer,
                timerDuration: minutes,
                timerTimeLeft: minutes * 60, // Reset time left when duration changes
                timerIsActive: false,
                timerIsPaused: false
            }
        }));
    },

    setTimerContext: (courseId, eventId) => {
        set((state) => ({
            timer: {
                ...state.timer,
                timerCourseId: courseId,
                timerEventId: eventId
            }
        }));
    },

    toggleTimer: () => {
        set((state) => ({
            timer: {
                ...state.timer,
                timerIsActive: !state.timer.timerIsActive,
                timerIsPaused: state.timer.timerIsActive // If active, now paused
            }
        }));
    },

    resetTimer: () => {
        set((state) => ({
            timer: {
                ...state.timer,
                timerIsActive: false,
                timerIsPaused: false,
                timerTimeLeft: state.timer.timerDuration * 60
            }
        }));
    },

    tickTimer: () => {
        set((state) => {
            if (state.timer.timerTimeLeft > 0) {
                return {
                    timer: {
                        ...state.timer,
                        timerTimeLeft: state.timer.timerTimeLeft - 1
                    }
                };
            } else {
                // Timer finished
                // We should stop it and maybe save session here or let component handle it?
                // Ideally, the component that drives the tick handles the completion logic (saving),
                // but we can also just stop it here.
                // Let's just stop it here for safety.
                return {
                    timer: {
                        ...state.timer,
                        timerIsActive: false,
                        timerIsPaused: false
                    }
                };
            }
        });
    },

    stopTimer: async () => {
        const { timer, addFocusSession } = get();

        // Save session if duration > 0
        const secondsFocused = (timer.timerDuration * 60) - timer.timerTimeLeft;
        if (secondsFocused > 0 && timer.timerCourseId) {
            await addFocusSession({
                courseId: timer.timerCourseId,
                eventId: timer.timerEventId,
                duration: secondsFocused
            });
        }

        set((state) => ({
            timer: {
                ...state.timer,
                timerIsActive: false,
                timerIsPaused: false,
                timerTimeLeft: state.timer.timerDuration * 60
            }
        }));
    },
    addMultipleEvents: async (events, existingRecurrenceId) => {
        try {
            const { user } = get();
            if (!user) return false;

            const recurrenceId = existingRecurrenceId || crypto.randomUUID();
            const eventsWithRecurrence = events.map(e => ({
                course_id: e.courseId,
                title: e.title,
                type: e.type,
                date: e.date,
                score: e.score,
                is_completed: false,
                user_id: user.id,
                recurrence_id: recurrenceId
            }));

            const { data, error } = await supabase
                .from('events')
                .insert(eventsWithRecurrence)
                .select();

            if (error) throw error;

            if (data) {
                const newEvents = data.map(e => ({
                    id: e.id,
                    courseId: e.course_id,
                    title: e.title,
                    type: e.type,
                    date: new Date(e.date).getTime(),
                    isCompleted: e.is_completed,
                    userId: e.user_id,
                    recurrenceId: e.recurrence_id,
                    score: e.score
                }));

                set(state => ({
                    events: [...state.events, ...newEvents]
                }));
            }

            return true;
        } catch (error) {
            console.error('Error adding multiple events:', error);
            return false;
        }
    },

    updateEvent: async (id, updates) => {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.isCompleted !== undefined) payload.is_completed = updates.isCompleted;
        if (updates.courseId !== undefined) payload.course_id = updates.courseId;
        if (updates.score !== undefined) payload.score = updates.score;

        const { error } = await supabase
            .from("events")
            .update(payload)
            .eq("id", id);

        if (error) {
            console.error("Error updating event:", error);
            return;
        }

        set((state) => ({
            events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
    },

    updateRecurringEvent: async (id, updates, mode) => {
        const { user, events } = get();
        if (!user) return false;

        const event = events.find(e => e.id === id);
        if (!event) return false;

        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.isCompleted !== undefined) payload.is_completed = updates.isCompleted;
        if (updates.courseId !== undefined) payload.course_id = updates.courseId;
        if (updates.score !== undefined) payload.score = updates.score;

        if (mode === 'single') {
            // Disconnect from series
            payload.recurrence_id = null;

            const { error } = await supabase
                .from("events")
                .update(payload)
                .eq("id", id);

            if (error) {
                console.error("Error updating event:", JSON.stringify(error, null, 2));
                return false;
            }

            set((state) => ({
                events: state.events.map((e) => (e.id === id ? { ...e, ...updates, recurrenceId: null } : e)),
            }));
        } else {
            // Update all in series
            if (!event.recurrenceId) {
                // Should not happen if called correctly, but fallback to single
                await get().updateEvent(id, updates);
                return true;
            }

            // 1. Calculate date difference if date is being updated
            let dateDiff = 0;
            if (updates.date !== undefined) {
                dateDiff = updates.date - event.date;
            }

            // 2. Prepare updates for all events in the series
            // We use the current store state to get all events in the series
            const seriesEvents = events.filter(e => e.recurrenceId === event.recurrenceId);

            const dbUpdates = seriesEvents.map(e => {
                const isTarget = e.id === id;

                // Base: current event data
                let newTitle = e.title;
                let newType = e.type;
                let newCourseId = e.courseId;
                let newDate = e.date;
                let newScore = e.score;
                let newIsCompleted = e.isCompleted;

                // Apply Shared Updates (Title, Type, Course) to ALL
                if (updates.title !== undefined) newTitle = updates.title;
                if (updates.type !== undefined) newType = updates.type;
                if (updates.courseId !== undefined) newCourseId = updates.courseId;

                // Apply Date Shift to ALL (if date changed)
                if (dateDiff !== 0) {
                    newDate = e.date + dateDiff;
                }

                // Apply Unique Updates (Score, Completion) ONLY to Target
                if (isTarget) {
                    if (updates.score !== undefined) newScore = updates.score;
                    if (updates.isCompleted !== undefined) newIsCompleted = updates.isCompleted;
                    // Ensure target date is exactly what was requested (avoids float drift though unlikely with ints)
                    if (updates.date !== undefined) newDate = updates.date;
                }

                return {
                    id: e.id,
                    user_id: e.userId,
                    course_id: newCourseId,
                    title: newTitle,
                    type: newType,
                    date: newDate, // DB is bigint
                    score: newScore,
                    is_completed: newIsCompleted,
                    recurrence_id: e.recurrenceId
                };
            });

            // 3. Perform Bulk Upsert
            const { error } = await supabase
                .from("events")
                .upsert(dbUpdates);

            if (error) {
                console.error("Error updating recurring events (bulk):", JSON.stringify(error, null, 2));
                return false;
            }

            // 4. Update Store
            set((state) => ({
                events: state.events.map((e) => {
                    const update = dbUpdates.find(u => u.id === e.id);
                    if (update) {
                        return {
                            ...e,
                            title: update.title,
                            type: update.type,
                            courseId: update.course_id,
                            date: update.date,
                            score: update.score,
                            isCompleted: update.is_completed
                        };
                    }
                    return e;
                }),
            }));
        }
        return true;
    },

    updateEventScore: async (id, score) => {
        const { error } = await supabase
            .from("events")
            .update({ score })
            .eq("id", id);

        if (error) {
            console.error("Error updating event score:", error);
            return;
        }

        set((state) => ({
            events: state.events.map((e) =>
                e.id === id ? { ...e, score } : e
            ),
        }));
    },

    toggleEventCompletion: async (id) => {
        const { events } = get();
        const event = events.find((e) => e.id === id);
        if (!event) return;

        const { error } = await supabase
            .from("events")
            .update({ is_completed: !event.isCompleted })
            .eq("id", id);

        if (error) {
            console.error("Error toggling event:", error);
            return;
        }

        set((state) => ({
            events: state.events.map((e) =>
                e.id === id ? { ...e, isCompleted: !e.isCompleted } : e
            ),
        }));
    },

    reorderCourses: async (newOrder) => {
        // Optimistic update
        set((state) => ({
            courses: newOrder
        }));

        // Update in DB
        const updates = newOrder.map((course, index) => ({
            id: course.id,
            order_index: index,
            user_id: course.userId // Required for RLS usually, but id should be enough if policy allows
        }));

        // We can't do bulk update easily with standard Supabase client without a custom RPC or multiple requests.
        // For few courses, multiple requests is fine.
        for (const update of updates) {
            await supabase
                .from("courses")
                .update({ order_index: update.order_index })
                .eq("id", update.id);
        }
    },

    deleteEvent: async (id) => {
        const { error } = await supabase.from("events").delete().eq("id", id);
        if (error) {
            console.error("Error deleting event:", error);
            return;
        }
        set((state) => ({
            events: state.events.filter((e) => e.id !== id),
        }));
    },

    deleteCourseEvents: async (courseId) => {
        const { error } = await supabase.from("events").delete().eq("course_id", courseId);
        if (error) {
            console.error("Error deleting course events:", error);
            return;
        }
        set((state) => ({
            events: state.events.filter((e) => e.courseId !== courseId),
        }));
    },

    // Semester Actions
    addSemester: async (semesterData) => {
        const { user } = get();
        if (!user) return;

        const newSemester = {
            user_id: user.id,
            name: semesterData.name,
            start_date: new Date(semesterData.startDate).toISOString(),
            end_date: new Date(semesterData.endDate).toISOString(),
            breaks: (semesterData.breaks || []).map(b => ({
                id: b.id,
                startDate: new Date(b.startDate).toISOString(),
                endDate: new Date(b.endDate).toISOString()
            }))
        };

        const { data, error } = await supabase
            .from("semesters")
            .insert(newSemester)
            .select()
            .single();

        if (error) {
            console.error("Error adding semester:", error);
            return;
        }

        const formattedSemester = {
            ...data,
            userId: data.user_id,
            startDate: new Date(data.start_date).getTime(),
            endDate: new Date(data.end_date).getTime(),
            breaks: (data.breaks || []).map((b: any) => ({
                id: b.id,
                startDate: new Date(b.startDate).getTime(),
                endDate: new Date(b.endDate).getTime()
            }))
        };

        set((state) => ({
            semesters: [...state.semesters, formattedSemester],
            activeSemesterId: state.activeSemesterId || formattedSemester.id, // Set active if none
        }));
    },

    updateSemester: async (id, updates) => {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.startDate !== undefined) payload.start_date = new Date(updates.startDate).toISOString();
        if (updates.endDate !== undefined) payload.end_date = new Date(updates.endDate).toISOString();
        if (updates.breaks !== undefined) {
            payload.breaks = updates.breaks.map(b => ({
                id: b.id,
                startDate: new Date(b.startDate).toISOString(),
                endDate: new Date(b.endDate).toISOString()
            }));
        }

        const { error } = await supabase
            .from("semesters")
            .update(payload)
            .eq("id", id);

        if (error) {
            console.error("Error updating semester:", error);
            return;
        }

        set((state) => ({
            semesters: state.semesters.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));

        // Cleanup events that now fall into breaks
        if (updates.breaks) {
            const { courses, events, deleteEvent } = get();

            // Get courses in this semester
            const semesterCourses = courses.filter(c => c.semesterId === id);
            const semesterCourseIds = semesterCourses.map(c => c.id);

            // Get events for these courses
            const semesterEvents = events.filter(e => semesterCourseIds.includes(e.courseId));

            // Find events that fall into the new breaks
            const eventsToDelete = semesterEvents.filter(e => {
                // Check if event date falls in any of the new breaks
                // We need to use the updates.breaks because state might not be fully updated yet or we want to be explicit
                // updates.breaks is { id, startDate, endDate } (strings or numbers? The input to this function has strings usually from the modal, but let's check)
                // Actually, the input `updates` comes from the component. In the component we map to timestamps?
                // Wait, in SemesterSettingsModal we pass timestamps: startDate: new Date(...).getTime()
                // So updates.breaks has timestamps.

                return updates.breaks!.some(b =>
                    e.date >= b.startDate && e.date <= b.endDate
                );
            });

            if (eventsToDelete.length > 0) {
                console.log(`Deleting ${eventsToDelete.length} events that fall into new breaks.`);
                await Promise.all(eventsToDelete.map(e => deleteEvent(e.id)));
            }

            // Renumber remaining events
            // We need to fetch fresh events because some might have been deleted
            // But we can just filter the local list since we know what we deleted
            const remainingEvents = semesterEvents.filter(e => !eventsToDelete.some(d => d.id === e.id));

            // Get user workdays
            const { settings } = get();
            const workdays = settings?.workdays || [1, 2, 3, 4, 5];

            // Get old semester data (we need it to calculate old week numbers)
            const { semesters } = get();
            const oldSemester = semesters.find(s => s.id === id);

            if (oldSemester) {
                // We need to construct the "new" semester object fully to pass to helper
                // updates.breaks has timestamps, but might be partial.
                // The helper expects { startDate, endDate } objects.
                const newBreaks = updates.breaks || oldSemester.breaks;

                const updatesToPerform: { id: string, title: string }[] = [];

                for (const event of remainingEvents) {
                    // Calculate old week number
                    const oldWeek = calculateAcademicWeek(
                        event.date,
                        oldSemester.startDate,
                        oldSemester.breaks,
                        workdays
                    );

                    // Calculate new week number
                    const newWeek = calculateAcademicWeek(
                        event.date,
                        updates.startDate ? new Date(updates.startDate).getTime() : oldSemester.startDate,
                        newBreaks.map(b => ({ startDate: b.startDate, endDate: b.endDate })), // Ensure format
                        workdays
                    );

                    if (oldWeek !== newWeek) {
                        // Check if title contains the old week number
                        // We look for "Week X", "Lecture X", "05", "5"
                        // Safest is to look for the exact number with word boundaries or specific patterns
                        // But user uses "{week}" which becomes "01", "02", etc.

                        const oldWeekStr = oldWeek.toString();
                        const oldWeekPadded = oldWeek.toString().padStart(2, '0');
                        const newWeekPadded = newWeek.toString().padStart(2, '0');

                        let newTitle = event.title;
                        let changed = false;

                        // Try replacing padded first (more specific)
                        if (newTitle.includes(oldWeekPadded)) {
                            newTitle = newTitle.replace(oldWeekPadded, newWeekPadded);
                            changed = true;
                        } else if (newTitle.includes(oldWeekStr)) {
                            // Only replace if it looks like a standalone number to avoid replacing "1" in "10"
                            // Simple regex for word boundary
                            const regex = new RegExp(`\\b${oldWeekStr}\\b`);
                            if (regex.test(newTitle)) {
                                newTitle = newTitle.replace(regex, newWeek.toString());
                                changed = true;
                            }
                        }

                        if (changed && newTitle !== event.title) {
                            updatesToPerform.push({ id: event.id, title: newTitle });
                        }
                    }
                }

                if (updatesToPerform.length > 0) {
                    console.log(`Renumbering ${updatesToPerform.length} events.`);
                    // Update in DB and State
                    // We can loop updateEvent
                    const { updateEvent } = get();
                    await Promise.all(updatesToPerform.map(u => updateEvent(u.id, { title: u.title })));
                }
            }
        }
    },

    deleteSemester: async (id) => {
        const { error } = await supabase.from("semesters").delete().eq("id", id);
        if (error) {
            console.error("Error deleting semester:", error);
            return;
        }
        set((state) => ({
            semesters: state.semesters.filter((s) => s.id !== id),
            activeSemesterId: state.activeSemesterId === id ? null : state.activeSemesterId,
        }));
    },

    setActiveSemester: (id) => {
        set({ activeSemesterId: id });
        // Optionally persist to local storage
        localStorage.setItem("activeSemesterId", id || "");
    },

    updateSettings: async (settingsUpdates) => {
        const { user, settings } = get();
        if (!user) return;

        const payload: any = {};
        if (settingsUpdates.workdays !== undefined) payload.workdays = settingsUpdates.workdays;
        if (settingsUpdates.gradeColors !== undefined) payload.grade_colors = settingsUpdates.gradeColors;
        if (settingsUpdates.undefinedColor !== undefined) payload.undefined_color = settingsUpdates.undefinedColor;
        if (settingsUpdates.eventTypes !== undefined) payload.event_types = settingsUpdates.eventTypes;

        // Check if settings exist for user
        const { data: existingSettings } = await supabase
            .from("settings")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        let error;
        if (existingSettings) {
            const { error: updateError } = await supabase
                .from("settings")
                .update(payload)
                .eq("user_id", user.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from("settings")
                .insert({ user_id: user.id, ...payload });
            error = insertError;
        }

        if (error) {
            console.error("Error updating settings with payload:", payload);
            console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
            return;
        }

        set((state) => ({
            settings: state.settings ? { ...state.settings, ...settingsUpdates } : {
                userId: user.id,
                workdays: settingsUpdates.workdays || [1, 2, 3, 4, 5],
                gradeColors: settingsUpdates.gradeColors || [
                    { min: 80, color: "#22c55e" },
                    { min: 50, color: "#eab308" },
                    { min: 0, color: "#ef4444" }
                ],
                undefinedColor: settingsUpdates.undefinedColor || "#71717a",
                eventTypes: settingsUpdates.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other']
            }
        }));
    },
}));
