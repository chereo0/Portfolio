import type { ProjectDetails } from '../types/project';

export const beautyProject: ProjectDetails = {
    id: 'beauty-cosmetics',
    title: 'Beauty & Cosmetic E-Commerce',
    tagline: 'Modern beauty products store with advanced filtering and inventory management.',
    summary: 'A stylish and responsive e-commerce platform dedicated to beauty and cosmetic products. It features a rich product catalog with advanced filtering, wishlist functionality, and a comprehensive admin panel for managing inventory, variants, and discounts.',
    role: [
        'Full Stack Developer – responsible for end-to-end development.',
        'Implemented complex product filtering and search functionality.',
        'Built the admin panel for product uploads and variant management.',
        'Integrated Cloudinary for high-quality product image management.'
    ],
    keyFeatures: [
        'Advanced product filtering (Category, Brand, Price, Skin Type).',
        'Wishlist and Shopping Cart functionality.',
        'Product variants (Shades, Sizes) support.',
        'Admin panel for inventory, discounts, and order tracking.',
        'Cloudinary integration for product image optimization.',
        'Responsive and aesthetically pleasing UI.',
        'Secure user authentication and profile management.'
    ],
    technologies: [
        { name: 'React', level: 100 },
        { name: 'Node.js', level: 90 },
        { name: 'Express', level: 90 },
        { name: 'MongoDB', level: 90 },
        { name: 'Tailwind CSS', level: 95 },
        { name: 'Cloudinary', level: 85 }
    ],
    techIcons: ['react', 'node', 'express', 'mongodb', 'tailwind'],
    architecture: {
        client: 'React / Vite',
        server: 'Node.js / Express API',
        database: 'MongoDB Atlas',
        services: ['Cloudinary (Images)', 'JWT (Auth)']
    },
    repoLink: 'https://github.com/chereo0/brah.git',
    demoLink: '#',
    image: '/cosmatic.png'
};
