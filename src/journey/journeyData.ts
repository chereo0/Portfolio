import { personalInfo, projects, skills, experience } from '../data';

export type Vec3 = [number, number, number];

/** A camera keyframe. Between two keyframes the camera eases (smoothstep);
 *  two keyframes close together in space create a slow "hold". */
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

/* ---------------------------------------------------------------- city layout
 * The city is a grid. A main avenue runs down the -z axis at x = 0.
 * Cross streets cut across every 40 units, at z = -20, -60, -100 …
 */

export const AVENUE_HALF = 7; // building facades start beyond this
export const CROSS_STREETS = [20, -20, -60, -100, -140, -180, -220];
export const CITY_END_Z = -290;

/** Project towers: big screenshot billboards facing the avenue. */
export const PROJECT_TOWERS = projects.map((proj, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -40 - i * 40;
    const billboard: Vec3 = [side * 8.6, 12, z];
    const view: Vec3 = [-side * 3.2, 10.5, z + 13];
    const drift: Vec3 = [-side * 2.4, 11.2, z + 10];
    return { proj, side, z, center: [side * 13.5, 0, z] as Vec3, billboard, view, drift };
});

/** Neon skill signs hang off the facades along this stretch of avenue. */
export const SIGN_STRETCH = { zStart: -150, zEnd: -206 };
export const SKILL_SIGNS = skills.map((skill, i) => {
    const t = i / Math.max(1, skills.length - 1);
    const side = i % 2 === 0 ? -1 : 1;
    const z = SIGN_STRETCH.zStart + (SIGN_STRETCH.zEnd - SIGN_STRETCH.zStart) * t;
    const y = 5 + ((i * 7) % 5) * 2.4;
    return { skill, side, pos: [side * 5.3, y, z] as Vec3 };
});

/** Experience towers stand on a plaza at the end of the avenue. */
export const PLAZA_Z = -238;
export const EXPERIENCE_TOWERS = experience.map((exp, i) => {
    const x = (i - (experience.length - 1) / 2) * 17;
    const screen: Vec3 = [x, 13, PLAZA_Z + 6.6];
    return { exp, x, screen, view: [x * 0.85, 12.5, PLAZA_Z + 25] as Vec3 };
});

/** The last and tallest tower carries the portrait at its crown. */
export const CROWN = { z: -268, height: 72, billboard: [0, 48, -259.6] as Vec3 };

/** The portrait billboard you see first, on the very first tower. */
export const INTRO_BILLBOARD: Vec3 = [-8.6, 16, -6];

/* ---------------------------------------------------------------- camera path */

const NIGHT = '#060914';
const INDIGO = '#0a0b22';
const VIOLET = '#140a24';

export const CAMERA_KEYS: CameraKey[] = [
    { p: 0.0, pos: [10, 78, 70], look: [0, 0, -90], fog: NIGHT, density: 0.0055 },
    { p: 0.06, pos: [3, 22, 22], look: [-6, 14, -10], fog: NIGHT, density: 0.008 },
    { p: 0.11, pos: [0, 11, 0], look: [0, 10, -40], fog: NIGHT, density: 0.01 },
];

PROJECT_TOWERS.forEach((t, i) => {
    const base = 0.15 + i * 0.12;
    CAMERA_KEYS.push(
        { p: base, pos: t.view, look: t.billboard, fog: INDIGO, density: 0.011 },
        { p: base + 0.07, pos: t.drift, look: t.billboard, fog: INDIGO, density: 0.011 },
    );
});

CAMERA_KEYS.push(
    { p: 0.53, pos: [0, 40, -118], look: [0, 6, -190], fog: NIGHT, density: 0.009 },
    { p: 0.58, pos: [0, 9, -140], look: [0, 8, -175], roll: 0, fog: VIOLET, density: 0.012 },
    { p: 0.645, pos: [0.8, 8.5, -168], look: [0, 9, -200], roll: 0.06, fog: VIOLET, density: 0.013 },
    { p: 0.7, pos: [0, 9, -200], look: [0, 12, PLAZA_Z], roll: 0, fog: VIOLET, density: 0.012 },
);

EXPERIENCE_TOWERS.forEach((t, i) => {
    const base = 0.73 + i * 0.045;
    CAMERA_KEYS.push(
        { p: base, pos: t.view, look: t.screen, fog: INDIGO, density: 0.009 },
        { p: base + 0.025, pos: [t.view[0], t.view[1] + 0.6, t.view[2] - 2], look: t.screen, fog: INDIGO, density: 0.009 },
    );
});

CAMERA_KEYS.push(
    { p: 0.91, pos: [0, 47, -232], look: CROWN.billboard, fog: NIGHT, density: 0.006 },
    { p: 1.0, pos: [0, 58, -196], look: [0, 42, CROWN.z], fog: NIGHT, density: 0.005 },
);

/* ---------------------------------------------------------------- chapters (UI) */

export const groups: ChapterGroup[] = [
    { numeral: '01', label: 'The Developer', sub: 'Intro', thumb: '/profile.jpg', start: 0, end: 0.12 },
    { numeral: '02', label: 'Selected Work', sub: `${projects.length} projects`, thumb: projects[0]?.image, start: 0.12, end: 0.53 },
    { numeral: '03', label: 'The Stack', sub: `${skills.length} tools`, start: 0.53, end: 0.71 },
    { numeral: '04', label: 'Experience', sub: `${experience.length} roles`, start: 0.71, end: 0.87 },
    { numeral: '05', label: 'Contact', sub: 'Let’s talk', thumb: '/profile.jpg', start: 0.87, end: 1 },
];

export const chapters: Chapter[] = [
    {
        id: 'intro',
        group: 0,
        start: 0,
        end: 0.08,
        eyebrow: `${personalInfo.title} · ${personalInfo.location}`,
        title: personalInfo.name,
        caption: 'Three years of building for the web, laid out as a city. Scroll to drive through it.',
        mini: { image: '/profile.jpg', label: '01/05 · Portrait' },
    },
    {
        id: 'intro-2',
        group: 0,
        start: 0.08,
        end: 0.13,
        whisper: 'Entering the city',
    },
    ...PROJECT_TOWERS.map((t, i): Chapter => ({
        id: t.proj.slug,
        group: 1,
        start: 0.13 + i * 0.12,
        end: 0.13 + (i + 1) * 0.12,
        eyebrow: `Project ${String(i + 1).padStart(2, '0')} · ${t.proj.tags.join(' / ')}`,
        title: t.proj.title,
        caption: t.proj.description,
        mini: { image: t.proj.image, label: `02/05 · ${t.proj.tech.slice(0, 3).join(', ')}` },
        cta: { label: 'case study', href: `/projects/${t.proj.slug}` },
    })),
    {
        id: 'interlude',
        group: 2,
        start: 0.49,
        end: 0.58,
        whisper: 'Then the city lights up',
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
    ...EXPERIENCE_TOWERS.map((t, i): Chapter => ({
        id: `exp-${t.exp.id}`,
        group: 3,
        start: 0.71 + i * 0.05,
        end: 0.71 + (i + 1) * 0.05,
        eyebrow: `${t.exp.period} · ${t.exp.location}`,
        title: t.exp.company,
        caption: `${t.exp.role}. ${t.exp.description}`,
    })),
    {
        id: 'contact',
        group: 4,
        start: 0.87,
        end: 1.01,
        eyebrow: personalInfo.email,
        title: 'Let’s build something',
        caption: 'Available for freelance projects and full-time roles. Pick a block — I’ll build on it.',
        mini: { image: '/profile.jpg', label: '05/05 · Contact' },
        cta: { label: 'say hello', href: `mailto:${personalInfo.email}`, external: true },
    },
];
