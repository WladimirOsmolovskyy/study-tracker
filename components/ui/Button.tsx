import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    isLoading,
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-white text-black hover:bg-gray-100 border border-transparent shadow-lg shadow-black/5",
        secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md",
        ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-base",
        lg: "px-8 py-3.5 text-lg",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children as React.ReactNode}
        </motion.button>
    );
}
