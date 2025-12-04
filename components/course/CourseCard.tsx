import { useStudyStore, Course } from "@/store/useStudyStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

import { useRouter } from "next/navigation";

interface CourseCardProps {
    course: Course;
    onClick?: () => void;
    action?: React.ReactNode;
}

const gradients: Record<string, string> = {
    blue: "from-blue-500 to-cyan-400",
    pink: "from-pink-500 to-rose-400",
    purple: "from-purple-500 to-indigo-400",
    orange: "from-orange-500 to-amber-400",
    green: "from-emerald-500 to-teal-400",
};

export function CourseCard({ course, onClick, action }: CourseCardProps) {
    const router = useRouter();
    const { semesters } = useStudyStore();
    const isCustomColor = course.color.startsWith('#');
    const gradient = !isCustomColor ? (gradients[course.color] || gradients.blue) : "";

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push(`/course/${course.id}`);
        }
    };

    const semesterName = semesters.find(s => s.id === course.semesterId)?.name || "Unknown Semester";

    return (
        <GlassCard
            className="cursor-pointer group flex flex-col gap-4 min-h-[180px] transition-all duration-75"
            onMouseEnter={(e) => {
                const color = isCustomColor ? course.color : getHexForGradient(course.color);
                e.currentTarget.style.borderColor = color;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
            }}
            onClick={handleClick}
        >
            <div
                className={cn(
                    "absolute top-0 left-0 w-full h-1 opacity-80 transition-all duration-75 group-hover:opacity-100 group-hover:h-1.5",
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
                    <h3
                        className="text-xl font-bold leading-tight transition-colors text-foreground group-hover:text-[var(--hover-color)]"
                        style={{
                            // @ts-ignore
                            "--hover-color": isCustomColor ? course.color : getHexForGradient(course.color)
                        }}
                    >
                        {course.title}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {action}

                </div>
            </div>

            <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{semesterName}</span>
            </div>
        </GlassCard>
    );
}

// Helper to get a hex color for the predefined gradients to use in shadows
function getHexForGradient(colorName: string) {
    const colors: Record<string, string> = {
        blue: "#3b82f6",
        pink: "#ec4899",
        purple: "#a855f7",
        orange: "#f97316",
        green: "#10b981",
    };
    return colors[colorName] || colors.blue;
}
