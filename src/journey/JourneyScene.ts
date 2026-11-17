import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
    BOARD_END_Z,
    BUS,
    CAMERA_KEYS,
    CPU,
    INTRO_CHIP,
    PROJECT_CHIPS,
    RAM_STICKS,
    SKILL_PARTS,
    SLOT_Z,
    type Vec3,
} from './journeyData';

const NEON = { cyan: '#22d3ee', magenta: '#f472b6', violet: '#a78bfa', amber: '#fbbf24', green: '#34d399' };
const NEON_LIST = [NEON.cyan, NEON.magenta, NEON.violet, NEON.amber];
const DISPLAY = '"Space Grotesk", Inter, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const PART_NUMBERS = [
    'AA-328P', 'MERN·X1', 'NODE-18', 'RCT-19', 'TS 5.9', 'MDB-7', 'EXP-4.2', 'VITE-5',
    'JWT·256', 'API-GW', 'SQL-8.0', 'NXT-14', 'PHP-8.3', 'PY-3.12', 'AND-34', 'CDN-01',
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

/** Seeded random so the board is the same on every visit. */
function rng(seed: number) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext('2d')!);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
    let line = '';
    for (const word of text.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, y);
            line = word;
            y += lh;
        } else line = test;
    }
    if (line) ctx.fillText(line, x, y);
    return y;
}

/** Bright, un-tonemapped colour so it blooms. */
const glow = (hex: string, k = 2.2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

interface Path {
    pts: THREE.Vector3[];
    cum: number[]; // cumulative length at each point
    len: number;
}

function makePath(points: [number, number][], y = 0.09): Path {
    const pts = points.map(([x, z]) => new THREE.Vector3(x, y, z));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    return { pts, cum, len: cum[cum.length - 1] };
}

export class JourneyScene {
    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private bloom: UnrealBloomPass;
    private scene = new THREE.Scene();
    private camera: THREE.PerspectiveCamera;
    private fog: THREE.FogExp2;
    private clock = new THREE.Clock();
    private raf = 0;
    private progress = 0;
    private target = 0;
    private pointer = new THREE.Vector2();
    private pointerSmooth = new THREE.Vector2();
    private onProgress?: (p: number) => void;
    private narrow = false;

    private paths: Path[] = [];
    private pulses!: THREE.InstancedMesh;
    private pulseData: { path: number; s: number; speed: number }[] = [];
    private leds!: THREE.PointsMaterial;
    private beams: THREE.MeshBasicMaterial[] = [];
    private cpuRing!: THREE.Mesh;

    private tmpA = new THREE.Vector3();
    private tmpB = new THREE.Vector3();
    private tmpLook = new THREE.Vector3();
    private colA = new THREE.Color();
    private colB = new THREE.Color();
    private dummy = new THREE.Object3D();

    constructor(canvas: HTMLCanvasElement, onProgress?: (p: number) => void) {
        this.canvas = canvas;
        this.onProgress = onProgress;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 500);
        this.fog = new THREE.FogExp2('#020708', 0.01);
        this.scene.fog = this.fog;
        this.scene.background = new THREE.Color('#020708');

        // soft studio reflections so the gold traces and pins read as metal
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        this.scene.environmentIntensity = 0.35;
        pmrem.dispose();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.9, 0.5, 0.7);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());

        this.build();
        this.resize();
        window.addEventListener('resize', this.resize);
        window.addEventListener('pointermove', this.onPointer);
        this.loop();
    }

    setTarget(p: number) {
        this.target = THREE.MathUtils.clamp(p, 0, 1);
    }

    dispose() {
        cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('pointermove', this.onPointer);
        this.scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            mesh.geometry?.dispose();
            const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m?.dispose();
        });
        this.scene.environment?.dispose();
        this.composer.dispose();
        this.renderer.dispose();
    }

    /* ================================================================ build */

    private build() {
        const s = this.scene;
        s.add(new THREE.HemisphereLight('#7fffe0', '#020406', 0.45));
        const key = new THREE.DirectionalLight('#bfe9ff', 0.9);
        key.position.set(-20, 40, 30);
        s.add(key);

        const loader = new THREE.TextureLoader();
        this.buildBoard();
        this.buildComponents();
        this.buildTraces();
        this.buildFeatures(loader);
        this.buildSkillParts();
        this.buildPulses();
    }

    /** Solder-mask texture: fine dot grid, faint routed traces and pads. */
    private buildBoard() {
        const r = rng(5);
        const tex = canvasTexture(1024, 1024, (ctx) => {
            ctx.fillStyle = '#04100f';
            ctx.fillRect(0, 0, 1024, 1024);
            ctx.fillStyle = '#0a2220';
            for (let y = 8; y < 1024; y += 16) for (let x = 8; x < 1024; x += 16) ctx.fillRect(x, y, 2, 2);
            ctx.lineCap = 'round';
            for (let i = 0; i < 70; i++) {
                ctx.strokeStyle = r() < 0.15 ? '#1d5a50' : '#0f3a35';
                ctx.lineWidth = r() < 0.2 ? 5 : 2.5;
                let x = Math.round(r() * 64) * 16;
                let y = Math.round(r() * 64) * 16;
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let k = 0; k < 4; k++) {
                    const len = (2 + Math.floor(r() * 10)) * 16;
                    const dir = Math.floor(r() * 4);
                    if (dir === 0) x += len;
                    else if (dir === 1) y += len;
                    else if (dir === 2) { x += len; y += len; }
                    else { x -= len; y += len; }
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.fillStyle = '#1d5a50';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(27, 30);
        const board = new THREE.Mesh(
            new THREE.PlaneGeometry(900, 1000),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.1, emissive: '#1affd5', emissiveMap: tex, emissiveIntensity: 0.4 }),
        );
        board.rotation.x = -Math.PI / 2;
        board.position.set(0, 0, -150);
        this.scene.add(board);

        // the bus gets a slightly lighter channel so it reads as the main road
        const channel = new THREE.Mesh(
            new THREE.PlaneGeometry(BUS.half * 2 + 2, BUS.zStart - BUS.zEnd),
            new THREE.MeshStandardMaterial({ color: '#06201d', roughness: 0.4, metalness: 0.3 }),
        );
        channel.rotation.x = -Math.PI / 2;
        channel.position.set(0, 0.01, (BUS.zStart + BUS.zEnd) / 2);
        this.scene.add(channel);
    }

    /** Label atlas for chip tops: 4×4 part numbers. */
    private labelAtlas() {
        return canvasTexture(1024, 1024, (ctx) => {
            for (let i = 0; i < 16; i++) {
                const x = (i % 4) * 256;
                const y = Math.floor(i / 4) * 256;
                const g = ctx.createLinearGradient(x, y, x + 256, y + 256);
                g.addColorStop(0, '#15181f');
                g.addColorStop(1, '#0b0d12');
                ctx.fillStyle = g;
                ctx.fillRect(x, y, 256, 256);
                ctx.fillStyle = '#272c38';
                ctx.beginPath();
                ctx.arc(x + 34, y + 34, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#9aa6b8';
                ctx.font = `700 34px ${MONO}`;
                ctx.fillText(PART_NUMBERS[i], x + 30, y + 140);
                ctx.fillStyle = '#5c6678';
                ctx.font = `500 20px ${MONO}`;
                ctx.fillText(`2${4 + (i % 3)}${10 + i}  ·  AA`, x + 30, y + 180);
            }
        });
    }

    /** A chip body whose top face shows one cell of the label atlas. */
    private chipGeo(w: number, h: number, d: number, x: number, z: number, cell: number) {
        const g = new THREE.BoxGeometry(w, h, d);
        const uv = g.attributes.uv as THREE.BufferAttribute;
        const cx = (cell % 4) / 4;
        const cy = 1 - (Math.floor(cell / 4) + 1) / 4;
        for (let i = 0; i < uv.count; i++) {
            const face = Math.floor(i / 4);
            if (face === 2) uv.setXY(i, cx + 0.01 + uv.getX(i) * 0.23, cy + 0.01 + uv.getY(i) * 0.23);
            else uv.setXY(i, cx + 0.2, cy + 0.02); // sides: plain dark body
        }
        g.translate(x, h / 2 + 0.05, z);
        return g;
    }

    /** Scattered ICs, capacitors, heatsinks and LEDs — the "skyline". */
    private buildComponents() {
        const r = rng(42);
        const chips: THREE.BufferGeometry[] = [];
        const pins: THREE.Matrix4[] = [];
        const caps: THREE.BufferGeometry[] = [];
        const capTops: THREE.BufferGeometry[] = [];
        const fins: THREE.BufferGeometry[] = [];
        const ledPos: number[] = [];
        const ledCol: number[] = [];
        const c = new THREE.Color();
        const m = new THREE.Matrix4();

        const addPins = (x: number, z: number, w: number, d: number, fourSides: boolean) => {
            const pitch = 0.55;
            for (let px = -w / 2 + 0.4; px <= w / 2 - 0.4; px += pitch) {
                for (const sz of [-1, 1]) pins.push(m.clone().makeTranslation(x + px, 0.12, z + sz * (d / 2 + 0.22)));
            }
            if (!fourSides) return;
            for (let pz = -d / 2 + 0.4; pz <= d / 2 - 0.4; pz += pitch) {
                for (const sx of [-1, 1]) {
                    const t = new THREE.Matrix4().makeRotationY(Math.PI / 2);
                    t.setPosition(x + sx * (w / 2 + 0.22), 0.12, z + pz);
                    pins.push(t);
                }
            }
        };
        this.addChip = (x, z, w, d, h, cell, four = true) => {
            chips.push(this.chipGeo(w, h, d, x, z, cell));
            addPins(x, z, w, d, four);
        };

        const reserved = (x: number, z: number) => {
            if (Math.abs(x - INTRO_CHIP.pos[0]) < 9 && Math.abs(z - INTRO_CHIP.pos[2]) < 9) return true;
            if (PROJECT_CHIPS.some((p) => Math.abs(x - p.chip[0]) < 11 && Math.abs(z - p.z) < 11)) return true;
            if (z < -142 && z > -212 && Math.abs(x) < 10) return true; // skill row
            if (z < SLOT_Z + 12 && Math.abs(x) < 30) return true;
            return false;
        };

        for (let k = 0; k < 13; k++) {
            for (const side of [-1, 1]) {
                const lx = side * (9.5 + k * 8.5);
                for (let z = 80; z > BOARD_END_Z; z -= 8.5) {
                    if (r() < 0.22 || reserved(lx, z)) continue;
                    const x = lx + (r() - 0.5) * 1.5;
                    const zz = z + (r() - 0.5) * 1.5;
                    const kind = r();
                    if (kind < 0.55) {
                        const w = 2.6 + r() * 3.6;
                        const d = 2.6 + r() * 3.6;
                        this.addChip(x, zz, w, d, 0.45 + r() * 0.5, Math.floor(r() * 16), r() < 0.6);
                    } else if (kind < 0.8) {
                        // a little cluster of electrolytic capacitors
                        const n = 1 + Math.floor(r() * 3);
                        for (let i = 0; i < n; i++) {
                            const rad = 0.5 + r() * 0.7;
                            const h = 1.4 + r() * 2.8;
                            const cx = x + (i - (n - 1) / 2) * (rad * 2.4);
                            const g = new THREE.CylinderGeometry(rad, rad, h, 20);
                            g.translate(cx, h / 2, zz);
                            caps.push(g);
                            const t = new THREE.CylinderGeometry(rad * 0.98, rad * 0.98, 0.04, 20);
                            t.translate(cx, h + 0.02, zz);
                            capTops.push(t);
                        }
                    } else if (kind < 0.9) {
                        // heatsink: base plate + fins
                        const w = 5 + r() * 2;
                        const h = 2.5 + r() * 2;
                        const base = new THREE.BoxGeometry(w, 0.3, w);
                        base.translate(x, 0.15, zz);
                        fins.push(base);
                        for (let f = -w / 2 + 0.3; f < w / 2; f += 0.55) {
                            const fin = new THREE.BoxGeometry(0.12, h, w);
                            fin.translate(x + f, h / 2 + 0.3, zz);
                            fins.push(fin);
                        }
                    } else {
                        // SMD resistor row with status LEDs
                        for (let i = 0; i < 4; i++) {
                            const g = this.chipGeo(1.2, 0.35, 0.6, x + i * 1.5 - 2.2, zz, 3);
                            chips.push(g);
                            c.set(r() < 0.6 ? NEON.green : r() < 0.5 ? '#ff3355' : NEON.amber).multiplyScalar(2.5);
                            ledPos.push(x + i * 1.5 - 2.2, 0.75, zz + 0.9);
                            ledCol.push(c.r, c.g, c.b);
                        }
                    }
                }
            }
        }

        // feature chips get their bodies here too
        this.addChip(INTRO_CHIP.pos[0], INTRO_CHIP.pos[2], INTRO_CHIP.size, INTRO_CHIP.size, 1, 1);
        PROJECT_CHIPS.forEach((p, i) => this.addChip(p.chip[0], p.z, 12, 12, 1.1, [4, 10, 1][i % 3]));
        SKILL_PARTS.forEach((sp, i) => this.addChip(sp.chip[0], sp.chip[2], 3.2, 2.4, 0.5, (i * 5) % 16, false));

        const s = this.scene;
        s.add(new THREE.Mesh(mergeGeometries(chips), new THREE.MeshStandardMaterial({ map: this.labelAtlas(), roughness: 0.45, metalness: 0.2 })));

        const pinMesh = new THREE.InstancedMesh(
            new THREE.BoxGeometry(0.2, 0.14, 0.5),
            new THREE.MeshStandardMaterial({ color: '#d9b45a', metalness: 1, roughness: 0.28 }),
            pins.length,
        );
        pins.forEach((mat, i) => pinMesh.setMatrixAt(i, mat));
        s.add(pinMesh);

        if (caps.length) {
            s.add(new THREE.Mesh(mergeGeometries(caps), new THREE.MeshStandardMaterial({ color: '#1b2536', metalness: 0.5, roughness: 0.35 })));
            s.add(new THREE.Mesh(mergeGeometries(capTops), new THREE.MeshStandardMaterial({ color: '#c3cad6', metalness: 1, roughness: 0.25 })));
        }
        if (fins.length) s.add(new THREE.Mesh(mergeGeometries(fins), new THREE.MeshStandardMaterial({ color: '#8d97a8', metalness: 0.9, roughness: 0.35 })));

        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(ledPos, 3));
        lg.setAttribute('color', new THREE.Float32BufferAttribute(ledCol, 3));
        this.leds = new THREE.PointsMaterial({ size: 0.9, vertexColors: true, map: this.dotTexture(), transparent: true, depthWrite: false, toneMapped: false });
        s.add(new THREE.Points(lg, this.leds));
    }

    private addChip: (x: number, z: number, w: number, d: number, h: number, cell: number, four?: boolean) => void = () => {};

    /** Gold traces: the main bus plus branches to every feature chip. */
    private buildTraces() {
        const lane = (i: number) => -BUS.half + (i * (BUS.half * 2)) / (BUS.lanes - 1);
        for (let i = 0; i < BUS.lanes; i++) this.paths.push(makePath([[lane(i), BUS.zStart], [lane(i), BUS.zEnd]]));

        // 45° branch from the outer lane to a target point
        const branch = (side: number, zFrom: number, tx: number, tz: number, offset = 0) => {
            const x0 = side * (BUS.half - offset);
            const d = Math.abs(tx - x0) * 0.45;
            this.paths.push(makePath([[x0, zFrom], [x0 + side * d, zFrom - d], [tx, zFrom - d], [tx, tz]]));
        };
        branch(-1, INTRO_CHIP.pos[2] + 10, INTRO_CHIP.pos[0] + 4.5, INTRO_CHIP.pos[2]);
        branch(-1, INTRO_CHIP.pos[2] + 12, INTRO_CHIP.pos[0] + 4.5, INTRO_CHIP.pos[2] + 2, 1);
        PROJECT_CHIPS.forEach((p) => {
            for (let k = 0; k < 3; k++) branch(p.side, p.z + 12 + k * 1.3, p.chip[0] - p.side * 6, p.z + 2 - k * 2, k * 1.03);
        });
        SKILL_PARTS.forEach((sp) => this.paths.push(makePath([[sp.side * BUS.half, sp.chip[2] + 1.6], [sp.side * 5.2, sp.chip[2]], [sp.chip[0], sp.chip[2]]])));
        RAM_STICKS.forEach((st) => {
            for (const off of [-3, 0, 3]) {
                this.paths.push(makePath([[off * 0.6, BUS.zEnd + 30], [st.x + off, SLOT_Z + 10], [st.x + off, SLOT_Z + 0.5]]));
            }
        });
        // the bus terminates in the CPU
        for (let i = 0; i < BUS.lanes; i++) this.paths.push(makePath([[lane(i), SLOT_Z + 20], [lane(i) * 1.6, CPU.z + CPU.size / 2 + 2], [lane(i) * 1.6, CPU.z + CPU.size / 2]]));

        // decorative background traces, so the whole board feels wired
        const r = rng(99);
        for (let i = 0; i < 60; i++) {
            const side = r() < 0.5 ? -1 : 1;
            const x = side * (12 + r() * 60);
            const z = 40 - r() * 320;
            const len = 6 + r() * 18;
            const dz = (r() < 0.5 ? -1 : 1) * len;
            this.paths.push(makePath([[x, z], [x, z + dz * 0.5], [x + side * len * 0.4, z + dz * 0.5 + len * 0.4 * Math.sign(dz)], [x + side * len * 0.4, z + dz]]));
        }

        const segs: THREE.BufferGeometry[] = [];
        const vias: THREE.BufferGeometry[] = [];
        this.paths.forEach((p) => {
            for (let i = 1; i < p.pts.length; i++) {
                const a = p.pts[i - 1];
                const b = p.pts[i];
                const len = a.distanceTo(b);
                if (len < 0.01) continue;
                const g = new THREE.BoxGeometry(0.2, 0.05, len + 0.2);
                g.rotateY(Math.atan2(b.x - a.x, b.z - a.z));
                g.translate((a.x + b.x) / 2, 0.04, (a.z + b.z) / 2);
                segs.push(g);
            }
            for (const end of [p.pts[0], p.pts[p.pts.length - 1]]) {
                const v = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 14);
                v.translate(end.x, 0.05, end.z);
                vias.push(v);
            }
        });
        const gold = new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 1, roughness: 0.3, emissive: '#3a2400', emissiveIntensity: 0.6 });
        this.scene.add(new THREE.Mesh(mergeGeometries(segs), gold));
        this.scene.add(new THREE.Mesh(mergeGeometries(vias), gold));
    }

    /** Data pulses travelling along the traces. */
    private buildPulses() {
        const r = rng(17);
        const count = 320;
        this.pulses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.12, 1.1), new THREE.MeshBasicMaterial({ toneMapped: false }), count);
        const busCount = BUS.lanes;
        for (let i = 0; i < count; i++) {
            // half of all pulses run on the main bus so the "road" is always alive
            const path = i < count * 0.5 ? i % busCount : busCount + Math.floor(r() * (this.paths.length - busCount));
            const p = this.paths[path];
            this.pulseData.push({ path, s: r() * p.len, speed: 6 + r() * 10 });
            const hex = r() < 0.6 ? NEON.cyan : r() < 0.5 ? NEON.magenta : NEON.amber;
            this.pulses.setColorAt(i, new THREE.Color(hex).multiplyScalar(2.6));
        }
        this.scene.add(this.pulses);
    }

    /** Thin glowing border boxes around a plane (added as children). Returns a relayout fn. */
    private neonFrame(parent: THREE.Object3D, w: number, h: number, hex: string) {
        const mat = glow(hex);
        const t = 0.12;
        const meshes = [0, 1, 2, 3].map(() => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.08), mat);
            parent.add(m);
            return m;
        });
        const layout = (nw: number, nh: number) => {
            meshes[0].scale.set(nw + t * 2, t, 1);
            meshes[0].position.set(0, nh / 2 + t / 2, 0.02);
            meshes[1].scale.set(nw + t * 2, t, 1);
            meshes[1].position.set(0, -nh / 2 - t / 2, 0.02);
            meshes[2].scale.set(t, nh, 1);
            meshes[2].position.set(-nw / 2 - t / 2, 0, 0.02);
            meshes[3].scale.set(t, nh, 1);
            meshes[3].position.set(nw / 2 + t / 2, 0, 0.02);
        };
        layout(w, h);
        return layout;
    }

    /** Floating holographic screen with a light beam down to its chip. */
    private hologram(loader: THREE.TextureLoader, url: string, maxW: number, maxH: number, hex: string, beamHeight: number) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: '#16303a', toneMapped: false, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        group.add(plane);
        const relayout = this.neonFrame(group, maxW, maxH, hex);

        // scanline overlay
        const scan = canvasTexture(4, 256, (ctx) => {
            for (let y = 0; y < 256; y += 4) {
                ctx.fillStyle = 'rgba(255,255,255,0.10)';
                ctx.fillRect(0, y, 4, 1);
            }
        });
        scan.wrapT = THREE.RepeatWrapping;
        scan.repeat.set(1, 3);
        const scanMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: scan, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
        );
        scanMesh.position.z = 0.01;
        group.add(scanMesh);

        // light beam from the chip below
        const beamMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(hex).multiplyScalar(1.2),
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
        });
        this.beams.push(beamMat);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.15, 1, 4, 1, true), beamMat);
        group.add(beam);

        const layout = (aspect: number) => {
            let w = maxW;
            let h = w / aspect;
            if (h > maxH) {
                h = maxH;
                w = h * aspect;
            }
            plane.scale.set(w, h, 1);
            scanMesh.scale.set(w, h, 1);
            relayout(w, h);
            beam.scale.set(w * 0.5, beamHeight - h / 2, w * 0.2);
            beam.position.set(0, -h / 2 - (beamHeight - h / 2) / 2, -0.2);
            beam.rotation.y = Math.PI / 4;
        };
        layout(maxW / maxH);
        loader.load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 8;
            mat.map = tex;
            mat.color.set('#d4dde6');
            mat.needsUpdate = true;
            const img = tex.image as HTMLImageElement;
            layout(img.width / img.height);
        });
        return group;
    }

    private buildFeatures(loader: THREE.TextureLoader) {
        const s = this.scene;

        // intro portrait
        const intro = this.hologram(loader, '/profile.jpg', 7, 9, NEON.cyan, INTRO_CHIP.holo[1]);
        intro.position.copy(v3(INTRO_CHIP.holo));
        intro.rotation.y = INTRO_CHIP.rotY;
        s.add(intro);
        const il = new THREE.PointLight(NEON.cyan, 40, 22, 1.6);
        il.position.set(INTRO_CHIP.pos[0] + 3, 2, INTRO_CHIP.pos[2] + 4);
        s.add(il);

        // project chips
        PROJECT_CHIPS.forEach((p, i) => {
            const hex = NEON_LIST[i % 4];
            const holo = this.hologram(loader, p.proj.image, 12, 7.6, hex, p.holo[1]);
            holo.position.copy(v3(p.holo));
            holo.rotation.y = p.rotY;
            s.add(holo);
            const l = new THREE.PointLight(hex, 70, 28, 1.5);
            l.position.set(p.chip[0] - p.side * 4, 3, p.z + 5);
            s.add(l);
            // glowing outline around the chip footprint
            const ring = new THREE.Mesh(new THREE.RingGeometry(9.2, 9.45, 4, 1), glow(hex, 1.6));
            ring.rotation.x = -Math.PI / 2;
            ring.rotation.z = Math.PI / 4;
            ring.position.set(p.chip[0], 0.06, p.z);
            s.add(ring);
        });

        // RAM sticks
        RAM_STICKS.forEach((st, i) => {
            const slot = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.9, 1.1), new THREE.MeshStandardMaterial({ color: '#111722', roughness: 0.6 }));
            slot.position.set(st.x, 0.45, SLOT_Z);
            s.add(slot);
            for (const sx of [-1, 1]) {
                const latch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 1.1), new THREE.MeshStandardMaterial({ color: '#e7e9ee', roughness: 0.5 }));
                latch.position.set(st.x + sx * 6.3, 1.1, SLOT_Z);
                s.add(latch);
            }
            const stick = new THREE.Mesh(
                new THREE.BoxGeometry(11.6, 7.4, 0.22),
                [
                    new THREE.MeshStandardMaterial({ color: '#0c2a22' }),
                    new THREE.MeshStandardMaterial({ color: '#0c2a22' }),
                    new THREE.MeshStandardMaterial({ color: '#0c2a22' }),
                    new THREE.MeshStandardMaterial({ color: '#0c2a22' }),
                    new THREE.MeshBasicMaterial({ map: this.ramTexture(st.exp, i), toneMapped: false }),
                    new THREE.MeshStandardMaterial({ color: '#0c2a22' }),
                ],
            );
            stick.position.set(st.x, 4.6, SLOT_Z);
            s.add(stick);
            const l = new THREE.PointLight(NEON.violet, 30, 20, 1.6);
            l.position.set(st.x, 6, SLOT_Z + 7);
            s.add(l);
        });

        // CPU: substrate, heat spreader, glowing core ring and the portrait hologram
        const sub = new THREE.Mesh(new THREE.BoxGeometry(CPU.size, 0.6, CPU.size), new THREE.MeshStandardMaterial({ color: '#0e3b2c', roughness: 0.5 }));
        sub.position.set(0, 0.3, CPU.z);
        s.add(sub);
        const ihs = new THREE.Mesh(
            new THREE.BoxGeometry(CPU.size * 0.72, 0.7, CPU.size * 0.72),
            new THREE.MeshStandardMaterial({ color: '#c7ccd4', metalness: 1, roughness: 0.22 }),
        );
        ihs.position.set(0, 0.95, CPU.z);
        s.add(ihs);
        const engraving = new THREE.Mesh(
            new THREE.PlaneGeometry(CPU.size * 0.6, CPU.size * 0.3),
            new THREE.MeshBasicMaterial({ map: this.cpuEngraving(), transparent: true, toneMapped: false }),
        );
        engraving.rotation.x = -Math.PI / 2;
        engraving.position.set(0, 1.31, CPU.z + 2.5);
        s.add(engraving);
        this.cpuRing = new THREE.Mesh(new THREE.TorusGeometry(CPU.size * 0.6, 0.08, 8, 120), glow(NEON.magenta, 2.4));
        this.cpuRing.rotation.x = Math.PI / 2;
        this.cpuRing.position.set(0, 0.4, CPU.z);
        s.add(this.cpuRing);
        const portrait = this.hologram(loader, '/profile.jpg', 10, 12.5, NEON.magenta, CPU.holo[1]);
        portrait.position.copy(v3(CPU.holo));
        s.add(portrait);
        const cl = new THREE.PointLight(NEON.magenta, 120, 40, 1.4);
        cl.position.set(0, 8, CPU.z + 12);
        s.add(cl);
    }

    private cpuEngraving() {
        return canvasTexture(1024, 512, (ctx) => {
            ctx.fillStyle = 'rgba(40,46,58,0.85)';
            ctx.font = `700 120px ${DISPLAY}`;
            ctx.fillText('AA·CORE', 60, 190);
            ctx.font = `500 44px ${MONO}`;
            ctx.fillText('MERN STACK · 3+ YRS', 64, 290);
            ctx.fillText('TRIPOLI · LEBANON', 64, 360);
        });
    }

    private ramTexture(exp: (typeof RAM_STICKS)[number]['exp'], i: number) {
        return canvasTexture(1160, 740, (ctx) => {
            ctx.fillStyle = '#0b2b23';
            ctx.fillRect(0, 0, 1160, 740);
            // gold edge contacts
            for (let x = 30; x < 1130; x += 18) {
                if (x > 560 && x < 600) continue; // the notch
                ctx.fillStyle = '#d9b45a';
                ctx.fillRect(x, 680, 11, 56);
            }
            // memory chips along the bottom
            for (let k = 0; k < 8; k++) {
                ctx.fillStyle = '#12151c';
                ctx.fillRect(40 + k * 138, 540, 118, 112);
                ctx.fillStyle = '#4a5466';
                ctx.font = `500 16px ${MONO}`;
                ctx.fillText(`D${k}·16Gb`, 52 + k * 138, 604);
            }
            // label sticker with the experience
            ctx.fillStyle = 'rgba(6,10,20,0.92)';
            ctx.fillRect(40, 36, 1080, 476);
            ctx.strokeStyle = NEON.violet;
            ctx.lineWidth = 4;
            ctx.strokeRect(40, 36, 1080, 476);
            ctx.fillStyle = NEON.violet;
            ctx.font = `500 26px ${MONO}`;
            ctx.fillText(`// MODULE ${String(i + 1).padStart(2, '0')}   ${exp.period.toUpperCase()}`, 80, 96);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = NEON.violet;
            ctx.shadowBlur = 18;
            ctx.font = `700 76px ${DISPLAY}`;
            let y = wrapText(ctx, exp.company, 80, 196, 1000, 80);
            ctx.shadowBlur = 0;
            ctx.fillStyle = NEON.magenta;
            ctx.font = `500 34px ${DISPLAY}`;
            y = wrapText(ctx, exp.role, 80, y + 60, 1000, 40);
            ctx.fillStyle = 'rgba(232,240,255,0.78)';
            ctx.font = `400 27px ${DISPLAY}`;
            y = wrapText(ctx, exp.description, 80, y + 52, 1000, 36);
            ctx.fillStyle = NEON.cyan;
            ctx.font = `500 22px ${MONO}`;
            ctx.fillText(exp.tech.join(' · '), 80, Math.min(y + 56, 488));
        });
    }

    private buildSkillParts() {
        SKILL_PARTS.forEach((sp, i) => {
            const hex = NEON_LIST[i % 4];
            const tex = canvasTexture(640, 200, (ctx) => {
                ctx.fillStyle = 'rgba(4,10,14,0.9)';
                ctx.beginPath();
                ctx.roundRect(10, 10, 620, 180, 16);
                ctx.fill();
                ctx.shadowColor = hex;
                ctx.shadowBlur = 22;
                ctx.strokeStyle = hex;
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.font = `700 74px ${DISPLAY}`;
                ctx.fillText(sp.skill.name, 40, 110);
                ctx.shadowBlur = 0;
                ctx.fillStyle = hex;
                ctx.font = `500 22px ${MONO}`;
                ctx.fillText(`${sp.skill.category.toUpperCase()}  ${sp.skill.level}%`, 42, 160);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(340, 150, 250, 8);
                ctx.fillStyle = hex;
                ctx.fillRect(340, 150, 250 * (sp.skill.level / 100), 8);
            });
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(3.8, 1.19),
                new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }),
            );
            plane.position.copy(v3(sp.label));
            this.scene.add(plane);
            // a thin light-pipe from the component up to its label
            const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.05, sp.label[1] - 0.6, 0.05), glow(hex, 1.4));
            stalk.position.set(sp.chip[0], (sp.label[1] - 0.6) / 2 + 0.5, sp.chip[2]);
            this.scene.add(stalk);
        });
    }

    private dotTexture() {
        const tex = canvasTexture(64, 64, (ctx) => {
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        });
        tex.colorSpace = THREE.NoColorSpace;
        return tex;
    }

    /* ================================================================ runtime */

    private resize = () => {
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.composer.setSize(w, h);
        this.bloom.resolution.set(w / 2, h / 2);
        this.camera.aspect = w / h;
        this.narrow = w / h < 1;
        this.camera.fov = this.narrow ? 64 : 58;
        this.camera.updateProjectionMatrix();
    };

    private onPointer = (e: PointerEvent) => {
        this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };

    private applyCamera(p: number) {
        const keys = CAMERA_KEYS;
        let i = 0;
        while (i < keys.length - 2 && p > keys[i + 1].p) i++;
        const a = keys[i];
        const b = keys[i + 1];
        const t = smooth(THREE.MathUtils.clamp((p - a.p) / (b.p - a.p || 1), 0, 1));

        const pos = this.tmpA.set(...a.pos).lerp(this.tmpB.set(...b.pos), t);
        const look = this.tmpLook.set(...a.look).lerp(this.tmpB.set(...b.look), t);

        // on tall/narrow screens pull the camera back so screens still fit, but stay over the bus
        if (this.narrow) {
            const k = Math.min(1.7, 1 + (1 - this.camera.aspect) * 1.2);
            pos.sub(look).multiplyScalar(k).add(look);
            if (pos.y < 20 && pos.z > SLOT_Z + 20) pos.x = THREE.MathUtils.clamp(pos.x, -5, 5);
        }

        this.camera.position.copy(pos);
        this.camera.position.x += this.pointerSmooth.x * 0.4;
        this.camera.position.y -= this.pointerSmooth.y * 0.25;
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(look);
        this.camera.rotateZ(THREE.MathUtils.lerp(a.roll ?? 0, b.roll ?? 0, t));

        this.colA.set(a.fog).lerp(this.colB.set(b.fog), t);
        this.fog.color.copy(this.colA);
        (this.scene.background as THREE.Color).copy(this.colA);
        this.fog.density = THREE.MathUtils.lerp(a.density, b.density, t);
    }

    private placePulse(i: number, dt: number) {
        const d = this.pulseData[i];
        const p = this.paths[d.path];
        d.s = (d.s + d.speed * dt) % p.len;
        let k = 1;
        while (k < p.cum.length - 1 && p.cum[k] < d.s) k++;
        const a = p.pts[k - 1];
        const b = p.pts[k];
        const seg = p.cum[k] - p.cum[k - 1] || 1;
        const t = (d.s - p.cum[k - 1]) / seg;
        this.dummy.position.set(a.x + (b.x - a.x) * t, 0.12, a.z + (b.z - a.z) * t);
        this.dummy.rotation.set(0, Math.atan2(b.x - a.x, b.z - a.z), 0);
        this.dummy.updateMatrix();
        this.pulses.setMatrixAt(i, this.dummy.matrix);
    }

    private loop = () => {
        this.raf = requestAnimationFrame(this.loop);
        const dt = Math.min(this.clock.getDelta(), 0.1);
        const elapsed = this.clock.elapsedTime;

        const k = 1 - Math.exp(-dt * 4.5);
        this.progress += (this.target - this.progress) * k;
        if (Math.abs(this.target - this.progress) < 1e-5) this.progress = this.target;
        this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 3));
        this.applyCamera(this.progress);

        for (let i = 0; i < this.pulseData.length; i++) this.placePulse(i, dt);
        this.pulses.instanceMatrix.needsUpdate = true;

        this.leds.opacity = 0.55 + 0.45 * Math.sin(elapsed * 3.1);
        const flicker = 0.1 + 0.04 * Math.sin(elapsed * 7) + 0.02 * Math.sin(elapsed * 23);
        this.beams.forEach((m) => (m.opacity = flicker));
        this.cpuRing.scale.setScalar(1 + 0.03 * Math.sin(elapsed * 2));

        this.composer.render();
        this.onProgress?.(this.progress);
    };
}
