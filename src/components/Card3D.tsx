import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { twMerge } from 'tailwind-merge';

interface Card3DProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export const Card3D: React.FC<Card3DProps> = ({
    children,
    className,
    glowColor = "rgba(6, 182, 212, 0.3)" // Default cyan glow
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [hovering, setHovering] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 30 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseXFromCenter = e.clientX - rect.left - width / 2;
        const mouseYFromCenter = e.clientY - rect.top - height / 2;

        x.set(mouseXFromCenter / width);
        y.set(mouseYFromCenter / height);
    };

    const handleMouseLeave = () => {
        setHovering(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseEnter = () => {
        setHovering(true);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={twMerge(
                "relative transition-all duration-200 ease-out",
                className
            )}
        >
            <div
                style={{ transform: "translateZ(20px)" }}
                className="relative z-10 h-full"
            >
                {children}
            </div>

            {/* Glow Effect */}
            <div
                className="absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none"
                style={{
                    opacity: hovering ? 1 : 0,
                    background: `radial-gradient(600px circle at ${mouseX.get() * 100 + 50}% ${mouseY.get() * 100 + 50}%, ${glowColor}, transparent 40%)`,
                    zIndex: 0
                }}
            />

            {/* Border Glow */}
            <div
                className="absolute inset-0 rounded-xl border border-white/10 transition-colors duration-300 pointer-events-none"
                style={{
                    borderColor: hovering ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"
                }}
            />
        </motion.div>
    );
};
