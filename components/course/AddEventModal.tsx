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
    const addEvent = useStudyStore((state) => state.addEvent);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<EventType>("lecture");
    const [date, setDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;

        addEvent({
            courseId,
            title,
            type,
            date: new Date(date).getTime(),
        });

        // Reset and close
        setTitle("");
        setType("lecture");
        setDate("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Event">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Event Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Midterm Exam"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as EventType)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-white [&>option]:text-black"
                        >
                            {eventTypes.map((t) => (
                                <option key={t} value={t} className="capitalize">{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-white [color-scheme:dark]"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Add Event
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
