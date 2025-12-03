import { Course } from "@/store/useStudyStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
}

const gradients: Record<string, string> = {
    blue: "from-blue-500 to-cyan-400",
    pink: "from-pink-500 to-rose-400",
    purple: "from-purple-500 to-indigo-400",
    orange: "from-orange-500 to-amber-400",
    green: "from-emerald-500 to-teal-400",
};

export function CourseCard({ course, onClick }: CourseCardProps) {
    const router = useRouter();
    const isCustomColor = course.color.startsWith('#');
    const gradient = !isCustomColor ? (gradients[course.color] || gradients.blue) : "";

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push(`/course/${course.id}`);
        }
    };

    return (
        <GlassCard
            className="cursor-pointer group flex flex-col gap-4 min-h-[180px]"
            onClick={handleClick}
        >
            <div
                className={cn(
                    "absolute top-0 left-0 w-full h-1 opacity-80",
                    !isCustomColor && "bg-gradient-to-r",
                    gradient
                )}
                style={isCustomColor ? { backgroundColor: course.color } : {}}
            />

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <span
                        className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            !isCustomColor && "bg-clip-text text-transparent bg-gradient-to-r",
                            gradient
                        )}
                        style={isCustomColor ? { color: course.color } : {}}
                    >
                        {course.code}
                    </span>
                    <h3 className="text-xl font-bold leading-tight group-hover:text-brand-blue transition-colors text-foreground">
                        {course.title}
                    </h3>
                </div>
                <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    <BookOpen className="w-4 h-4 text-black/70 dark:text-white/70" />
                </div>
            </div>

            <div className="mt-auto flex items-center gap-2 text-sm text-black/50 dark:text-white/50">
                <Calendar className="w-4 h-4" />
                <span>{course.semester}</span>
            </div>
        </GlassCard>
    );
}
