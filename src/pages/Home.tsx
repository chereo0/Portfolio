import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Experience } from '../sections/Experience';
import { Skills } from '../sections/Skills';
import { Projects } from '../sections/Projects';
import { Contact } from '../sections/Contact';

export const Home: React.FC = () => {
    return (
        <div className="bg-dark-bg min-h-screen text-white selection:bg-neon-cyan/30 selection:text-white">
            <Navbar />
            <main>
                <Hero />
                <About />
                <Projects />
                <Skills />
                <Experience />
                <Contact />
            </main>
            <Footer />
        </div>
    );
};
