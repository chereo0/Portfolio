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

/* ---------------------------------------------------------------- board layout
 * A circuit board seen from a drone. The main data bus — a bundle of gold
 * traces — runs down the -z axis at x = 0. Everything branches off it.
 */

export const BUS = { half: 3.6, lanes: 8, zStart: 60, zEnd: -262 };
export const BOARD_END_Z = -360;

/** The first chip: your portrait as a hologram. */
export const INTRO_CHIP = { pos: [-15, 0, -6] as Vec3, size: 9, holo: [-14, 7.5, -6] as Vec3, rotY: 0.75 };

/** Project chips: big ICs with a holographic screenshot floating above. */
export const PROJECT_CHIPS = projects.map((proj, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -42 - i * 40;
    const rotY = -side * 0.85;
    const holo: Vec3 = [side * 13.5, 7.8, z];
    const n: Vec3 = [Math.sin(rotY), 0, Math.cos(rotY)];
    const view: Vec3 = [holo[0] + n[0] * 17, 9, holo[2] + n[2] * 17];
    const drift: Vec3 = [holo[0] + n[0] * 15, 9.6, holo[2] + n[2] * 15.4];
    return { proj, side, z, chip: [side * 15.5, 0, z] as Vec3, holo, rotY, view, drift };
});

/** Skill components line the bus; each carries a floating label. */
export const SKILL_STRETCH = { zStart: -150, zEnd: -206 };
export const SKILL_PARTS = skills.map((skill, i) => {
    const t = i / Math.max(1, skills.length - 1);
    const side = i % 2 === 0 ? -1 : 1;
    const z = SKILL_STRETCH.zStart + (SKILL_STRETCH.zEnd - SKILL_STRETCH.zStart) * t;
    const y = 2.6 + ((i * 3) % 4) * 0.9;
    return { skill, side, chip: [side * 7.2, 0, z] as Vec3, label: [side * 6.6, y, z] as Vec3 };
});

/** Experience: RAM sticks standing in their slots. */
export const SLOT_Z = -238;
export const RAM_STICKS = experience.map((exp, i) => {
    const x = (i - (experience.length - 1) / 2) * 14;
    const face: Vec3 = [x, 4.9, SLOT_Z + 0.3];
    return { exp, x, face, view: [x * 0.85, 5.4, SLOT_Z + 15] as Vec3 };
});

/** The processor at the end of the bus, with the portrait above its core. */
export const CPU = { z: -276, size: 22, holo: [0, 11.5, -276] as Vec3 };

/* ---------------------------------------------------------------- camera path */

const DEEP = '#020708';
const TEAL = '#03100f';
const VIOLET = '#0b0717';

export const CAMERA_KEYS: CameraKey[] = [
    { p: 0.0, pos: [16, 62, 58], look: [0, 0, -70], fog: DEEP, density: 0.012 },
    { p: 0.06, pos: [2, 13, 16], look: INTRO_CHIP.holo, fog: DEEP, density: 0.01 },
    { p: 0.11, pos: [0, 5, -4], look: [0, 3, -40], fog: TEAL, density: 0.014 },
];

PROJECT_CHIPS.forEach((c, i) => {
    const base = 0.15 + i * 0.12;
    CAMERA_KEYS.push(
        { p: base, pos: c.view, look: c.holo, fog: TEAL, density: 0.012 },
        { p: base + 0.07, pos: c.drift, look: c.holo, fog: TEAL, density: 0.012 },
    );
});

CAMERA_KEYS.push(
    { p: 0.53, pos: [0, 34, -118], look: [0, 0, -185], fog: DEEP, density: 0.014 },
    { p: 0.58, pos: [0, 4.2, -138], look: [0, 3.4, -170], roll: 0, fog: VIOLET, density: 0.016 },
    { p: 0.645, pos: [0.5, 4, -168], look: [0, 3.6, -200], roll: 0.05, fog: VIOLET, density: 0.016 },
    { p: 0.7, pos: [0, 5, -203], look: [0, 5, SLOT_Z], roll: 0, fog: VIOLET, density: 0.014 },
);

RAM_STICKS.forEach((s, i) => {
    const base = 0.73 + i * 0.045;
    CAMERA_KEYS.push(
        { p: base, pos: s.view, look: s.face, fog: TEAL, density: 0.012 },
        { p: base + 0.025, pos: [s.view[0], s.view[1] + 0.4, s.view[2] - 1.6], look: s.face, fog: TEAL, density: 0.012 },
    );
});

CAMERA_KEYS.push(
    { p: 0.91, pos: [0, 13, -250], look: CPU.holo, fog: DEEP, density: 0.012 },
    { p: 1.0, pos: [0, 38, -214], look: [0, 4, CPU.z], fog: DEEP, density: 0.013 },
);

/* ---------------------------------------------------------------- chapters (UI) */

export const groups: ChapterGroup[] = [
    { numeral: '01', label: 'The Developer', sub: 'Boot', thumb: '/profile.jpg', start: 0, end: 0.12 },
    { numeral: '02', label: 'Selected Work', sub: `${projects.length} projects`, thumb: projects[0]?.image, start: 0.12, end: 0.53 },
    { numeral: '03', label: 'The Stack', sub: `${skills.length} components`, start: 0.53, end: 0.71 },
    { numeral: '04', label: 'Experience', sub: `${experience.length} modules`, start: 0.71, end: 0.87 },
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
        caption: 'Three years of building for the web, wired onto one board. Scroll to follow the signal.',
        mini: { image: '/profile.jpg', label: '01/05 · Portrait' },
    },
    {
        id: 'intro-2',
        group: 0,
        start: 0.08,
        end: 0.13,
        whisper: 'Booting up',
    },
    ...PROJECT_CHIPS.map((c, i): Chapter => ({
        id: c.proj.slug,
        group: 1,
        start: 0.13 + i * 0.12,
        end: 0.13 + (i + 1) * 0.12,
        eyebrow: `Project ${String(i + 1).padStart(2, '0')} · ${c.proj.tags.join(' / ')}`,
        title: c.proj.title,
        caption: c.proj.description,
        mini: { image: c.proj.image, label: `02/05 · ${c.proj.tech.slice(0, 3).join(', ')}` },
        cta: { label: 'case study', href: `/projects/${c.proj.slug}` },
    })),
    {
        id: 'interlude',
        group: 2,
        start: 0.49,
        end: 0.58,
        whisper: 'Then the signal splits',
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
    ...RAM_STICKS.map((s, i): Chapter => ({
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
        caption: 'Available for freelance projects and full-time roles. Send the signal — I’ll process it.',
        mini: { image: '/profile.jpg', label: '05/05 · Contact' },
        cta: { label: 'say hello', href: `mailto:${personalInfo.email}`, external: true },
    },
];
