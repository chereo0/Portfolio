import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Menu, X, Download } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';

const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Experience', href: '#experience' },
    { name: 'Contact', href: '#contact' },
];

export const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    // Lock body scroll when mobile menu is open
    React.useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const scrollToSection = (href: string) => {
        setIsMobileMenuOpen(false);
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={clsx(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 backdrop-blur-md",
                isScrolled ? "bg-dark-bg/80 border-b border-white/5 py-4" : "bg-transparent py-6"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <a href="#" className="text-2xl font-bold tracking-tighter text-white group relative z-[101]">
                    <span className="text-neon-cyan">A</span>A
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-cyan transition-all group-hover:w-full"></span>
                </a>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <ul className="flex gap-6">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <button
                                    onClick={() => scrollToSection(link.href)}
                                    className="text-sm font-medium text-gray-300 hover:text-neon-cyan transition-colors relative group"
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-neon-cyan transition-all group-hover:w-full"></span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <a href="/AbdelrmanCV.pdf" download="Abdelrman_Anani_CV.pdf">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download size={16} />
                            CV
                        </Button>
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white relative z-[101] p-2 -mr-2 hover:text-neon-cyan transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[90] bg-dark-bg/98 backdrop-blur-xl md:hidden flex flex-col items-center justify-center h-[100dvh]"
                    >
                        <ul className="flex flex-col gap-8 text-center">
                            {navLinks.map((link, i) => (
                                <motion.li
                                    key={link.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.1 }}
                                >
                                    <button
                                        onClick={() => scrollToSection(link.href)}
                                        className="text-3xl font-bold text-white hover:text-neon-cyan transition-colors"
                                    >
                                        {link.name}
                                    </button>
                                </motion.li>
                            ))}
                            <motion.li
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + navLinks.length * 0.1 }}
                            >
                                <a
                                    href="/AbdelrmanCV.pdf"
                                    download="Abdelrman_Anani_CV.pdf"
                                    className="w-full"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button variant="outline" className="w-full justify-center gap-2 mt-4 px-8 py-3 text-lg">
                                        <Download size={20} />
                                        Download CV
                                    </Button>
                                </a>
                            </motion.li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};
