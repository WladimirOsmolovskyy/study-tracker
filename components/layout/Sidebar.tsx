"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStudyStore } from "@/store/useStudyStore";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LogOut, BookOpen, Timer, Settings, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { SettingsModal } from "@/components/dashboard/SettingsModal";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setUser } = useStudyStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    return (
        <aside className="w-64 h-screen sticky top-0 border-r border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-xl p-6 flex flex-col gap-8 hidden md:flex z-50">
            {/* Logo */}


            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-base font-medium",
                        pathname === "/"
                            ? "bg-black/5 dark:bg-white/5 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => router.push("/")}
                >
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Dashboard
                </Button>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-base font-medium",
                        pathname === "/focus"
                            ? "bg-black/5 dark:bg-white/5 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => router.push("/focus")}
                >
                    <Timer className="w-5 h-5 mr-3" />
                    Focus Mode
                </Button>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-base font-medium",
                        pathname === "/matrix"
                            ? "bg-black/5 dark:bg-white/5 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => router.push("/matrix")}
                >
                    <CalendarDays className="w-5 h-5 mr-3" />
                    Matrix
                </Button>
            </nav>

            {/* Footer Actions */}
            <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-muted-foreground">Theme</span>
                    <ThemeToggle />
                </div>

                {user ? (
                    <div className="space-y-3">
                        <div className="px-2">
                            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground">Student</p>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={() => setIsSettingsOpen(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Account Settings
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={handleSignOut}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            router.push("/?login=true");
                        }}
                    >
                        Sign In
                    </Button>
                )}
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </aside>
    );
}
