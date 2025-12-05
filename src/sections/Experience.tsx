import React from 'react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card3D } from '../components/Card3D';
import { experience } from '../data';
import { Briefcase } from 'lucide-react';

export const Experience: React.FC = () => {
    return (
        <SectionWrapper id="experience" className="bg-dark-bg/50">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-neon-cyan font-medium mb-2">My Journey</h2>
                    <h3 className="text-3xl font-bold text-white">Work Experience</h3>
                </div>

                <div className="relative space-y-12">
                    {/* Vertical Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan/50 via-neon-cyan/20 to-transparent transform -translate-x-1/2 hidden md:block"></div>

                    {experience.map((job, index) => (
                        <div key={job.id} className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                            {/* Timeline Dot */}
                            <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-neon-cyan rounded-full shadow-[0_0_15px_#06b6d4] transform -translate-x-1/2 mt-6 hidden md:block z-10 border-2 border-dark-bg"></div>

                            {/* Content */}
                            <div className="md:w-1/2">
                                <Card3D className="p-6 bg-card-bg rounded-xl border border-white/5 hover:border-neon-cyan/30 transition-colors group">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors">{job.role}</h4>
                                            <Briefcase size={18} className="text-gray-500" />
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-neon-blue font-medium">{job.company}</span>
                                            <span className="text-gray-500">{job.period}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                        {job.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {job.tech.map((tech) => (
                                            <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-300 border border-white/5">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </Card3D>
                            </div>

                            {/* Empty space for the other side */}
                            <div className="md:w-1/2 hidden md:block"></div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};
