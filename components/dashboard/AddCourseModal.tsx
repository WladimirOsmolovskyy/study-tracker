import { useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const gradients = [
    { id: "blue", class: "from-blue-500 to-cyan-400" },
    { id: "pink", class: "from-pink-500 to-rose-400" },
    { id: "purple", class: "from-purple-500 to-indigo-400" },
    { id: "orange", class: "from-orange-500 to-amber-400" },
    { id: "green", class: "from-emerald-500 to-teal-400" },
];

export function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
    const { addCourse, semesters } = useStudyStore();
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [semesterId, setSemesterId] = useState("");
    const [color, setColor] = useState("blue");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !code) return;

        addCourse({
            title,
            code,
            semesterId: semesterId || null,
            color,
        });

        // Reset and close
        setTitle("");
        setCode("");
        setSemesterId("");
        setColor("blue");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Course">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Course Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Advanced Calculus"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Course Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. MATH201"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/70">Semester</label>
                        <select
                            value={semesterId}
                            onChange={(e) => setSemesterId(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-white"
                        >
                            <option value="" className="bg-gray-900">Select Semester...</option>
                            {semesters.map(s => (
                                <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Theme Color</label>
                    <div className="flex gap-3">
                        {gradients.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => setColor(g.id)}
                                className={cn(
                                    "w-8 h-8 rounded-full bg-gradient-to-br transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50",
                                    g.class,
                                    color === g.id && "ring-2 ring-white scale-110"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Create Course
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
