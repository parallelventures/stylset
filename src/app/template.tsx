"use client";

import { motion } from "framer-motion";

export const springAnimation = {
    type: "spring" as const,
    damping: 20,
    stiffness: 100,
    mass: 0.8
};

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={springAnimation}
            style={{ width: "100%" }}
        >
            {children}
        </motion.div>
    );
}
