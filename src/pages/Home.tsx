import React from 'react';
import { ScrollJourney } from '../journey/ScrollJourney';
import { Contact } from '../sections/Contact';
import { Footer } from '../components/Footer';

export const Home: React.FC = () => {
    return (
        <div className="bg-dark-bg min-h-screen text-white selection:bg-neon-cyan/30 selection:text-white">
            <ScrollJourney />
            <main>
                <Contact />
            </main>
            <Footer />
        </div>
    );
};
