import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-dark-bg border-t border-white/5 py-8 text-center">
            <div className="container mx-auto px-4">
                <p className="text-gray-400 text-sm">
                    © {new Date().getFullYear()} Abdelrhman Anani. Built with <span className="text-neon-cyan">React</span> & <span className="text-neon-blue">Vite</span>.
                </p>
            </div>
        </footer>
    );
};
