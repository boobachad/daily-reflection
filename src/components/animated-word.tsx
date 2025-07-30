"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const adjectives = [
    "Im-Perfect",
    "Productive",
    "Balanced",
    "Focused",
    "Mindful"
];

export function AnimatedWord() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % adjectives.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className="inline-block relative h-[58px] w-[280px] text-center">
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute left-0 right-0 text-sky-600"
                >
                    {adjectives[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}