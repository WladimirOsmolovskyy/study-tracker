import { useState } from "react";
import { useStudyStore } from "@/store/useStudyStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Trash2, Check, Plus, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { semesters, activeSemesterId, addSemester, updateSemester, deleteSemester, setActiveSemester, settings, updateSettings } = useStudyStore();
    const [activeTab, setActiveTab] = useState<"general" | "semesters" | "eventTypes">("general");

    // Semester Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSemesterId, setEditingSemesterId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [breaks, setBreaks] = useState<{ id: string, startDate: string, endDate: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Event Types State
    const [newEventType, setNewEventType] = useState("");

    const resetSemesterForm = () => {
        setName("");
        setStartDate("");
        setEndDate("");
        setBreaks([]);
        setEditingSemesterId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (semester: any) => {
        setName(semester.name);
        setStartDate(new Date(semester.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(semester.endDate).toISOString().split('T')[0]);
        setBreaks((semester.breaks || []).map((b: any) => ({
            id: b.id,
            startDate: new Date(b.startDate).toISOString().split('T')[0],
            endDate: new Date(b.endDate).toISOString().split('T')[0]
        })));
        setEditingSemesterId(semester.id);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !startDate || !endDate) return;

        setIsLoading(true);
        try {
            const semesterData = {
                name,
                startDate: new Date(startDate).getTime(),
                endDate: new Date(endDate).getTime(),
                breaks: breaks.map(b => ({
                    id: b.id || crypto.randomUUID(),
                    startDate: new Date(b.startDate).getTime(),
                    endDate: new Date(b.endDate).getTime()
                }))
            };

            if (editingSemesterId) {
                await updateSemester(editingSemesterId, semesterData);
            } else {
                await addSemester(semesterData);
            }
            resetSemesterForm();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const addBreak = () => {
        setBreaks([...breaks, { id: crypto.randomUUID(), startDate: "", endDate: "" }]);
    };

    const removeBreak = (index: number) => {
        setBreaks(breaks.filter((_, i) => i !== index));
    };

    const updateBreak = (index: number, field: 'startDate' | 'endDate', value: string) => {
        const newBreaks = [...breaks];
        newBreaks[index] = { ...newBreaks[index], [field]: value };
        setBreaks(newBreaks);
    };

    // Event Type Handlers
    const handleAddEventType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventType.trim()) return;

        const currentTypes = settings?.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other'];
        if (currentTypes.includes(newEventType.trim())) return;

        await updateSettings({
            eventTypes: [...currentTypes, newEventType.trim()]
        });
        setNewEventType("");
    };

    const handleDeleteEventType = async (typeToDelete: string) => {
        const currentTypes = settings?.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other'];
        if (currentTypes.length <= 1) return; // Prevent deleting last type

        await updateSettings({
            eventTypes: currentTypes.filter(t => t !== typeToDelete)
        });
    };

    // Workday Handlers
    const toggleWorkday = async (day: number) => {
        const currentWorkdays = settings?.workdays || [1, 2, 3, 4, 5];
        let newWorkdays;
        if (currentWorkdays.includes(day)) {
            newWorkdays = currentWorkdays.filter(d => d !== day);
        } else {
            newWorkdays = [...currentWorkdays, day];
        }
        await updateSettings({ workdays: newWorkdays });
    };

    const daysOfWeek = [
        { id: 1, label: "Monday" },
        { id: 2, label: "Tuesday" },
        { id: 3, label: "Wednesday" },
        { id: 4, label: "Thursday" },
        { id: 5, label: "Friday" },
        { id: 6, label: "Saturday" },
        { id: 0, label: "Sunday" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-black/10 dark:border-white/10 pb-1">
                    <button
                        onClick={() => setActiveTab("general")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative top-[1px]",
                            activeTab === "general"
                                ? "text-brand-blue border-b-2 border-brand-blue"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab("semesters")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative top-[1px]",
                            activeTab === "semesters"
                                ? "text-brand-blue border-b-2 border-brand-blue"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Semesters
                    </button>
                    <button
                        onClick={() => setActiveTab("eventTypes")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative top-[1px]",
                            activeTab === "eventTypes"
                                ? "text-brand-blue border-b-2 border-brand-blue"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Event Types
                    </button>
                </div>

                {activeTab === "general" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground/70">Workdays</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {daysOfWeek.map((day) => {
                                    const isSelected = (settings?.workdays || [1, 2, 3, 4, 5]).includes(day.id);
                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleWorkday(day.id)}
                                            className={cn(
                                                "flex items-center justify-center px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                                isSelected
                                                    ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                                                    : "bg-background border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Selected days will be shown in the calendar views.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === "semesters" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground/70">My Semesters</h3>
                            {!isFormOpen && (
                                <Button size="sm" variant="ghost" onClick={() => setIsFormOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Semester
                                </Button>
                            )}
                        </div>

                        {isFormOpen && (
                            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 space-y-4 border border-black/10 dark:border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-foreground">{editingSemesterId ? "Edit Semester" : "New Semester"}</h4>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground/70">Semester Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Fall 2024"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground/70">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-4 py-2 bg-background border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground/70">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full px-4 py-2 bg-background border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all text-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Breaks Section */}
                                <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-foreground/70">Vacation / Breaks</label>
                                        <Button type="button" size="sm" variant="ghost" onClick={addBreak} className="h-6 text-xs">
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Break
                                        </Button>
                                    </div>

                                    {breaks.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">No breaks added. Weeks will be counted continuously.</p>
                                    )}

                                    <div className="space-y-2">
                                        {breaks.map((brk, index) => (
                                            <div key={brk.id || index} className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={brk.startDate}
                                                    onChange={e => updateBreak(index, 'startDate', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-background border border-black/10 dark:border-white/10 rounded-md focus:outline-none focus:border-brand-blue/50 text-foreground"
                                                    placeholder="Start"
                                                    required
                                                />
                                                <span className="text-muted-foreground">-</span>
                                                <input
                                                    type="date"
                                                    value={brk.endDate}
                                                    onChange={e => updateBreak(index, 'endDate', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 text-sm bg-background border border-black/10 dark:border-white/10 rounded-md focus:outline-none focus:border-brand-blue/50 text-foreground"
                                                    placeholder="End"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeBreak(index)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={resetSemesterForm}>Cancel</Button>
                                    <Button type="submit" isLoading={isLoading}>{editingSemesterId ? "Save Changes" : "Create Semester"}</Button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-2">
                            {semesters.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8 bg-black/5 dark:bg-white/5 rounded-xl border border-dashed border-black/10 dark:border-white/10">
                                    No semesters added yet.
                                </p>
                            ) : (
                                semesters.map(semester => (
                                    <div
                                        key={semester.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                            activeSemesterId === semester.id
                                                ? "bg-brand-blue/10 border-brand-blue/30 shadow-sm"
                                                : "bg-background/50 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                        )}
                                        onClick={() => setActiveSemester(semester.id)}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">{semester.name}</span>
                                                {activeSemesterId === semester.id && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue text-white font-medium shadow-sm shadow-brand-blue/20">Active</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span>{new Date(semester.startDate).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                                <span>{new Date(semester.endDate).toLocaleDateString()}</span>
                                                {semester.breaks && semester.breaks.length > 0 && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                                                        <span>{semester.breaks.length} Break{semester.breaks.length > 1 ? 's' : ''}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(semester);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm("Delete this semester?")) deleteSemester(semester.id);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                    !activeSemesterId
                                        ? "bg-brand-blue/10 border-brand-blue/30 shadow-sm"
                                        : "bg-background/50 border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                                onClick={() => setActiveSemester(null)}
                            >
                                <div className="font-medium text-foreground">Show All Time</div>
                                {!activeSemesterId && <Check className="w-5 h-5 text-brand-blue" />}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "eventTypes" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-foreground/70">Manage Event Types</h3>

                            <form onSubmit={handleAddEventType} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value)}
                                    placeholder="Add new type (e.g. Quiz, Project)"
                                    className="flex-1 px-4 py-2 bg-background border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                                />
                                <Button type="submit" disabled={!newEventType.trim()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </form>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(settings?.eventTypes || ['lecture', 'homework', 'exam', 'lab', 'other']).map((type) => (
                                    <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group">
                                        <span className="font-medium capitalize text-foreground">{type}</span>
                                        <button
                                            onClick={() => handleDeleteEventType(type)}
                                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Type"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                These types will appear in dropdowns when creating events and filtering views.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
