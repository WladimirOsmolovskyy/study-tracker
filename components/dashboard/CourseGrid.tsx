import { useStudyStore } from "@/store/useStudyStore";
import { CourseCard } from "@/components/course/CourseCard";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface CourseGridProps {
    onAddClick: () => void;
}

export function CourseGrid({ onAddClick }: CourseGridProps) {
    const courses = useStudyStore((state) => state.courses);

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-white/5 border border-white/10">
                    <Plus className="w-8 h-8 text-white/50" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-medium text-white">No courses yet</h3>
                    <p className="text-white/50 max-w-xs mx-auto">
                        Get started by adding your first course to track events and progress.
                    </p>
                </div>
                <Button onClick={onAddClick} variant="secondary">
                    Add Course
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                />
            ))}

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddClick}
                className="min-h-[180px] rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/70 transition-all"
            >
                <Plus className="w-8 h-8" />
                <span className="font-medium">Add New Course</span>
            </motion.button>
        </div>
    );
}
