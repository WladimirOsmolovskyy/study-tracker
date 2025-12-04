import { useState } from "react";
import { useStudyStore, Course } from "@/store/useStudyStore";
import { CourseCard } from "@/components/course/CourseCard";
import { Button } from "@/components/ui/Button";
import { Plus, GripVertical, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CourseGridProps {
    onAddClick: () => void;
}

function SortableCourseCard({ course, isReordering }: { course: Course; isReordering: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: course.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "relative" as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
            <CourseCard
                course={course}
                action={isReordering ? (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors touch-none"
                    >
                        <GripVertical className="w-4 h-4 text-foreground" />
                    </div>
                ) : undefined}
            />
        </div>
    );
}

export function CourseGrid({ onAddClick }: CourseGridProps) {
    const { courses, reorderCourses } = useStudyStore();
    const [isReordering, setIsReordering] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = courses.findIndex((c) => c.id === active.id);
            const newIndex = courses.findIndex((c) => c.id === over.id);
            reorderCourses(arrayMove(courses, oldIndex, newIndex));
        }
    };

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-medium text-foreground">No courses yet</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground/80">My Courses</h3>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsReordering(!isReordering)}
                        className={isReordering ? "bg-brand-blue/10 text-brand-blue" : "text-muted-foreground"}
                    >
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        {isReordering ? "Done" : "Reorder"}
                    </Button>
                    <Button onClick={onAddClick} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={courses.map(c => c.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {courses.map((course) => (
                            <SortableCourseCard key={course.id} course={course} isReordering={isReordering} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
