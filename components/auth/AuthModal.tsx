import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isSignUp ? "Create Account" : "Welcome Back"}>
            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="pt-2 flex flex-col gap-3">
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                        {isSignUp ? "Sign Up" : "Log In"}
                    </Button>

                    <div className="text-center text-sm text-white/50">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-brand-blue hover:underline"
                        >
                            {isSignUp ? "Log In" : "Sign Up"}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
