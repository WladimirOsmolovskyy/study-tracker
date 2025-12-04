"use client";

import { useEffect } from "react";
import { useSpotifyStore } from "@/store/useSpotifyStore";
import { Play, Pause, SkipBack, SkipForward, Music2 } from "lucide-react";
import Image from "next/image";

export function SpotifyPlayer() {
    const {
        accessToken,
        currentTrack,
        isPlaying,
        fetchPlaybackState,
        play,
        pause,
        next,
        previous,
        login,
        initializePlayer
    } = useSpotifyStore();

    useEffect(() => {
        if (accessToken) {
            initializePlayer();
            fetchPlaybackState();
            const interval = setInterval(fetchPlaybackState, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [accessToken, fetchPlaybackState, initializePlayer]);

    if (!accessToken) {
        return (
            <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-colors text-sm"
            >
                <Music2 className="w-4 h-4" />
                Connect Spotify
            </button>
        );
    }

    if (!currentTrack) {
        return (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/5">
                <div className="w-10 h-10 rounded bg-black/10 dark:bg-white/10 flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">Focus Flow</div>
                    <div className="text-xs text-muted-foreground">Ready to play</div>
                </div>
                <button
                    onClick={play}
                    className="p-2 rounded-full bg-foreground text-background hover:scale-105 transition-all"
                >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/5">
            {/* Album Art */}
            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                {currentTrack.album.images[0] ? (
                    <Image
                        src={currentTrack.album.images[0].url}
                        alt={currentTrack.album.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                        <Music2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-foreground">
                    {currentTrack.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                    {currentTrack.artists.map(a => a.name).join(", ")}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={previous}
                    className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-colors"
                >
                    <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button
                    onClick={isPlaying ? pause : play}
                    className="p-2 rounded-full bg-foreground text-background hover:scale-105 transition-all"
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                    ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                </button>

                <button
                    onClick={next}
                    className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-colors"
                >
                    <SkipForward className="w-4 h-4 fill-current" />
                </button>
            </div>
        </div>
    );
}
