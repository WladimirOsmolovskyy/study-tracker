import { useState, useEffect } from "react";
import { useStudyStore, Course } from "@/store/useStudyStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Course;
}

const gradients = [
    { id: "blue", class: "from-blue-500 to-cyan-400" },
    { id: "pink", class: "from-pink-500 to-rose-400" },
    { id: "purple", class: "from-purple-500 to-indigo-400" },
    { id: "orange", class: "from-orange-500 to-amber-400" },
    { id: "green", class: "from-emerald-500 to-teal-400" },
];

export function CourseModal({ isOpen, onClose, initialData }: CourseModalProps) {
    const { addCourse, updateCourse } = useStudyStore();
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [semester, setSemester] = useState("");
    const [color, setColor] = useState("blue");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setCode(initialData.code);
                setSemester(initialData.semester);
                setColor(initialData.color);
            } else {
                setTitle("");
                setCode("");
                setSemester("");
                setColor("blue");
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !code) return;

        setIsLoading(true);

        try {
            console.log("Submitting course with color:", color);
            if (initialData) {
                await updateCourse(initialData.id, {
                    title,
                    code,
                    semester: semester || "Current",
                    color,
                });
            } else {
                await addCourse({
                    title,
                    code,
                    semester: semester || "Current",
                    color,
                });
            }

            // Reset and close
            setTitle("");
            setCode("");
            setSemester("");
            setColor("blue");
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Course" : "Add New Course"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Course Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Advanced Calculus"
                        className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Course Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. MATH201"
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70">Semester</label>
                        <input
                            type="text"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="e.g. Fall 2024"
                            className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Theme Color</label>
                    <div className="flex flex-wrap gap-3 items-center">
                        {gradients.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => setColor(g.id)}
                                className={cn(
                                    "w-8 h-8 rounded-full bg-gradient-to-br transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50",
                                    g.class,
                                    color === g.id && "ring-2 ring-black dark:ring-white scale-110"
                                )}
                            />
                        ))}
                        <div className="relative group">
                            <input
                                type="color"
                                value={color.startsWith('#') ? color : "#000000"}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer opacity-0 absolute inset-0 z-10"
                            />
                            <div className={cn(
                                "w-8 h-8 rounded-full border-2 border-dashed border-black/30 dark:border-white/30 flex items-center justify-center transition-transform group-hover:scale-110",
                                color.startsWith('#') && "border-solid border-white ring-2 ring-black dark:ring-white scale-110"
                            )} style={{ backgroundColor: color.startsWith('#') ? color : 'transparent' }}>
                                {!color.startsWith('#') && <span className="text-xs text-foreground/50">+</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {initialData ? "Save Changes" : "Create Course"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
