import { personalInfo, projects, skills, experience } from '../data';

export type Vec3 = [number, number, number];

/** A camera keyframe. Between two keyframes the camera eases (smoothstep);
 *  two keyframes with nearly the same position create a "hold". */
export interface CameraKey {
    p: number;
    pos: Vec3;
    look: Vec3;
    roll?: number;
    fog: string;
    density: number;
}

export interface Chapter {
    id: string;
    group: number; // index into `groups` (bottom strip)
    start: number;
    end: number;
    eyebrow?: string;
    title?: string;
    caption?: string;
    whisper?: string; // centered, small text (interludes)
    mini?: { image: string; label: string };
    cta?: { label: string; href: string; external?: boolean };
}

export interface ChapterGroup {
    numeral: string;
    label: string;
    sub: string;
    thumb?: string;
    start: number;
    end: number;
}

/* ---------------------------------------------------------------- world layout */

export const PORTRAIT_POS: Vec3 = [0, 0, -10];

export const PROJECT_FRAMES = projects.map((proj, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const rotY = -side * 0.35;
    const pos: Vec3 = [side * 4, i === 1 ? 0.3 : 0, -32 - i * 20];
    // camera viewing spot: 7 units in front of the frame along its normal
    const view: Vec3 = [pos[0] + Math.sin(rotY) * 7, pos[1], pos[2] + Math.cos(rotY) * 7];
    return { proj, pos, rotY, view };
});

export const SKILL_TUNNEL = { zStart: -100, zEnd: -142, radius: 4.2 };

export const EXPERIENCE_SLABS = experience.map((exp, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const pos: Vec3 = [side * 3, 0, -158 - i * 12];
    const rotY = -side * 0.3;
    const view: Vec3 = [pos[0] + Math.sin(rotY) * 6, 0.2, pos[2] + Math.cos(rotY) * 6];
    return { exp, pos, rotY, view };
});

export const GALLERY = { z: -215, backWall: -228, width: 32, height: 13 };

/* ---------------------------------------------------------------- camera path */

const WARM = '#2b2118';
const DUSK = '#17120f';
const NIGHT = '#07060a';

export const CAMERA_KEYS: CameraKey[] = [
    { p: 0.0, pos: [0, 0, 9], look: PORTRAIT_POS, fog: WARM, density: 0.018 },
    { p: 0.05, pos: [0, 0, 1.5], look: PORTRAIT_POS, fog: WARM, density: 0.018 },
    { p: 0.11, pos: [0, 0, -14], look: [0, 0, -30], fog: DUSK, density: 0.03 },
];

PROJECT_FRAMES.forEach((f, i) => {
    const base = 0.15 + i * 0.12;
    const drift: Vec3 = [f.view[0] - Math.sin(f.rotY) * 1.2, f.view[1] + 0.1, f.view[2] - Math.cos(f.rotY) * 1.2];
    CAMERA_KEYS.push(
        { p: base, pos: f.view, look: f.pos, fog: WARM, density: 0.022 },
        { p: base + 0.07, pos: drift, look: f.pos, fog: WARM, density: 0.022 },
    );
});

CAMERA_KEYS.push(
    { p: 0.53, pos: [0, 0, -84], look: [0, 0, -110], fog: NIGHT, density: 0.09 },
    { p: 0.57, pos: [0, 0, -94], look: [0, 0, -120], roll: 0, fog: NIGHT, density: 0.07 },
    { p: 0.64, pos: [0, 0, -114], look: [0, 0, -130], roll: 0.35, fog: '#0d0b14', density: 0.035 },
    { p: 0.7, pos: [0, 0, -140], look: [0, 0, -156], roll: 0, fog: DUSK, density: 0.03 },
);

EXPERIENCE_SLABS.forEach((s, i) => {
    const base = 0.73 + i * 0.045;
    CAMERA_KEYS.push(
        { p: base, pos: s.view, look: s.pos, fog: DUSK, density: 0.028 },
        { p: base + 0.025, pos: [s.view[0] * 0.8, 0.3, s.view[2] - 0.8], look: s.pos, fog: DUSK, density: 0.028 },
    );
});

CAMERA_KEYS.push(
    { p: 0.91, pos: [0, 4.2, -217], look: [0, 4.4, GALLERY.backWall], fog: WARM, density: 0.012 },
    { p: 1.0, pos: [0, 3.4, -199], look: [0, 4.0, GALLERY.backWall], fog: WARM, density: 0.01 },
);

/* ---------------------------------------------------------------- chapters (UI) */

export const groups: ChapterGroup[] = [
    { numeral: 'I', label: 'The Developer', sub: 'Intro', thumb: '/profile.jpg', start: 0, end: 0.12 },
    { numeral: 'II', label: 'Selected Work', sub: `${projects.length} projects`, thumb: projects[0]?.image, start: 0.12, end: 0.53 },
    { numeral: 'III', label: 'The Stack', sub: `${skills.length} tools`, start: 0.53, end: 0.71 },
    { numeral: 'IV', label: 'The Journey', sub: 'Experience', start: 0.71, end: 0.87 },
    { numeral: 'V', label: 'Contact', sub: 'Let’s talk', thumb: '/profile.jpg', start: 0.87, end: 1 },
];

export const chapters: Chapter[] = [
    {
        id: 'intro',
        group: 0,
        start: 0,
        end: 0.08,
        eyebrow: `${personalInfo.title} · ${personalInfo.location}`,
        title: personalInfo.name,
        caption: 'Three years of building for the web. One scroll to walk through it.',
        mini: { image: '/profile.jpg', label: 'I/V · Portrait' },
    },
    {
        id: 'intro-2',
        group: 0,
        start: 0.08,
        end: 0.13,
        whisper: 'Step inside the work.',
    },
    ...PROJECT_FRAMES.map((f, i): Chapter => ({
        id: f.proj.slug,
        group: 1,
        start: 0.13 + i * 0.12,
        end: 0.13 + (i + 1) * 0.12,
        eyebrow: `Project ${String(i + 1).padStart(2, '0')} · ${f.proj.tags.join(' / ')}`,
        title: f.proj.title,
        caption: f.proj.description,
        mini: { image: f.proj.image, label: `II/V · ${f.proj.tech.slice(0, 3).join(', ')}` },
        cta: { label: 'case study', href: `/projects/${f.proj.slug}` },
    })),
    {
        id: 'interlude',
        group: 2,
        start: 0.49,
        end: 0.58,
        whisper: 'Then the stack grows.',
    },
    {
        id: 'skills',
        group: 2,
        start: 0.58,
        end: 0.71,
        eyebrow: 'Frontend · Backend · Database · Mobile',
        title: 'The Stack',
        caption: 'React, Node, Express and MongoDB at the core — TypeScript, Next.js, PHP and Python around it.',
    },
    ...EXPERIENCE_SLABS.map((s, i): Chapter => ({
        id: `exp-${s.exp.id}`,
        group: 3,
        start: 0.71 + i * 0.05,
        end: 0.71 + (i + 1) * 0.05,
        eyebrow: `${s.exp.period} · ${s.exp.location}`,
        title: s.exp.company,
        caption: `${s.exp.role}. ${s.exp.description}`,
    })),
    {
        id: 'contact',
        group: 4,
        start: 0.87,
        end: 1.01,
        eyebrow: personalInfo.email,
        title: 'Let’s build something',
        caption: 'Available for freelance projects and full-time roles. The whole story, in a single scroll.',
        mini: { image: '/profile.jpg', label: 'V/V · Contact' },
        cta: { label: 'say hello', href: `mailto:${personalInfo.email}`, external: true },
    },
];
