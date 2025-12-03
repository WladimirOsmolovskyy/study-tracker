import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type Tracker = {
    id: string;
    eventId: string;
    name: string;
    value: number;
};

export type EventType = 'lecture' | 'homework' | 'exam' | 'lab' | 'other';

export type CourseEvent = {
    id: string;
    courseId: string;
    title: string;
    type: EventType;
    date: number;
    isCompleted: boolean;
    trackers: Tracker[];
};

export type Course = {
    id: string;
    title: string;
    code: string;
    color: string;
    semester: string;
    createdAt: number;
};

interface StudyState {
    user: User | null;
    courses: Course[];
    events: CourseEvent[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    fetchData: () => Promise<void>;

    addCourse: (course: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;

    addEvent: (event: Omit<CourseEvent, 'id' | 'isCompleted' | 'trackers'>) => Promise<void>;
    toggleEventCompletion: (id: string) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;

    addTracker: (tracker: Omit<Tracker, 'id'>) => Promise<void>;
    updateTrackerValue: (id: string, value: number) => Promise<void>;
    deleteTracker: (id: string) => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
    user: null,
    courses: [],
    events: [],
    isLoading: false,

    setUser: (user) => set({ user }),

    fetchData: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        const { data: courses } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: true });

        const { data: events } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        // Fetch trackers and attach to events (simplified for now)
        // In a real app, we might fetch trackers on demand or join them
        // For now, let's just fetch all trackers
        const { data: trackers } = await supabase
            .from('trackers')
            .select('*');

        const eventsWithTrackers = (events || []).map(event => ({
            ...event,
            courseId: event.course_id, // Map snake_case to camelCase
            isCompleted: event.is_completed,
            trackers: (trackers || [])
                .filter((t: any) => t.event_id === event.id)
                .map((t: any) => ({ ...t, eventId: t.event_id }))
        }));

        set({
            courses: (courses || []).map((c: any) => ({ ...c, createdAt: new Date(c.created_at).getTime() })),
            events: eventsWithTrackers,
            isLoading: false
        });
    },

    addCourse: async (course) => {
        const { user } = get();
        if (!user) return;

        const { data, error } = await supabase
            .from('courses')
            .insert({
                user_id: user.id,
                title: course.title,
                code: course.code,
                color: course.color,
                semester: course.semester
            })
            .select()
            .single();

        if (data) {
            set((state) => ({
                courses: [...state.courses, { ...data, createdAt: new Date(data.created_at).getTime() }]
            }));
        }
    },

    deleteCourse: async (id) => {
        await supabase.from('courses').delete().eq('id', id);
        set((state) => ({
            courses: state.courses.filter((c) => c.id !== id),
            events: state.events.filter((e) => e.courseId !== id)
        }));
    },

    addEvent: async (event) => {
        const { user } = get();
        if (!user) return;

        const { data } = await supabase
            .from('events')
            .insert({
                user_id: user.id,
                course_id: event.courseId,
                title: event.title,
                type: event.type,
                date: event.date,
                is_completed: false
            })
            .select()
            .single();

        if (data) {
            set((state) => ({
                events: [...state.events, {
                    ...data,
                    courseId: data.course_id,
                    isCompleted: data.is_completed,
                    trackers: []
                }]
            }));
        }
    },

    toggleEventCompletion: async (id) => {
        const event = get().events.find(e => e.id === id);
        if (!event) return;

        await supabase
            .from('events')
            .update({ is_completed: !event.isCompleted })
            .eq('id', id);

        set((state) => ({
            events: state.events.map((e) =>
                e.id === id ? { ...e, isCompleted: !e.isCompleted } : e
            )
        }));
    },

    deleteEvent: async (id) => {
        await supabase.from('events').delete().eq('id', id);
        set((state) => ({
            events: state.events.filter((e) => e.id !== id)
        }));
    },

    addTracker: async (tracker) => {
        const { user } = get();
        if (!user) return;

        const { data } = await supabase
            .from('trackers')
            .insert({
                user_id: user.id,
                event_id: tracker.eventId,
                name: tracker.name,
                value: tracker.value
            })
            .select()
            .single();

        if (data) {
            set((state) => ({
                events: state.events.map((e) =>
                    e.id === tracker.eventId
                        ? { ...e, trackers: [...e.trackers, { ...data, eventId: data.event_id }] }
                        : e
                )
            }));
        }
    },

    updateTrackerValue: async (id, value) => {
        await supabase
            .from('trackers')
            .update({ value })
            .eq('id', id);

        set((state) => ({
            events: state.events.map((e) => ({
                ...e,
                trackers: e.trackers.map((t) =>
                    t.id === id ? { ...t, value } : t
                )
            }))
        }));
    },

    deleteTracker: async (id) => {
        await supabase.from('trackers').delete().eq('id', id);
        set((state) => ({
            events: state.events.map((e) => ({
                ...e,
                trackers: e.trackers.filter((t) => t.id !== id)
            }))
        }));
    },
}));
