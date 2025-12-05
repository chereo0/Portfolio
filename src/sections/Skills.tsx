import React from 'react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card3D } from '../components/Card3D';
import { skills, mainStack } from '../data';
import { motion } from 'framer-motion';

const SkillBar = ({ name, level }: { name: string, level: number, category?: string }) => (
    <div className="mb-6">
        <div className="flex justify-between mb-2">
            <span className="text-gray-300 font-medium">{name}</span>
            <span className="text-neon-cyan text-sm">{level}%</span>
        </div>
        <div className="h-3 bg-dark-bg rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${level}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue relative"
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </motion.div>
        </div>
    </div>
);

export const Skills: React.FC = () => {
    const categories = ["Frontend", "Backend", "Database", "Mobile"];

    return (
        <SectionWrapper id="skills" className="bg-dark-bg">
            <div className="grid lg:grid-cols-2 gap-16">
                <div>
                    <h2 className="text-neon-cyan font-medium mb-2">My Arsenal</h2>
                    <h3 className="text-3xl font-bold text-white mb-8">Technical Skills</h3>

                    <div className="space-y-8">
                        {categories.map((cat) => {
                            const catSkills = skills.filter(s => s.category === cat);
                            if (catSkills.length === 0) return null;

                            return (
                                <div key={cat}>
                                    <h4 className="text-xl text-white mb-4 border-l-4 border-neon-cyan pl-3">{cat}</h4>
                                    <div className="bg-card-bg/50 p-6 rounded-xl border border-white/5">
                                        {catSkills.map(skill => (
                                            <SkillBar key={skill.name} {...skill} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-12">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-6">Main Stack</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {mainStack.map((tech) => (
                                <Card3D key={tech.name} className="p-4 bg-card-bg rounded-xl border border-white/5 flex flex-col items-center justify-center gap-3 aspect-square group hover:border-neon-cyan/50">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {/* Icon placeholder - in real app use actual icons */}
                                        <span className="text-2xl font-bold text-neon-cyan">{tech.name[0]}</span>
                                    </div>
                                    <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{tech.name}</span>
                                </Card3D>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-card-bg to-dark-bg p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 blur-3xl rounded-full"></div>
                        <h3 className="text-xl font-bold text-white mb-4">Why MERN Stack?</h3>
                        <p className="text-gray-400 leading-relaxed mb-4">
                            I specialize in the MERN stack because it allows for building consistent, high-performance, and scalable full-stack applications using a single language—JavaScript.
                        </p>
                        <ul className="space-y-2 text-gray-400">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full"></span> Unified development experience
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full"></span> High performance & non-blocking I/O
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-neon-cyan rounded-full"></span> Rich ecosystem & community
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
