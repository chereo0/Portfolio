import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SectionWrapperProps {
    children: React.ReactNode;
    id: string;
    className?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ children, id, className }) => {
    return (
        <section id={id} className={clsx("py-20 min-h-screen flex items-center justify-center relative overflow-hidden", className)}>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="container mx-auto px-4 z-10 relative"
            >
                {children}
            </motion.div>
        </section>
    );
};
