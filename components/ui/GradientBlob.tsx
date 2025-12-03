"use client";

import { motion } from "framer-motion";

export function GradientBlob() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute inset-0 bg-background opacity-90" />
            <motion.div
                className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-blue/20 rounded-full blur-[60px] dark:opacity-30 will-change-transform"
                animate={{
                    transform: [
                        "translate(0px, 0px) scale(1)",
                        "translate(50px, 20px) scale(1.1)",
                        "translate(0px, 0px) scale(1)"
                    ]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <motion.div
                className="absolute top-[20%] right-[-10%] w-[30vw] h-[30vw] bg-brand-pink/20 rounded-full blur-[60px] dark:opacity-30 will-change-transform"
                animate={{
                    transform: [
                        "translate(0px, 0px) scale(1)",
                        "translate(-30px, 40px) scale(1.05)",
                        "translate(0px, 0px) scale(1)"
                    ]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 1,
                }}
            />
            <motion.div
                className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-brand-cyan/15 rounded-full blur-[60px] dark:opacity-30 will-change-transform"
                animate={{
                    transform: [
                        "translate(0px, 0px) scale(1)",
                        "translate(30px, -30px) scale(1.1)",
                        "translate(0px, 0px) scale(1)"
                    ]
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 2,
                }}
            />
        </div>
    );
}
