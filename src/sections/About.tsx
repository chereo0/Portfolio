import React from 'react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card3D } from '../components/Card3D';
import { education, certifications } from '../data';
import { GraduationCap, Award } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <SectionWrapper id="about" className="bg-dark-bg">
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-neon-cyan font-medium mb-2">About Me</h2>
                        <h3 className="text-3xl font-bold text-white mb-6">Education & Journey</h3>
                        <p className="text-gray-400 leading-relaxed">
                            My journey in technology started with a passion for solving complex problems.
                            I've pursued a Bachelor's in Computer Science while simultaneously building real-world applications.
                            I believe in continuous learning and staying updated with the latest industry trends.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                            <GraduationCap className="text-neon-cyan" /> Education
                        </h4>
                        <div className="space-y-4">
                            {education.map((edu) => (
                                <Card3D key={edu.id} className="p-6 bg-card-bg rounded-xl border border-white/5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <h5 className="text-lg font-medium text-white">{edu.degree}</h5>
                                        <span className="text-sm text-neon-cyan bg-neon-cyan/10 px-3 py-1 rounded-full w-fit">
                                            {edu.period}
                                        </span>
                                    </div>
                                    <p className="text-gray-400">{edu.institution}</p>
                                </Card3D>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Award className="text-neon-cyan" /> Certifications
                        </h4>
                        <div className="grid gap-4">
                            {certifications.map((cert, index) => (
                                <Card3D key={index} className="p-5 bg-card-bg rounded-xl border border-white/5 flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_10px_#06b6d4]"></div>
                                    <span className="text-gray-300">{cert}</span>
                                </Card3D>
                            ))}
                        </div>
                    </div>

                    {/* Optional: Add an image or more content here */}
                    <div className="relative h-64 rounded-2xl overflow-hidden border border-white/5 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg to-transparent z-10"></div>
                        {/* Placeholder for an abstract tech image */}
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                            Tech Visualization Placeholder
                        </div>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
