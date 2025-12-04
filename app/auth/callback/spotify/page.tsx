"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpotifyStore } from "@/store/useSpotifyStore";
import { Loader2 } from "lucide-react";

function SpotifyCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleCallback, error } = useSpotifyStore();
    const hasHandled = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");

        if (hasHandled.current) return;

        if (errorParam) {
            console.error("Spotify Auth Error:", errorParam);
            router.push("/focus"); // Redirect back on error
            return;
        }

        if (code) {
            hasHandled.current = true;
            handleCallback(code).then(() => {
                router.push("/focus"); // Redirect back on success
            });
        }
    }, [searchParams, handleCallback, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-500">Authentication Failed</h1>
                    <p>{error}</p>
                    <button
                        onClick={() => router.push("/focus")}
                        className="px-4 py-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20"
                    >
                        Return to Focus
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                <p className="text-muted-foreground">Connecting to Spotify...</p>
            </div>
        </div>
    );
}

export default function SpotifyCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <SpotifyCallbackContent />
        </Suspense>
    );
}
