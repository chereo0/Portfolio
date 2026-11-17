import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
    AVENUE_HALF,
    CAMERA_KEYS,
    CITY_END_Z,
    CROSS_STREETS,
    CROWN,
    EXPERIENCE_TOWERS,
    INTRO_BILLBOARD,
    PLAZA_Z,
    PROJECT_TOWERS,
    SKILL_SIGNS,
    type Vec3,
} from './journeyData';

const NEON = { cyan: '#22d3ee', magenta: '#f472b6', violet: '#a78bfa', amber: '#fbbf24' };
const NEON_LIST = [NEON.cyan, NEON.magenta, NEON.violet, NEON.amber];
const DISPLAY = '"Space Grotesk", Inter, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const WINDOW_UNITS = 16; // the window texture covers 16×16 world units

const smooth = (t: number) => t * t * (3 - 2 * t);
const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

/** Seeded random so the skyline is the same on every visit. */
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
    private traffic!: THREE.InstancedMesh;
    private trafficData: { x: number; z: number; speed: number }[] = [];
    private beacons!: THREE.PointsMaterial;
    private narrow = false;
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

        this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 600);
        this.fog = new THREE.FogExp2('#060914', 0.008);
        this.scene.fog = this.fog;
        this.scene.background = new THREE.Color('#060914');

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.85, 0.55, 0.72);
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
        this.composer.dispose();
        this.renderer.dispose();
    }

    /* ================================================================ build */

    private build() {
        const loader = new THREE.TextureLoader();
        const s = this.scene;

        s.add(new THREE.HemisphereLight('#5d6dff', '#05060c', 0.9));
        const moon = new THREE.DirectionalLight('#8fa8ff', 0.5);
        moon.position.set(-30, 60, 20);
        s.add(moon);

        this.buildGround();
        this.buildSkyline(loader);
        this.buildStreetLife();
        this.buildSkillSigns();
        this.buildStars();
    }

    /** Lit-window texture shared by every building. */
    private windowTexture() {
        const r = rng(7);
        const tex = canvasTexture(512, 512, (ctx) => {
            ctx.fillStyle = '#04060c';
            ctx.fillRect(0, 0, 512, 512);
            // two windows per world unit across, one floor per unit up
            const cols = WINDOW_UNITS * 2;
            const cw = 512 / cols;
            const ch = 512 / WINDOW_UNITS;
            const palette = ['#ffd27a', '#ffe7b0', '#9be7ff', '#e8f0ff', '#ffd27a', '#ff8ad8'];
            for (let y = 0; y < WINDOW_UNITS; y++) {
                // whole floors tend to be lit together, like real offices
                const floorLit = r() < 0.25 ? 0.7 : 0.18;
                for (let x = 0; x < cols; x++) {
                    const lit = r() < floorLit;
                    ctx.fillStyle = lit ? palette[Math.floor(r() * palette.length)] : '#111a30';
                    ctx.globalAlpha = lit ? 0.5 + r() * 0.5 : 1;
                    ctx.fillRect(x * cw + 3, y * ch + 9, cw - 6, ch - 16);
                }
            }
            ctx.globalAlpha = 1;
        });
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    /** A box whose UVs are in world units so windows tile evenly on any size. */
    private buildingGeo(w: number, h: number, d: number, x: number, z: number, r: () => number) {
        const g = new THREE.BoxGeometry(w, h, d);
        const uv = g.attributes.uv as THREE.BufferAttribute;
        const ou = Math.floor(r() * WINDOW_UNITS) / WINDOW_UNITS;
        const ov = Math.floor(r() * WINDOW_UNITS) / WINDOW_UNITS;
        for (let face = 0; face < 6; face++) {
            for (let k = 0; k < 4; k++) {
                const i = face * 4 + k;
                if (face === 2 || face === 3) {
                    uv.setXY(i, 0.001, 0.001); // roofs: dark gap colour
                    continue;
                }
                const span = face < 2 ? d : w;
                uv.setXY(i, uv.getX(i) * (span / WINDOW_UNITS) + ou, uv.getY(i) * (h / WINDOW_UNITS) + ov);
            }
        }
        g.translate(x, h / 2, z);
        return g;
    }

    private buildGround() {
        const s = this.scene;
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 600),
            new THREE.MeshStandardMaterial({ color: '#03050a', roughness: 0.95 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.02, -120);
        s.add(ground);

        // wet-looking asphalt for the avenue and cross streets
        const asphalt = new THREE.MeshStandardMaterial({ color: '#0a0e1c', roughness: 0.35, metalness: 0.6 });
        const avenue = new THREE.Mesh(new THREE.PlaneGeometry(AVENUE_HALF * 2, 360), asphalt);
        avenue.rotation.x = -Math.PI / 2;
        avenue.position.set(0, 0, -110);
        s.add(avenue);
        CROSS_STREETS.forEach((z) => {
            const st = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), asphalt);
            st.rotation.x = -Math.PI / 2;
            st.position.set(0, 0.005, z);
            s.add(st);
        });

        // lane dashes + glowing kerb lines
        const dashes: THREE.BufferGeometry[] = [];
        for (let z = 60; z > PLAZA_Z + 20; z -= 6) {
            for (const x of [-3.3, 0, 3.3]) {
                const g = new THREE.PlaneGeometry(x === 0 ? 0.14 : 0.08, 2.6);
                g.rotateX(-Math.PI / 2);
                g.translate(x, 0.02, z);
                dashes.push(g);
            }
        }
        s.add(new THREE.Mesh(mergeGeometries(dashes), new THREE.MeshBasicMaterial({ color: '#3a4670' })));
        for (const side of [-1, 1]) {
            const kerb = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 300), glow(side < 0 ? NEON.cyan : NEON.magenta, 1.3));
            kerb.rotation.x = -Math.PI / 2;
            kerb.position.set(side * AVENUE_HALF, 0.03, -90);
            s.add(kerb);
        }

        // plaza: a glowing grid
        const grid = new THREE.GridHelper(70, 35, NEON.cyan, '#1b2a4a');
        grid.position.set(0, 0.04, PLAZA_Z + 4);
        (grid.material as THREE.Material).transparent = true;
        (grid.material as THREE.Material).opacity = 0.5;
        s.add(grid);
    }

    private buildSkyline(loader: THREE.TextureLoader) {
        const s = this.scene;
        const r = rng(42);
        const geos: THREE.BufferGeometry[] = [];
        const roofLines: number[] = [];
        const roofColors: number[] = [];
        const beaconPos: number[] = [];
        const c = new THREE.Color();

        const reserved = (x: number, z: number) => {
            if (Math.abs(x) < 16 && Math.abs(z - INTRO_BILLBOARD[2]) < 9 && x < 0) return true;
            if (PROJECT_TOWERS.some((t) => Math.sign(x) === t.side && Math.abs(x) < 20 && Math.abs(z - t.z) < 11)) return true;
            if (z < PLAZA_Z + 16 && Math.abs(x) < 36) return true;
            if (z < CROWN.z + 14 && Math.abs(x) < 16) return true;
            return false;
        };
        const nearStreet = (z: number) => CROSS_STREETS.some((cz) => Math.abs(z - cz) < 6);

        const addRoof = (x: number, y: number, z: number, w: number, d: number, hex: string) => {
            const pts = [
                [x - w / 2, z - d / 2], [x + w / 2, z - d / 2],
                [x + w / 2, z - d / 2], [x + w / 2, z + d / 2],
                [x + w / 2, z + d / 2], [x - w / 2, z + d / 2],
                [x - w / 2, z + d / 2], [x - w / 2, z - d / 2],
            ];
            c.set(hex).multiplyScalar(1.8);
            pts.forEach(([px, pz]) => {
                roofLines.push(px, y + 0.05, pz);
                roofColors.push(c.r, c.g, c.b);
            });
        };

        for (let k = 0; k < 8; k++) {
            for (const side of [-1, 1]) {
                const lx = side * (12 + k * 10);
                for (let z = 40; z > CITY_END_Z; z -= 10) {
                    if (nearStreet(z) || reserved(lx, z)) continue;
                    const w = 6 + r() * 2.6;
                    const d = 6 + r() * 2.6;
                    let h = 8 + r() * 20 + k * 3;
                    if (r() < 0.12) h += 25 + r() * 30;
                    const x = lx + (k === 0 ? side * (8.6 - w) / 2 : (r() - 0.5));
                    geos.push(this.buildingGeo(w, h, d, x, z, r));
                    if (r() < 0.35) addRoof(x, h, z, w, d, NEON_LIST[Math.floor(r() * 4)]);
                    if (h > 40) beaconPos.push(x, h + 1.2, z);
                }
            }
        }

        // hero buildings
        const hero = (x: number, z: number, w: number, h: number, d: number, neon: string) => {
            geos.push(this.buildingGeo(w, h, d, x, z, r));
            addRoof(x, h, z, w, d, neon);
            beaconPos.push(x, h + 1.5, z);
        };
        hero(-13.5, INTRO_BILLBOARD[2], 9, 40, 12, NEON.cyan);
        PROJECT_TOWERS.forEach((t, i) => hero(t.center[0], t.z, 9, 34 + i * 6, 15, NEON_LIST[i % 4]));
        EXPERIENCE_TOWERS.forEach((t) => hero(t.x, PLAZA_Z, 12, 34, 12, NEON.violet));
        hero(0, CROWN.z, 18, CROWN.height, 16, NEON.magenta);

        const windows = this.windowTexture();
        const city = new THREE.Mesh(
            mergeGeometries(geos),
            new THREE.MeshStandardMaterial({
                color: '#1a2440',
                roughness: 0.6,
                metalness: 0.3,
                emissive: '#ffffff',
                emissiveMap: windows,
                emissiveIntensity: 0.95,
            }),
        );
        s.add(city);

        const rg = new THREE.BufferGeometry();
        rg.setAttribute('position', new THREE.Float32BufferAttribute(roofLines, 3));
        rg.setAttribute('color', new THREE.Float32BufferAttribute(roofColors, 3));
        s.add(new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })));

        const bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.Float32BufferAttribute(beaconPos, 3));
        this.beacons = new THREE.PointsMaterial({
            color: new THREE.Color('#ff2b4a').multiplyScalar(2.5),
            size: 0.9,
            map: this.dotTexture(),
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        });
        s.add(new THREE.Points(bg, this.beacons));

        // billboards
        const intro = this.billboard(loader, '/profile.jpg', 8, 10.5, NEON.cyan);
        intro.position.copy(v3(INTRO_BILLBOARD));
        intro.rotation.y = Math.PI / 2;
        s.add(intro);

        PROJECT_TOWERS.forEach((t, i) => {
            const b = this.billboard(loader, t.proj.image, 13, 9, NEON_LIST[i % 4]);
            b.position.copy(v3(t.billboard));
            b.rotation.y = -t.side * Math.PI / 2;
            s.add(b);
            const wash = new THREE.PointLight(NEON_LIST[i % 4], 60, 30, 1.6);
            wash.position.set(t.billboard[0] * 0.4, 4, t.z);
            s.add(wash);
        });

        EXPERIENCE_TOWERS.forEach((t, i) => {
            const screen = new THREE.Mesh(
                new THREE.PlaneGeometry(9, 12),
                new THREE.MeshBasicMaterial({ map: this.experienceTexture(t.exp, i), toneMapped: false }),
            );
            screen.position.copy(v3(t.screen));
            s.add(screen);
            this.neonFrame(screen, 9, 12, NEON.violet);
            const wash = new THREE.PointLight(NEON.violet, 40, 26, 1.6);
            wash.position.set(t.x, 3, PLAZA_Z + 12);
            s.add(wash);
        });

        const crown = this.billboard(loader, '/profile.jpg', 12, 15, NEON.magenta);
        crown.position.copy(v3(CROWN.billboard));
        s.add(crown);
        const crownWash = new THREE.PointLight(NEON.magenta, 120, 60, 1.4);
        crownWash.position.set(0, 40, CROWN.z + 20);
        s.add(crownWash);
    }

    /** Thin glowing border boxes around a plane (added as children). */
    private neonFrame(parent: THREE.Object3D, w: number, h: number, hex: string) {
        const mat = glow(hex);
        const t = 0.16;
        const parts: [number, number, number, number][] = [
            [w + t * 2, t, 0, h / 2 + t / 2],
            [w + t * 2, t, 0, -h / 2 - t / 2],
            [t, h, -w / 2 - t / 2, 0],
            [t, h, w / 2 + t / 2, 0],
        ];
        const meshes = parts.map(([sw, sh, x, y]) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.12), mat);
            m.scale.set(sw, sh, 1);
            m.position.set(x, y, 0.02);
            parent.add(m);
            return m;
        });
        return (nw: number, nh: number) => {
            meshes[0].scale.set(nw + t * 2, t, 1);
            meshes[0].position.set(0, nh / 2 + t / 2, 0.02);
            meshes[1].scale.set(nw + t * 2, t, 1);
            meshes[1].position.set(0, -nh / 2 - t / 2, 0.02);
            meshes[2].scale.set(t, nh, 1);
            meshes[2].position.set(-nw / 2 - t / 2, 0, 0.02);
            meshes[3].scale.set(t, nh, 1);
            meshes[3].position.set(nw / 2 + t / 2, 0, 0.02);
        };
    }

    /** Image screen with neon frame; resizes to the image's aspect once loaded. */
    private billboard(loader: THREE.TextureLoader, url: string, maxW: number, maxH: number, hex: string) {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: '#1a2140', toneMapped: false });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        group.add(plane);
        const back = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.3), new THREE.MeshStandardMaterial({ color: '#05070d' }));
        back.position.z = -0.2;
        group.add(back);
        const relayout = this.neonFrame(group, maxW, maxH, hex);

        const layout = (aspect: number) => {
            let w = maxW;
            let h = w / aspect;
            if (h > maxH) {
                h = maxH;
                w = h * aspect;
            }
            plane.scale.set(w, h, 1);
            back.scale.set(w + 0.6, h + 0.6, 1);
            relayout(w, h);
        };
        layout(maxW / maxH);
        loader.load(url, (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 8;
            mat.map = tex;
            mat.color.set('#c8c8c8');
            mat.needsUpdate = true;
            const img = tex.image as HTMLImageElement;
            layout(img.width / img.height);
        });
        return group;
    }

    private experienceTexture(exp: (typeof EXPERIENCE_TOWERS)[number]['exp'], i: number) {
        return canvasTexture(600, 800, (ctx) => {
            const g = ctx.createLinearGradient(0, 0, 0, 800);
            g.addColorStop(0, '#120c2a');
            g.addColorStop(1, '#070815');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 600, 800);
            ctx.strokeStyle = 'rgba(167,139,250,0.25)';
            for (let y = 0; y < 800; y += 4) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(600, y);
                ctx.stroke();
            }
            ctx.fillStyle = NEON.violet;
            ctx.font = `500 22px ${MONO}`;
            ctx.fillText(`// ROLE ${String(i + 1).padStart(2, '0')}`, 44, 70);
            ctx.fillStyle = '#9be7ff';
            ctx.fillText(exp.period.toUpperCase(), 44, 110);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = NEON.violet;
            ctx.shadowBlur = 18;
            ctx.font = `700 64px ${DISPLAY}`;
            let y = wrapText(ctx, exp.company, 44, 210, 512, 68);
            ctx.shadowBlur = 0;
            ctx.fillStyle = NEON.magenta;
            ctx.font = `500 30px ${DISPLAY}`;
            y = wrapText(ctx, exp.role, 44, y + 70, 512, 38);
            ctx.fillStyle = 'rgba(232,240,255,0.75)';
            ctx.font = `400 24px ${DISPLAY}`;
            wrapText(ctx, exp.description, 44, y + 70, 512, 34);
            ctx.fillStyle = NEON.cyan;
            ctx.font = `500 19px ${MONO}`;
            wrapText(ctx, exp.tech.join(' · '), 44, 720, 512, 28);
        });
    }

    private buildSkillSigns() {
        SKILL_SIGNS.forEach((sign, i) => {
            const hex = NEON_LIST[i % 4];
            const tex = canvasTexture(640, 200, (ctx) => {
                ctx.fillStyle = 'rgba(6,8,18,0.92)';
                ctx.beginPath();
                ctx.roundRect(10, 10, 620, 180, 22);
                ctx.fill();
                ctx.shadowColor = hex;
                ctx.shadowBlur = 22;
                ctx.strokeStyle = hex;
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.font = `700 76px ${DISPLAY}`;
                ctx.fillText(sign.skill.name, 40, 112);
                ctx.shadowBlur = 0;
                ctx.fillStyle = hex;
                ctx.font = `500 22px ${MONO}`;
                ctx.fillText(`${sign.skill.category.toUpperCase()}  ${sign.skill.level}%`, 42, 162);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(340, 152, 250, 8);
                ctx.fillStyle = hex;
                ctx.fillRect(340, 152, 250 * (sign.skill.level / 100), 8);
            });
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(4.6, 1.44),
                new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }),
            );
            plane.position.copy(v3(sign.pos));
            this.scene.add(plane);
            // bracket back to the facade
            const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: '#2a2f45', metalness: 0.8 }));
            arm.position.set(sign.side * 8.3, sign.pos[1] + 0.8, sign.pos[2]);
            this.scene.add(arm);
            const l = new THREE.PointLight(hex, 10, 9, 2);
            l.position.set(sign.pos[0], sign.pos[1], sign.pos[2] + 1);
            this.scene.add(l);
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

    private buildStreetLife() {
        const s = this.scene;
        const r = rng(3);

        // street lamps
        const lamps: number[] = [];
        for (let z = 50; z > PLAZA_Z + 14; z -= 9) for (const side of [-1, 1]) lamps.push(side * 6.6, 6, z);
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(lamps, 3));
        s.add(
            new THREE.Points(
                lg,
                new THREE.PointsMaterial({
                    color: new THREE.Color('#ffb36b').multiplyScalar(2),
                    size: 1.1,
                    map: this.dotTexture(),
                    transparent: true,
                    depthWrite: false,
                    toneMapped: false,
                }),
            ),
        );
        const poles: THREE.BufferGeometry[] = [];
        for (let i = 0; i < lamps.length; i += 3) {
            const g = new THREE.CylinderGeometry(0.05, 0.07, 6, 6);
            g.translate(lamps[i] + Math.sign(lamps[i]) * 0.3, 3, lamps[i + 2]);
            poles.push(g);
        }
        s.add(new THREE.Mesh(mergeGeometries(poles), new THREE.MeshStandardMaterial({ color: '#1c2236', metalness: 0.7, roughness: 0.4 })));

        // traffic: headlights come toward you, tail-lights drive away
        const count = 140;
        this.traffic = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.22, 1.4), new THREE.MeshBasicMaterial({ toneMapped: false }), count);
        const white = new THREE.Color('#dfefff').multiplyScalar(2.2);
        const red = new THREE.Color('#ff2d55').multiplyScalar(2.2);
        for (let i = 0; i < count; i++) {
            const lane = [-4.8, -1.7, 1.7, 4.8][i % 4];
            const toward = lane < 0;
            this.trafficData.push({ x: lane, z: 50 - r() * 290, speed: (toward ? 1 : -1) * (9 + r() * 7) });
            this.traffic.setColorAt(i, toward ? white : red);
        }
        s.add(this.traffic);
    }

    private buildStars() {
        const r = rng(11);
        const pos: number[] = [];
        for (let i = 0; i < 1400; i++) {
            const a = r() * Math.PI * 2;
            const rad = 150 + r() * 220;
            pos.push(Math.cos(a) * rad, 70 + r() * 160, -120 + Math.sin(a) * rad);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#c9d6ff', size: 0.7, fog: false, transparent: true, opacity: 0.8 })));
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

        // on tall/narrow screens pull the camera back so screens still fit, but stay in the street
        if (this.narrow) {
            const k = Math.min(1.7, 1 + (1 - this.camera.aspect) * 1.2);
            pos.sub(look).multiplyScalar(k).add(look);
            if (pos.y < 30) pos.x = THREE.MathUtils.clamp(pos.x, -5.5, 5.5);
            if (pos.z < PLAZA_Z + 8) pos.z = PLAZA_Z + 8;
        }

        this.camera.position.copy(pos);
        this.camera.position.x += this.pointerSmooth.x * 0.5;
        this.camera.position.y -= this.pointerSmooth.y * 0.3;
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(look);
        this.camera.rotateZ(THREE.MathUtils.lerp(a.roll ?? 0, b.roll ?? 0, t));

        this.colA.set(a.fog).lerp(this.colB.set(b.fog), t);
        this.fog.color.copy(this.colA);
        (this.scene.background as THREE.Color).copy(this.colA);
        this.fog.density = THREE.MathUtils.lerp(a.density, b.density, t);
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

        this.trafficData.forEach((car, i) => {
            car.z += car.speed * dt;
            if (car.z > 55) car.z = -240;
            if (car.z < -240) car.z = 55;
            this.dummy.position.set(car.x, 0.35, car.z);
            this.dummy.updateMatrix();
            this.traffic.setMatrixAt(i, this.dummy.matrix);
        });
        this.traffic.instanceMatrix.needsUpdate = true;
        this.beacons.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 2.4));

        this.composer.render();
        this.onProgress?.(this.progress);
    };
}
