import { useState, useEffect } from "react";
import { useStudyStore, Event } from "@/store/useStudyStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Plus, Minus, Copy } from "lucide-react";
import { calculateAcademicWeek } from "@/lib/utils";

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    semesterId?: string | null;
    initialData?: Event;
    initialDate?: Date;
}

export function EventModal({ isOpen, onClose, courseId, semesterId, initialData, initialDate }: EventModalProps) {
    const { addEvent, addRecurringEvents, updateEvent, updateRecurringEvent, courses, semesters, events, settings, updateSettings } = useStudyStore();
    const [title, setTitle] = useState("");
    const [type, setType] = useState("lecture");
    const [date, setDate] = useState("");
    const [score, setScore] = useState<number | "">("");
    const [selectedCourseId, setSelectedCourseId] = useState(courseId);

    // Recurrence State
    const [recurrence, setRecurrence] = useState<"none" | "weekly" | "custom">("none");
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0 = Sunday, 1 = Monday...
    const [dayCounts, setDayCounts] = useState<Record<number, number>>({});
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
    const [isRecurrenceExpanded, setIsRecurrenceExpanded] = useState(false);

    // Get semester dates for constraints
    const semester = semesters.find(s => s.id === semesterId);
    const minDate = semester ? new Date(semester.startDate).toISOString().split('T')[0] : undefined;
    const maxDate = semester ? new Date(semester.endDate).toISOString().split('T')[0] : undefined;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setType(initialData.type);
                // Format date to YYYY-MM-DD for input using local time to avoid timezone shifts
                const d = new Date(initialData.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setDate(`${year}-${month}-${day}`);

                setScore(initialData.score ?? "");

                // Analyze recurrence pattern
                if (initialData.recurrenceId) {
                    const seriesEvents = events.filter(e => e.recurrenceId === initialData.recurrenceId).sort((a, b) => a.date - b.date);
                    if (seriesEvents.length > 0) {
                        const days = new Set(seriesEvents.map(e => new Date(e.date).getDay()));
                        const uniqueDays = Array.from(days);

                        // Set end date to the last event in the series
                        const lastEvent = seriesEvents[seriesEvents.length - 1];
                        const d = new Date(lastEvent.date);
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        setEndDate(`${year}-${month}-${day}`);

                        if (uniqueDays.length === 1) {
                            setRecurrence("weekly");
                        } else {
                            setRecurrence("custom");
                            setSelectedDays(uniqueDays);
                            // Default count to 1 for simplicity
                            const counts: Record<number, number> = {};
                            uniqueDays.forEach(d => counts[d] = 1);
                            setDayCounts(counts);
                        }
                    } else {
                        setRecurrence("none");
                        setEndDate("");
                    }
                } else {
                    setRecurrence("none");
                    setEndDate("");
                }
            } else {
                setTitle("");
                setType("lecture");

                if (initialDate) {
                    const year = initialDate.getFullYear();
                    const month = String(initialDate.getMonth() + 1).padStart(2, '0');
                    const day = String(initialDate.getDate()).padStart(2, '0');
                    setDate(`${year}-${month}-${day}`);
                } else {
                    setDate("");
                }

                setScore("");
                setRecurrence("none");
                setSelectedDays([]);
                setDayCounts({});
                setEndDate("");
            }

            setSelectedCourseId(courseId);
            setShowDeleteConfirm(false);
            setShowRecurrenceOptions(false);
            setIsRecurrenceExpanded(false);
        }
    }, [isOpen, initialData, initialDate, courseId, events]);

    const handleDuplicate = async () => {
        if (!title || !date) return;
        setIsLoading(true);
        try {
            const dateTimestamp = new Date(date + 'T00:00:00').getTime();
            await addEvent({
                courseId: selectedCourseId,
                title: title + " (Copy)",
                type,
                date: dateTimestamp,
                score: score === "" ? null : Number(score),
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (mode: 'single' | 'all') => {
        if (!initialData || !title || !date) return;
        setIsLoading(true);

        // Add new type if it doesn't exist
        if (type && settings?.eventTypes && !settings.eventTypes.includes(type)) {
            await updateSettings({ eventTypes: [...settings.eventTypes, type] });
        }

        try {
            const dateTimestamp = new Date(date + 'T00:00:00').getTime();
            const success = await updateRecurringEvent(initialData.id, {
                title,
                type,
                date: dateTimestamp,
                score: score === "" ? null : Number(score),
                courseId: selectedCourseId,
            }, mode);

            if (success) {
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;

        if (initialData && initialData.recurrenceId && !isRecurrenceExpanded) {
            setShowRecurrenceOptions(true);
            return;
        }

        setIsLoading(true);

        // Add new type if it doesn't exist
        if (type && settings?.eventTypes && !settings.eventTypes.includes(type)) {
            await updateSettings({ eventTypes: [...settings.eventTypes, type] });
        }

        try {
            const dateTimestamp = new Date(date + 'T00:00:00').getTime();

            if (initialData) {
                // Update current event
                await updateEvent(initialData.id, {
                    title,
                    type,
                    date: dateTimestamp,
                    score: score === "" ? null : Number(score),
                    courseId: selectedCourseId,
                });

                // Generate new events if expanded
                if (isRecurrenceExpanded && recurrence !== "none") {
                    if (!endDate) return;
                    const start = new Date(date + 'T00:00:00');
                    const end = new Date(endDate + 'T23:59:59');
                    const dates: number[] = [];

                    // Generate dates
                    let current = new Date(start);
                    while (current <= end) {
                        const day = current.getDay();
                        const currentTime = current.getTime();
                        const isBreak = semester?.breaks.some(b =>
                            currentTime >= b.startDate && currentTime <= b.endDate
                        );

                        if (!isBreak) {
                            if (recurrence === "weekly") {
                                // Weekly means repeat on the same day of week as start date
                                if (day === start.getDay()) {
                                    dates.push(currentTime);
                                }
                            } else if (recurrence === "custom") {
                                if (selectedDays.includes(day)) {
                                    const count = dayCounts[day] || 1;
                                    for (let c = 0; c < count; c++) {
                                        dates.push(currentTime);
                                    }
                                }
                            }
                        }
                        current.setDate(current.getDate() + 1);
                    }

                    // Filter out dates that already exist in the series
                    const existingDates = new Set(
                        initialData.recurrenceId
                            ? events
                                .filter(e => e.recurrenceId === initialData.recurrenceId)
                                .map(e => e.date)
                            : [dateTimestamp]
                    );

                    // Also exclude the current date being edited if it's not in the series list for some reason (it should be)
                    existingDates.add(dateTimestamp);

                    const uniqueDates = dates.filter(d => !existingDates.has(d));

                    if (uniqueDates.length > 0) {
                        const eventsToCreate = uniqueDates.map((d, index) => {
                            let eventTitle = title;
                            if (eventTitle.includes('{i}')) {
                                eventTitle = eventTitle.replace(/{i}/g, (index + 1).toString().padStart(2, '0'));
                            }
                            if (eventTitle.includes('{index}')) {
                                eventTitle = eventTitle.replace(/{index}/g, (index + 1).toString().padStart(2, '0'));
                            }
                            return {
                                courseId: selectedCourseId,
                                title: eventTitle,
                                type,
                                date: d,
                                score: score === "" ? null : Number(score),
                            };
                        });

                        // Pass existing recurrenceId
                        await useStudyStore.getState().addMultipleEvents(eventsToCreate, initialData.recurrenceId || undefined);
                    }
                }

                onClose();
            } else {
                // ... existing add logic
                if (recurrence === "none") {
                    await addEvent({
                        courseId: selectedCourseId,
                        title,
                        type,
                        date: dateTimestamp,
                        score: score === "" ? null : Number(score),
                    });
                    onClose();
                } else {
                    if (!endDate) return;

                    const start = new Date(date + 'T00:00:00');
                    const end = new Date(endDate + 'T23:59:59'); // Include the end date fully
                    const dates: number[] = [];

                    // Generate dates
                    let current = new Date(start);
                    while (current <= end) {
                        const day = current.getDay();

                        // Check if date falls in a break
                        const currentTime = current.getTime();
                        const isBreak = semester?.breaks.some(b =>
                            currentTime >= b.startDate && currentTime <= b.endDate
                        );

                        if (!isBreak) {
                            if (recurrence === "weekly") {
                                // Weekly means repeat on the same day of week as start date
                                if (day === start.getDay()) {
                                    dates.push(currentTime);
                                }
                            } else if (recurrence === "custom") {
                                if (selectedDays.includes(day)) {
                                    const count = dayCounts[day] || 1;
                                    for (let c = 0; c < count; c++) {
                                        dates.push(currentTime);
                                    }
                                }
                            }
                        }

                        // Advance one day
                        current.setDate(current.getDate() + 1);
                    }

                    if (dates.length > 0) {
                        // Prepare events with dynamic titles
                        const eventsToCreate = dates.map((d, index) => {
                            let eventTitle = title;

                            // {week} is now handled dynamically in the view
                            // if (eventTitle.includes('{week}')) { ... }

                            // Replace {i} or {index} with recurrence index (1-based)
                            if (eventTitle.includes('{i}')) {
                                eventTitle = eventTitle.replace(/{i}/g, (index + 1).toString().padStart(2, '0'));
                            }
                            if (eventTitle.includes('{index}')) {
                                eventTitle = eventTitle.replace(/{index}/g, (index + 1).toString().padStart(2, '0'));
                            }

                            return {
                                courseId: selectedCourseId,
                                title: eventTitle,
                                type,
                                date: d,
                                score: score === "" ? null : Number(score),
                            };
                        });

                        const success = await useStudyStore.getState().addMultipleEvents(eventsToCreate);
                        if (success) {
                            onClose();
                        }
                    } else {
                        // No dates generated?
                        onClose();
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Event" : "Add New Event"}
            headerAction={initialData ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDuplicate}
                    title="Duplicate Event"
                    className="h-8 px-2 text-xs gap-1.5"
                >
                    <Copy className="w-4 h-4" />
                    Duplicate
                </Button>
            ) : undefined}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... existing form fields ... */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Event Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Midterm Exam"
                        className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground"
                        required
                    >
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.title} ({course.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground capitalize"
                        >
                            {(settings?.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other']).map((t) => (
                                <option key={t} value={t} className="capitalize">{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Date</label>
                        <input
                            type="date"
                            value={date}
                            min={minDate}
                            max={maxDate}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                            required
                        />
                    </div>
                </div>

                {initialData && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Score (0-100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Optional"
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        />
                    </div>
                )}

                {initialData && (
                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsRecurrenceExpanded(!isRecurrenceExpanded)}
                        >
                            {isRecurrenceExpanded ? "Hide Recurrence Options" : "Add/Edit Recurrences"}
                        </Button>
                    </div>
                )}

                {(!initialData || isRecurrenceExpanded) && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">Recurrence</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRecurrence("none")}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-all ${recurrence === "none" ? "bg-brand-blue text-white border-brand-blue" : "border-black/10 dark:border-white/10 text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"}`}
                                >
                                    None
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRecurrence("weekly")}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-all ${recurrence === "weekly" ? "bg-brand-blue text-white border-brand-blue" : "border-black/10 dark:border-white/10 text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"}`}
                                >
                                    Weekly
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRecurrence("custom")}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-all ${recurrence === "custom" ? "bg-brand-blue text-white border-brand-blue" : "border-black/10 dark:border-white/10 text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"}`}
                                >
                                    Custom Days
                                </button>
                            </div>
                        </div>

                        {recurrence !== "none" && (
                            <div className="space-y-4 p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                                {recurrence === "custom" && (
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Repeat On</label>
                                            <div className="flex justify-between gap-1">
                                                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedDays.includes(i)) {
                                                                setSelectedDays(selectedDays.filter(d => d !== i));
                                                                const newCounts = { ...dayCounts };
                                                                delete newCounts[i];
                                                                setDayCounts(newCounts);
                                                            } else {
                                                                setSelectedDays([...selectedDays, i]);
                                                                setDayCounts({ ...dayCounts, [i]: 1 });
                                                            }
                                                        }}
                                                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${selectedDays.includes(i) ? "bg-brand-pink text-white" : "bg-black/10 dark:bg-white/10 text-foreground/50 hover:bg-black/20 dark:hover:bg-white/20"}`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedDays.length > 0 && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Events Per Day</label>
                                                <div className="space-y-2">
                                                    {selectedDays.sort().map(dayIndex => (
                                                        <div key={dayIndex} className="flex items-center justify-between text-sm bg-black/5 dark:bg-white/5 p-2 rounded-lg border border-black/5 dark:border-white/5">
                                                            <span className="font-medium text-foreground">
                                                                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex]}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = dayCounts[dayIndex] || 1;
                                                                        if (current > 1) {
                                                                            setDayCounts({ ...dayCounts, [dayIndex]: current - 1 });
                                                                        }
                                                                    }}
                                                                    className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                                                                >
                                                                    <Minus size={16} />
                                                                </button>
                                                                <span className="w-4 text-center font-bold">{dayCounts[dayIndex] || 1}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = dayCounts[dayIndex] || 1;
                                                                        if (current < 10) {
                                                                            setDayCounts({ ...dayCounts, [dayIndex]: current + 1 });
                                                                        }
                                                                    }}
                                                                    className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={minDate}
                                        max={maxDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="pt-4 flex justify-between gap-3">
                    {initialData && (
                        <div className="flex items-center gap-2">
                            {showDeleteConfirm ? (
                                <>
                                    <span className="text-sm text-foreground/70 mr-2">Are you sure?</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={async () => {
                                            setIsLoading(true);
                                            await useStudyStore.getState().deleteEvent(initialData.id);
                                            setIsLoading(false);
                                            onClose();
                                        }}
                                        isLoading={isLoading}
                                    >
                                        Confirm Delete
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    isLoading={isLoading}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        {showRecurrenceOptions ? (
                            <>
                                <Button type="button" variant="secondary" onClick={() => handleUpdate('single')} isLoading={isLoading}>
                                    Only This Event
                                </Button>
                                <Button type="button" onClick={() => handleUpdate('all')} isLoading={isLoading}>
                                    All Events
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button type="submit" isLoading={isLoading}>
                                    {initialData ? "Save Changes" : (recurrence === "none" ? "Add Event" : "Add Recurring Events")}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
