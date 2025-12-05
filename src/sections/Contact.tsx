import React, { useState } from 'react';
import { SectionWrapper } from '../components/SectionWrapper';
import { Card3D } from '../components/Card3D';
import { Button } from '../components/Button';
import { personalInfo } from '../data';
import { Mail, MapPin, Send, Github, Linkedin, Phone } from 'lucide-react';

export const Contact: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        alert('Message sent! (Check console)');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <SectionWrapper id="contact" className="bg-dark-bg">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-neon-cyan font-medium mb-2">Get in Touch</h2>
                    <h3 className="text-3xl font-bold text-white mb-6">Let's Work Together</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        I'm currently available for freelance projects and full-time opportunities.
                        If you have a project that needs some creative touch, or just want to say hi, feel free to drop a message.
                    </p>

                    <div className="space-y-6">
                        <Card3D className="p-6 bg-card-bg rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                                <Mail />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Email</h4>
                                <p className="text-gray-400">{personalInfo.email}</p>
                            </div>
                        </Card3D>

                        <Card3D className="p-6 bg-card-bg rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                                <MapPin />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Location</h4>
                                <p className="text-gray-400">{personalInfo.location}</p>
                            </div>
                        </Card3D>

                        <div className="flex gap-4 mt-8">
                            <Button variant="outline" size="sm" onClick={() => window.open(personalInfo.socials.github, '_blank')}>
                                <Github size={18} />
                            </Button>
                            <Button variant="outline" size="sm">
                                <Linkedin size={18} />
                            </Button>
                            <Button variant="outline" size="sm">
                                <Phone size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                <Card3D className="bg-card-bg p-8 rounded-2xl border border-white/5 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-400 mb-2">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                                placeholder="Project Inquiry"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full bg-dark-bg border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-colors resize-none"
                                placeholder="Tell me about your project..."
                            ></textarea>
                        </div>
                        <Button type="submit" className="w-full justify-center gap-2">
                            <Send size={18} /> Send Message
                        </Button>
                    </form>
                </Card3D>
            </div>
        </SectionWrapper>
    );
};
