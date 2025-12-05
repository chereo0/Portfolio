import React from 'react';

import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'primary',
    size = 'md',
    ...props
}) => {
    const variants = {
        primary: "bg-neon-cyan text-dark-bg hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] border-transparent",
        outline: "bg-transparent border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
        ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-white/5 border-transparent"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-2.5 text-base",
        lg: "px-8 py-3 text-lg"
    };

    return (
        <button
            className={twMerge(
                "rounded-full font-medium transition-all duration-300 border flex items-center justify-center gap-2 active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
};
