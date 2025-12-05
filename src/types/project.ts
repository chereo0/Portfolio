export interface ProjectDetails {
    id: string;
    title: string;
    tagline: string;
    summary: string;
    role: string[];
    keyFeatures: string[];
    technologies: {
        name: string;
        level: number; // 0-100
    }[];
    techIcons: string[]; // Just names for now, mapped to icons in component
    architecture: {
        client: string;
        server: string;
        database: string;
        services?: string[];
    };
    repoLink: string;
    demoLink?: string;
    image: string; // Placeholder or path
}
