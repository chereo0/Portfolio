import React, { useState } from 'react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card3D } from '../components/Card3D';
import { Button } from '../components/Button';
import { projects } from '../data';
import { ExternalLink, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Projects: React.FC = () => {
    const [filter, setFilter] = useState("All");
    const categories = ["All", "E-Commerce", "Delivery", "Multi-Vendor"];

    const filteredProjects = filter === "All"
        ? projects
        : projects.filter(p => p.tags.includes(filter));

    return (
        <SectionWrapper id="projects" className="bg-dark-bg/50">
            <div className="text-center mb-16">
                <h2 className="text-neon-cyan font-medium mb-2">My Work</h2>
                <h3 className="text-3xl font-bold text-white mb-8">Featured Projects</h3>

                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === cat
                                ? 'bg-neon-cyan text-dark-bg shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredProjects.map((project) => (
                        <motion.div
                            key={project.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card3D className="h-full bg-card-bg rounded-xl border border-white/5 overflow-hidden group">
                                <div className="h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-card-bg to-transparent z-10 opacity-60"></div>
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="text-xs font-medium bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded border border-white/10">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">{project.title}</h4>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {project.tech.slice(0, 4).map(t => (
                                            <span key={t} className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-neon-cyan rounded-full"></span> {t}
                                            </span>
                                        ))}
                                        {project.tech.length > 4 && <span className="text-xs text-gray-500">+{project.tech.length - 4} more</span>}
                                    </div>

                                    <div className="flex gap-3 mt-auto">
                                        <Link to={`/projects/${project.slug}`} className="flex-1">
                                            <Button size="sm" className="w-full gap-2 text-xs">
                                                <ExternalLink size={14} /> View Details
                                            </Button>
                                        </Link>
                                        <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs">
                                            <Github size={14} /> Code
                                        </Button>
                                    </div>
                                </div>
                            </Card3D>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </SectionWrapper>
    );
};
