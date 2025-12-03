import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Event {
    id: string;
    courseId: string;
    title: string;
    type: "lecture" | "homework" | "exam" | "other";
    date: number; // Timestamp
    isCompleted: boolean;
    score?: number | null;
    userId: string;
}

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
    semester: string;
    createdAt: number;
    userId: string;
};

interface StudyStore {
    user: User | null;
    courses: Course[];
    events: Event[];
    trackers: Tracker[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    fetchData: () => Promise<void>;

    addCourse: (course: Omit<Course, "id" | "userId" | "createdAt">) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;

    addEvent: (event: Omit<Event, "id" | "userId" | "isCompleted">) => Promise<void>;
    addRecurringEvents: (baseEvent: Omit<Event, "id" | "userId" | "isCompleted">, dates: number[]) => Promise<void>;
    updateEventScore: (id: string, score: number | null) => Promise<void>;
    toggleEventCompletion: (id: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
}

export const useStudyStore = create<StudyStore>((set, get) => ({
    user: null,
    courses: [],
    events: [],
    trackers: [],
    isLoading: false,

    setUser: (user) => set({ user }),

    fetchData: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        const { data: courses } = await supabase
            .from("courses")
            .select("*")
            .eq("user_id", user.id);

        const { data: events } = await supabase
            .from("events")
            .select("*")
            .eq("user_id", user.id);

        // Map snake_case to camelCase
        const formattedCourses = courses?.map(c => ({
            ...c,
            userId: c.user_id,
            createdAt: new Date(c.created_at).getTime()
        })) || [];

        const formattedEvents = events?.map(e => ({
            ...e,
            courseId: e.course_id,
            isCompleted: e.is_completed,
            userId: e.user_id
        })) || [];

        set({ courses: formattedCourses, events: formattedEvents, isLoading: false });
    },

    addCourse: async (courseData) => {
        const { user } = get();
        if (!user) return;

        const newCourse = {
            user_id: user.id,
            title: courseData.title,
            code: courseData.code,
            color: courseData.color,
            semester: courseData.semester
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
            courses: [...state.courses, { ...data, userId: data.user_id, createdAt: new Date(data.created_at).getTime() }],
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
            score: null,
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
        if (!user) return;

        const eventsToInsert = dates.map(date => ({
            course_id: baseEvent.courseId,
            title: baseEvent.title,
            type: baseEvent.type,
            date: date,
            is_completed: false,
            score: null,
            user_id: user.id,
        }));

        const { data, error } = await supabase
            .from("events")
            .insert(eventsToInsert)
            .select();

        if (error) {
            console.error("Error adding recurring events:", error);
            return;
        }

        const formattedEvents = data.map(e => ({
            ...e,
            courseId: e.course_id,
            isCompleted: e.is_completed,
            userId: e.user_id
        }));

        set((state) => ({
            events: [...state.events, ...formattedEvents],
        }));
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
}));
