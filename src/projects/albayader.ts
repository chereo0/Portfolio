import type { ProjectDetails } from '../types/project';

export const albayaderProject: ProjectDetails = {
    id: 'albayader-bakery',
    title: 'AlBayader Bakery Management',
    tagline: 'Comprehensive bakery management system with delivery tracking and driver dashboards.',
    summary: 'A complete digital solution for AlBayader Bakery, featuring a customer-facing storefront for ordering, an admin dashboard for inventory and order management, and a dedicated driver interface for real-time delivery tracking and status updates.',
    role: [
        'Full Stack Developer – built the entire system from scratch.',
        'Developed the driver dashboard with route assignment logic.',
        'Implemented real-time order status updates.',
        'Designed the product catalog and cart system.'
    ],
    keyFeatures: [
        'Customer storefront with product listings and cart.',
        'Admin dashboard for inventory and order management.',
        'Dedicated driver dashboard for delivery tracking.',
        'Real-time order status updates (Pending, Baking, Out for Delivery, Delivered).',
        'Secure customer authentication and order history.',
        'Responsive design optimized for mobile use by drivers.',
        'RESTful API backend with MongoDB.'
    ],
    technologies: [
        { name: 'React', level: 100 },
        { name: 'Vite', level: 100 },
        { name: 'Node.js', level: 90 },
        { name: 'Express', level: 90 },
        { name: 'MongoDB', level: 90 },
        { name: 'Tailwind CSS', level: 95 },
        { name: 'JWT', level: 100 }
    ],
    techIcons: ['react', 'vite', 'node', 'express', 'mongodb', 'tailwind'],
    architecture: {
        client: 'React / Vite (Web & Mobile Web)',
        server: 'Node.js / Express API',
        database: 'MongoDB Atlas',
        services: ['JWT (Auth)']
    },
    repoLink: 'https://github.com/chereo0/bayader-bakery.git',
    demoLink: '#',
    image: '/bayader.png'
};
