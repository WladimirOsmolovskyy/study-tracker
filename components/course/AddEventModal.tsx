import { useState } from "react";
import { useStudyStore, EventType } from "@/store/useStudyStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
}

const eventTypes: EventType[] = ['lecture', 'homework', 'exam', 'lab', 'other'];

export function AddEventModal({ isOpen, onClose, courseId }: AddEventModalProps) {
    const { addEvent, addRecurringEvents } = useStudyStore();
    const [title, setTitle] = useState("");
    const [type, setType] = useState<EventType>("lecture");
    const [date, setDate] = useState("");

    // Recurrence State
    const [recurrence, setRecurrence] = useState<"none" | "weekly" | "custom">("none");
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0 = Sunday, 1 = Monday...
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;

        setIsLoading(true);

        try {
            if (recurrence === "none") {
                await addEvent({
                    courseId,
                    title,
                    type,
                    date: new Date(date).getTime(),
                });
            } else {
                if (!endDate) return;

                const start = new Date(date);
                const end = new Date(endDate);
                const dates: number[] = [];

                // Generate dates
                let current = new Date(start);
                while (current <= end) {
                    const day = current.getDay();

                    if (recurrence === "weekly") {
                        // Weekly means repeat on the same day of week as start date
                        if (day === start.getDay()) {
                            dates.push(current.getTime());
                        }
                    } else if (recurrence === "custom") {
                        if (selectedDays.includes(day)) {
                            dates.push(current.getTime());
                        }
                    }

                    // Advance one day
                    current.setDate(current.getDate() + 1);
                }

                if (dates.length > 0) {
                    await addRecurringEvents({
                        courseId,
                        title,
                        type,
                        date: 0, // Not used for recurring
                    }, dates);
                }
            }

            // Reset and close
            setTitle("");
            setType("lecture");
            setDate("");
            setRecurrence("none");
            setSelectedDays([]);
            setEndDate("");
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Event">
            <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as EventType)}
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground [&>option]:text-black"
                        >
                            {eventTypes.map((t) => (
                                <option key={t} value={t} className="capitalize">{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Start Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                            required
                        />
                    </div>
                </div>

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
                                                } else {
                                                    setSelectedDays([...selectedDays, i]);
                                                }
                                            }}
                                            className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${selectedDays.includes(i) ? "bg-brand-pink text-white" : "bg-black/10 dark:bg-white/10 text-foreground/50 hover:bg-black/20 dark:hover:bg-white/20"}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {recurrence === "none" ? "Add Event" : "Add Recurring Events"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
