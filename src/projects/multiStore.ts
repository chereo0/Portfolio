import type { ProjectDetails } from '../types/project';

export const multiStoreProject: ProjectDetails = {
    id: 'multi-store-ecommerce',
    title: 'Multi-Store E-Commerce Platform',
    tagline: 'A scalable multi-vendor marketplace with independent store dashboards and unified checkout.',
    summary: 'This platform enables multiple vendors to create and manage their own stores within a single marketplace ecosystem. It provides a seamless shopping experience for customers who can purchase from different vendors in one cart, while giving admins comprehensive analytics and control over the entire platform.',
    role: [
        'Full Stack Developer – responsible for architecture, database design, REST APIs, and frontend UX.',
        'Implemented multi-store cart functionality allowing mixed orders.',
        'Designed independent vendor dashboards for product and order management.',
        'Built the super-admin panel for platform-wide analytics and user management.'
    ],
    keyFeatures: [
        'Modular React frontend with reusable components.',
        'Role-based authentication (Admin, Vendor, Customer).',
        'Multi-store management and independent vendor dashboards.',
        'Unified shopping cart across multiple vendors.',
        'Cloudinary integration for optimized product image storage.',
        'Responsive design with dark/light theme support.',
        'RESTful Node.js/Express API with JWT authentication.'
    ],
    technologies: [
        { name: 'React', level: 100 },
        { name: 'Node.js', level: 100 },
        { name: 'Express', level: 100 },
        { name: 'MongoDB', level: 100 },
        { name: 'Tailwind CSS', level: 90 },
        { name: 'JWT', level: 100 },
        { name: 'Cloudinary', level: 80 }
    ],
    techIcons: ['react', 'node', 'express', 'mongodb', 'tailwind'],
    architecture: {
        client: 'React / Vite',
        server: 'Node.js / Express API',
        database: 'MongoDB Atlas',
        services: ['Cloudinary (Images)', 'JWT (Auth)']
    },
    repoLink: 'https://github.com/chereo0', // Placeholder as per prompt instruction to search profile
    demoLink: '#',
    image: '/multi.jpg'
};
