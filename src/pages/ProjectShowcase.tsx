import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Github, CheckCircle2, Server, Database, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card3D } from '../components/Card3D';
import { Button } from '../components/Button';
import { SectionWrapper } from '../components/SectionWrapper';
import type { ProjectDetails } from '../types/project';

interface ProjectShowcaseProps {
    project: ProjectDetails;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ project }) => {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [project.id]);

    return (
        <div className="bg-dark-bg min-h-screen text-white selection:bg-neon-cyan/30 selection:text-white">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-neon-cyan/5 blur-3xl rounded-full transform translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-neon-blue/5 blur-3xl rounded-full transform -translate-x-1/3"></div>
                    </div>

                    <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <Link to="/#projects" className="inline-flex items-center text-gray-400 hover:text-neon-cyan transition-colors mb-4">
                                <ArrowLeft size={16} className="mr-2" /> Back to Projects
                            </Link>

                            <div>
                                <span className="text-neon-cyan font-medium tracking-wider text-sm uppercase">Project Showcase</span>
                                <h1 className="text-4xl md:text-6xl font-bold text-white mt-2 mb-4 leading-tight">
                                    {project.title}
                                </h1>
                                <p className="text-xl text-gray-300 font-light leading-relaxed border-l-4 border-neon-cyan pl-4">
                                    {project.tagline}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button variant="outline" onClick={() => window.open(project.repoLink, '_blank')}>
                                    <Github size={18} /> GitHub Repo
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1 }}
                            className="perspective-1000"
                        >
                            <Card3D className="w-full aspect-video bg-card-bg rounded-xl border border-white/10 overflow-hidden shadow-2xl group">
                                <div className="relative w-full h-full">
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent z-10"></div>
                                    {/* Placeholder for project screenshot */}
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-neon-cyan/10 animate-pulse"></div>
                                        <img src={project.image} alt={project.title} className="w-full h-full object-cover relative z-10" />
                                    </div>

                                    {/* Floating UI Elements for 3D feel */}
                                    <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs text-neon-cyan">
                                            v1.0.0
                                        </div>
                                        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs text-white">
                                            Production Ready
                                        </div>
                                    </div>
                                </div>
                            </Card3D>
                        </motion.div>
                    </div>
                </section>

                {/* Details Grid */}
                <SectionWrapper id="details" className="bg-dark-bg/50">
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Left Column: Summary & Role */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card3D className="p-8 bg-card-bg rounded-2xl border border-white/5">
                                <h3 className="text-2xl font-bold text-white mb-4">Project Summary</h3>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    {project.summary}
                                </p>

                                <h4 className="text-lg font-semibold text-white mb-3">My Role</h4>
                                <ul className="space-y-2">
                                    {project.role.map((r, i) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-400">
                                            <span className="mt-1.5 w-1.5 h-1.5 bg-neon-cyan rounded-full flex-shrink-0"></span>
                                            <span>{r}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card3D>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Technologies */}
                                <Card3D className="p-6 bg-card-bg rounded-2xl border border-white/5 h-full">
                                    <h3 className="text-xl font-bold text-white mb-6">Technologies Used</h3>
                                    <div className="space-y-4">
                                        {project.technologies.map((tech) => (
                                            <div key={tech.name}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-gray-300">{tech.name}</span>
                                                    <span className="text-xs text-neon-cyan">{tech.level}%</span>
                                                </div>
                                                <div className="h-2 bg-dark-bg rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${tech.level}%` }}
                                                        transition={{ duration: 1, delay: 0.2 }}
                                                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-3">
                                        {project.techIcons.map((icon) => (
                                            <div key={icon} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400" title={icon}>
                                                {icon[0].toUpperCase()}
                                            </div>
                                        ))}
                                    </div>
                                </Card3D>

                                {/* Architecture */}
                                <Card3D className="p-6 bg-card-bg rounded-2xl border border-white/5 h-full">
                                    <h3 className="text-xl font-bold text-white mb-6">Architecture Diagram</h3>
                                    <div className="flex flex-col items-center justify-center h-full gap-4 py-4">
                                        <div className="w-full p-3 bg-dark-bg border border-neon-cyan/30 rounded-lg text-center relative group">
                                            <div className="flex items-center justify-center gap-2 text-neon-cyan mb-1">
                                                <Globe size={16} /> <span className="font-bold text-sm">Client</span>
                                            </div>
                                            <div className="text-xs text-gray-400">{project.architecture.client}</div>
                                            <div className="absolute -bottom-4 left-1/2 w-0.5 h-4 bg-white/20"></div>
                                            <div className="absolute -bottom-2 left-1/2 w-2 h-2 border-r border-b border-white/20 rotate-45 -translate-x-1/2"></div>
                                        </div>

                                        <div className="w-full p-3 bg-dark-bg border border-neon-blue/30 rounded-lg text-center relative z-10">
                                            <div className="flex items-center justify-center gap-2 text-neon-blue mb-1">
                                                <Server size={16} /> <span className="font-bold text-sm">Server</span>
                                            </div>
                                            <div className="text-xs text-gray-400">{project.architecture.server}</div>
                                            <div className="absolute -bottom-4 left-1/2 w-0.5 h-4 bg-white/20"></div>
                                            <div className="absolute -bottom-2 left-1/2 w-2 h-2 border-r border-b border-white/20 rotate-45 -translate-x-1/2"></div>
                                        </div>

                                        <div className="w-full p-3 bg-dark-bg border border-purple-500/30 rounded-lg text-center">
                                            <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
                                                <Database size={16} /> <span className="font-bold text-sm">Database</span>
                                            </div>
                                            <div className="text-xs text-gray-400">{project.architecture.database}</div>
                                        </div>
                                    </div>
                                </Card3D>
                            </div>
                        </div>

                        {/* Right Column: Key Features */}
                        <div className="lg:col-span-1">
                            <Card3D className="p-8 bg-card-bg rounded-2xl border border-white/5 h-full sticky top-24">
                                <h3 className="text-2xl font-bold text-white mb-6">Key Features</h3>
                                <ul className="space-y-4">
                                    {project.keyFeatures.map((feature, i) => (
                                        <li key={i} className="flex gap-3 text-gray-300 group">
                                            <CheckCircle2 className="text-neon-cyan flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" size={20} />
                                            <span className="text-sm leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card3D>
                        </div>

                    </div>
                </SectionWrapper>
            </main>

            <Footer />
        </div>
    );
};
