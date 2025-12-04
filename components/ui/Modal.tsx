import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "./GlassCard";
import { Button } from "./Button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, headerAction, maxWidth = "max-w-lg" }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className={`relative w-full ${maxWidth} z-10`}
                    >
                        <GlassCard className="w-full max-h-[90vh] overflow-y-auto flex flex-col gap-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                                <div className="flex items-center gap-2">
                                    {headerAction}
                                    <Button variant="ghost" size="sm" onClick={onClose} className="!p-2">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                            {children}
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
