import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = typeof window !== 'undefined'
    ? `${window.location.origin.replace("localhost", "127.0.0.1")}/auth/callback/spotify`
    : "";
const SCOPES = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming" // For Web Playback SDK if we use it later
].join(" ");

const FOCUS_PLAYLIST_URI = "spotify:playlist:37i9dQZF1DX4hpot8sYudB";

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: typeof Spotify;
    }
}

interface SpotifyState {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    user: SpotifyApi.UserObjectPrivate | null;
    isPlaying: boolean;
    currentTrack: SpotifyApi.TrackObjectFull | null;
    deviceId: string | null;
    player: Spotify.Player | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: () => Promise<void>;
    handleCallback: (code: string) => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    initializePlayer: () => void;
    fetchPlaybackState: () => Promise<void>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    next: () => Promise<void>;
    previous: () => Promise<void>;
    logout: () => void;
}

// PKCE Helpers
const generateRandomString = (length: number) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const generateCodeChallenge = async (codeVerifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

export const useSpotifyStore = create<SpotifyState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            user: null,
            isPlaying: false,
            currentTrack: null,
            deviceId: null,
            player: null,
            isLoading: false,
            error: null,

            login: async () => {
                if (!CLIENT_ID) {
                    console.error("Missing NEXT_PUBLIC_SPOTIFY_CLIENT_ID");
                    set({ error: "Missing Client ID" });
                    return;
                }

                const codeVerifier = generateRandomString(128);
                const codeChallenge = await generateCodeChallenge(codeVerifier);

                localStorage.setItem('spotify_code_verifier', codeVerifier);

                const args = new URLSearchParams({
                    response_type: 'code',
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    redirect_uri: REDIRECT_URI,
                    code_challenge_method: 'S256',
                    code_challenge: codeChallenge
                });

                window.location.href = 'https://accounts.spotify.com/authorize?' + args;
            },

            handleCallback: async (code: string) => {
                const codeVerifier = localStorage.getItem('spotify_code_verifier');
                if (!codeVerifier) {
                    set({ error: "Missing code verifier" });
                    return;
                }

                set({ isLoading: true });

                try {
                    const body = new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: REDIRECT_URI,
                        client_id: CLIENT_ID,
                        code_verifier: codeVerifier
                    });

                    const response = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: body
                    });

                    if (!response.ok) {
                        throw new Error('Failed to exchange code');
                    }

                    const data = await response.json();
                    const expiresAt = Date.now() + data.expires_in * 1000;

                    set({
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                        expiresAt,
                        isLoading: false,
                        error: null
                    });

                    // Fetch user profile immediately
                    const { fetchPlaybackState, initializePlayer } = get();
                    await fetchPlaybackState();
                    initializePlayer();

                } catch (error) {
                    console.error("Spotify Auth Error:", error);
                    set({ error: "Authentication failed", isLoading: false });
                }
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get();
                if (!refreshToken || !CLIENT_ID) return;

                try {
                    const body = new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
                        client_id: CLIENT_ID
                    });

                    const response = await fetch('https://accounts.spotify.com/api/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: body
                    });

                    if (!response.ok) throw new Error('Failed to refresh token');

                    const data = await response.json();
                    const expiresAt = Date.now() + data.expires_in * 1000;

                    set({
                        accessToken: data.access_token,
                        expiresAt,
                        // Update refresh token if returned (sometimes it is)
                        refreshToken: data.refresh_token || refreshToken
                    });
                } catch (error) {
                    console.error("Token Refresh Error:", error);
                    set({ accessToken: null, refreshToken: null, error: "Session expired" });
                }
            },

            initializePlayer: () => {
                if (typeof window === 'undefined' || get().player) return;

                const script = document.createElement("script");
                script.src = "https://sdk.scdn.co/spotify-player.js";
                script.async = true;

                document.body.appendChild(script);

                window.onSpotifyWebPlaybackSDKReady = () => {
                    const player = new window.Spotify.Player({
                        name: 'Study Tracker Focus',
                        getOAuthToken: cb => { cb(get().accessToken || ''); },
                        volume: 0.5
                    });

                    player.addListener('ready', ({ device_id }) => {
                        console.log('Ready with Device ID', device_id);
                        set({ deviceId: device_id, player });
                    });

                    player.addListener('not_ready', ({ device_id }) => {
                        console.log('Device ID has gone offline', device_id);
                    });

                    player.addListener('player_state_changed', (state) => {
                        if (!state) return;
                        set({
                            isPlaying: !state.paused,
                            // @ts-ignore - SDK types are slightly different from API types
                            currentTrack: state.track_window.current_track,
                        });
                    });

                    player.connect();
                };
            },

            fetchPlaybackState: async () => {
                const { accessToken, refreshAccessToken, expiresAt } = get();
                if (!accessToken) return;

                // Check expiration
                if (expiresAt && Date.now() > expiresAt - 60000) {
                    await refreshAccessToken();
                }

                try {
                    const response = await fetch('https://api.spotify.com/v1/me/player', {
                        headers: {
                            'Authorization': `Bearer ${get().accessToken}`
                        }
                    });

                    if (response.status === 204) {
                        // No content, nothing playing
                        set({ isPlaying: false });
                        return;
                    }

                    if (!response.ok) throw new Error('Failed to fetch state');

                    const data = await response.json();
                    set({
                        isPlaying: data.is_playing,
                        currentTrack: data.item,
                        deviceId: data.device?.id
                    });
                } catch (error) {
                    console.error("Playback State Error:", error);
                }
            },

            play: async () => {
                const { accessToken, deviceId } = get();
                if (!accessToken) return;

                // If we have a local device, prefer it
                const deviceQuery = deviceId ? `?device_id=${deviceId}` : '';

                await fetch(`https://api.spotify.com/v1/me/player/play${deviceQuery}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: JSON.stringify({
                        context_uri: FOCUS_PLAYLIST_URI
                    })
                });
                set({ isPlaying: true });
            },

            pause: async () => {
                const { accessToken } = get();
                if (!accessToken) return;
                await fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                set({ isPlaying: false });
            },

            next: async () => {
                const { accessToken, fetchPlaybackState } = get();
                if (!accessToken) return;
                await fetch('https://api.spotify.com/v1/me/player/next', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                // Wait a bit for state to update
                setTimeout(fetchPlaybackState, 500);
            },

            previous: async () => {
                const { accessToken, fetchPlaybackState } = get();
                if (!accessToken) return;
                await fetch('https://api.spotify.com/v1/me/player/previous', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                setTimeout(fetchPlaybackState, 500);
            },

            logout: () => {
                set({
                    accessToken: null,
                    refreshToken: null,
                    expiresAt: null,
                    user: null,
                    isPlaying: false,
                    currentTrack: null
                });
                localStorage.removeItem('spotify_code_verifier');
            }
        }),
        {
            name: 'spotify-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                expiresAt: state.expiresAt
            }),
        }
    )
);
