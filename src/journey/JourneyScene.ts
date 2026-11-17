import * as THREE from 'three';
import { skills } from '../data';
import {
    CAMERA_KEYS,
    EXPERIENCE_SLABS,
    GALLERY,
    PORTRAIT_POS,
    PROJECT_FRAMES,
    SKILL_TUNNEL,
    type Vec3,
} from './journeyData';

const smooth = (t: number) => t * t * (3 - 2 * t);
const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

const GOLD = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 0.85, roughness: 0.32 });
const BRASS = new THREE.MeshStandardMaterial({ color: '#8a6a36', metalness: 0.9, roughness: 0.25 });

/** Image plane inside a gilded frame. The plane is resized to the image aspect once loaded. */
function framedImage(loader: THREE.TextureLoader, url: string, maxW: number, maxH: number, frameW = 0.22) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, transparent: true });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    group.add(plane);

    const bars = [0, 1, 2, 3].map(() => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), GOLD);
        group.add(m);
        return m;
    });
    const backing = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), new THREE.MeshStandardMaterial({ color: '#1a1410' }));
    backing.position.z = -0.08;
    group.add(backing);

    const layout = (aspect: number) => {
        let w = maxW;
        let h = w / aspect;
        if (h > maxH) {
            h = maxH;
            w = h * aspect;
        }
        plane.scale.set(w, h, 1);
        backing.scale.set(w + frameW * 2, h + frameW * 2, 1);
        const d = 0.18;
        bars[0].scale.set(w + frameW * 2, frameW, d);
        bars[0].position.set(0, h / 2 + frameW / 2, 0.02);
        bars[1].scale.set(w + frameW * 2, frameW, d);
        bars[1].position.set(0, -h / 2 - frameW / 2, 0.02);
        bars[2].scale.set(frameW, h, d);
        bars[2].position.set(-w / 2 - frameW / 2, 0, 0.02);
        bars[3].scale.set(frameW, h, d);
        bars[3].position.set(w / 2 + frameW / 2, 0, 0.02);
    };
    layout(maxW / maxH);

    loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        mat.map = tex;
        mat.needsUpdate = true;
        const img = tex.image as HTMLImageElement;
        layout(img.width / img.height);
    });

    return { group, mat };
}

/** Draws text onto a canvas and returns it as a texture. */
function textTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, y);
            line = word;
            y += lh;
        } else line = test;
    }
    if (line) ctx.fillText(line, x, y);
}

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

export class JourneyScene {
    private renderer: THREE.WebGLRenderer;
    private scene = new THREE.Scene();
    private camera: THREE.PerspectiveCamera;
    private fog: THREE.FogExp2;
    private clock = new THREE.Clock();
    private raf = 0;
    private progress = 0;
    private target = 0;
    private pointer = new THREE.Vector2();
    private pointerSmooth = new THREE.Vector2();
    private portrait!: { group: THREE.Group; mat: THREE.MeshStandardMaterial };
    private dust!: THREE.Points;
    private skillRing = new THREE.Group();
    private onProgress?: (p: number) => void;
    private tmpA = new THREE.Vector3();
    private tmpB = new THREE.Vector3();
    private colA = new THREE.Color();
    private colB = new THREE.Color();

    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement, onProgress?: (p: number) => void) {
        this.canvas = canvas;
        this.onProgress = onProgress;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
        this.fog = new THREE.FogExp2('#2b2118', 0.02);
        this.scene.fog = this.fog;
        this.scene.background = new THREE.Color('#2b2118');

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
        this.renderer.dispose();
    }

    /* ------------------------------------------------------------ building */

    private build() {
        const loader = new THREE.TextureLoader();
        const s = this.scene;

        s.add(new THREE.HemisphereLight('#ffe2b8', '#1a120c', 0.9));
        const key = new THREE.DirectionalLight('#ffd9a0', 1.4);
        key.position.set(4, 8, 6);
        s.add(key);

        // --- I. Portrait
        this.portrait = framedImage(loader, '/profile.jpg', 5, 6.2, 0.28);
        this.portrait.group.position.copy(v3(PORTRAIT_POS));
        s.add(this.portrait.group);
        const pl = new THREE.PointLight('#ffcf8a', 30, 18, 2);
        pl.position.set(0, 2, -5);
        s.add(pl);

        // --- II. Project frames, each with its own warm light and a floating plinth
        PROJECT_FRAMES.forEach((f) => {
            const fr = framedImage(loader, f.proj.image, 8.4, 5.4, 0.24);
            fr.group.position.copy(v3(f.pos));
            fr.group.rotation.y = f.rotY;
            s.add(fr.group);

            const light = new THREE.PointLight('#ffd29a', 45, 16, 2);
            light.position.set(f.pos[0] + Math.sin(f.rotY) * 4, f.pos[1] + 3, f.pos[2] + Math.cos(f.rotY) * 4);
            s.add(light);

            const plinth = new THREE.Mesh(
                new THREE.CylinderGeometry(3.2, 3.6, 0.4, 48),
                new THREE.MeshStandardMaterial({ color: '#2a211a', roughness: 0.6 }),
            );
            plinth.position.set(f.pos[0], f.pos[1] - 4.2, f.pos[2]);
            s.add(plinth);
        });

        // --- III. Skills: a spiralling tunnel of cards
        const cardGeo = new THREE.PlaneGeometry(2.6, 1.3);
        skills.forEach((sk, i) => {
            const tex = textTexture(
                (ctx, w, h) => {
                    ctx.fillStyle = 'rgba(20,15,12,0.82)';
                    ctx.fillRect(0, 0, w, h);
                    ctx.strokeStyle = 'rgba(214,180,120,0.7)';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(6, 6, w - 12, h - 12);
                    ctx.fillStyle = '#c9a874';
                    ctx.font = `500 26px ${SANS}`;
                    ctx.fillText(sk.category.toUpperCase(), 36, 58);
                    ctx.fillStyle = '#f3e7d3';
                    ctx.font = `500 74px ${SERIF}`;
                    ctx.fillText(sk.name, 34, 150);
                    ctx.fillStyle = 'rgba(243,231,211,0.18)';
                    ctx.fillRect(36, 200, w - 72, 6);
                    ctx.fillStyle = '#d6b478';
                    ctx.fillRect(36, 200, (w - 72) * (sk.level / 100), 6);
                },
                512,
                256,
            );
            const card = new THREE.Mesh(
                cardGeo,
                new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, fog: true }),
            );
            const t = i / skills.length;
            const angle = t * Math.PI * 4.2;
            const z = THREE.MathUtils.lerp(SKILL_TUNNEL.zStart, SKILL_TUNNEL.zEnd, t);
            card.position.set(Math.cos(angle) * SKILL_TUNNEL.radius, Math.sin(angle) * SKILL_TUNNEL.radius * 0.75, z);
            card.lookAt(0, 0, z + 6);
            this.skillRing.add(card);
        });
        s.add(this.skillRing);

        // glowing rings marking the tunnel
        for (let i = 0; i <= 6; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(SKILL_TUNNEL.radius + 1.4, 0.015, 8, 120),
                new THREE.MeshBasicMaterial({ color: '#d6b478', transparent: true, opacity: 0.45 }),
            );
            ring.position.z = THREE.MathUtils.lerp(SKILL_TUNNEL.zStart, SKILL_TUNNEL.zEnd, i / 6);
            s.add(ring);
        }

        // --- IV. Experience monoliths
        EXPERIENCE_SLABS.forEach((slab) => {
            const tex = textTexture(
                (ctx, w, h) => {
                    const g = ctx.createLinearGradient(0, 0, 0, h);
                    g.addColorStop(0, '#3a3029');
                    g.addColorStop(1, '#1c1612');
                    ctx.fillStyle = g;
                    ctx.fillRect(0, 0, w, h);
                    ctx.fillStyle = '#c9a874';
                    ctx.font = `500 30px ${SANS}`;
                    ctx.fillText(slab.exp.period.toUpperCase(), 60, 110);
                    ctx.fillStyle = '#f3e7d3';
                    ctx.font = `500 88px ${SERIF}`;
                    wrapText(ctx, slab.exp.company, 60, 240, w - 120, 92);
                    ctx.fillStyle = 'rgba(243,231,211,0.75)';
                    ctx.font = `italic 46px ${SERIF}`;
                    wrapText(ctx, slab.exp.role, 60, 470, w - 120, 54);
                    ctx.font = `400 28px ${SANS}`;
                    ctx.fillStyle = 'rgba(243,231,211,0.6)';
                    wrapText(ctx, slab.exp.description, 60, 640, w - 120, 42);
                    ctx.fillStyle = '#d6b478';
                    ctx.font = `500 24px ${SANS}`;
                    wrapText(ctx, slab.exp.tech.join('  ·  ').toUpperCase(), 60, h - 90, w - 120, 36);
                },
                768,
                1100,
            );
            const mono = new THREE.Mesh(
                new THREE.BoxGeometry(3.4, 4.9, 0.4),
                [
                    new THREE.MeshStandardMaterial({ color: '#241c16' }),
                    new THREE.MeshStandardMaterial({ color: '#241c16' }),
                    new THREE.MeshStandardMaterial({ color: '#241c16' }),
                    new THREE.MeshStandardMaterial({ color: '#241c16' }),
                    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35 }),
                    new THREE.MeshStandardMaterial({ color: '#241c16' }),
                ],
            );
            mono.position.copy(v3(slab.pos));
            mono.rotation.y = slab.rotY;
            s.add(mono);
            const l = new THREE.PointLight('#ffcf8a', 20, 10, 2);
            l.position.set(slab.pos[0] + Math.sin(slab.rotY) * 3, 2.5, slab.pos[2] + Math.cos(slab.rotY) * 3);
            s.add(l);
        });

        // --- V. The gallery
        this.buildGallery(loader);

        // --- dust motes along the whole route
        const count = 2600;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
            pos[i * 3 + 2] = 12 - Math.random() * 240;
        }
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.dust = new THREE.Points(
            dg,
            new THREE.PointsMaterial({
                color: '#ffdcae',
                size: 0.05,
                transparent: true,
                opacity: 0.75,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            }),
        );
        s.add(this.dust);
    }

    private buildGallery(loader: THREE.TextureLoader) {
        const s = this.scene;
        const { z, backWall, width, height } = GALLERY;
        const depth = 40;
        const cz = backWall + depth / 2;

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(width, depth),
            new THREE.MeshStandardMaterial({ color: '#4a3f36', roughness: 0.28, metalness: 0.25 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -1.2, cz);
        s.add(floor);

        const wallMat = new THREE.MeshStandardMaterial({ color: '#3d3329', roughness: 0.95 });
        const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
        back.position.set(0, height / 2 - 1.2, backWall);
        s.add(back);
        for (const side of [-1, 1]) {
            const w = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
            w.rotation.y = -side * Math.PI / 2;
            w.position.set(side * width / 2, height / 2 - 1.2, cz);
            s.add(w);
        }
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: '#15110e' }));
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(0, height - 1.2, cz);
        s.add(ceil);

        // fluted columns
        const stone = new THREE.MeshStandardMaterial({ color: '#cbb89a', roughness: 0.7 });
        for (const side of [-1, 1]) {
            for (let i = 0; i < 3; i++) {
                const col = new THREE.Group();
                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.68, height - 2, 20), stone);
                shaft.position.y = (height - 2) / 2 - 0.2;
                const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), stone);
                base.position.y = -0.95;
                const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), stone);
                cap.position.y = height - 2.0;
                col.add(shaft, base, cap);
                col.position.set(side * 11.5, -1.2 + 0.95 + 0.25, backWall + 3 + i * 9);
                s.add(col);
            }
        }

        // the masterpiece
        const main = framedImage(loader, '/profile.jpg', 9, 7, 0.4);
        main.group.position.set(0, 4.4, backWall + 0.15);
        s.add(main.group);

        const spot = new THREE.SpotLight('#ffe0b0', 260, 30, 0.42, 0.55, 1.6);
        spot.position.set(0, height - 2, backWall + 9);
        spot.target.position.set(0, 4.4, backWall);
        s.add(spot, spot.target);
        for (const side of [-1, 1]) {
            const p = new THREE.PointLight('#ffb870', 18, 14, 2);
            p.position.set(side * 10, height - 3, backWall + 6);
            s.add(p);
        }
        const fill = new THREE.PointLight('#ffd7a8', 25, 30, 2);
        fill.position.set(0, 4, z + 8);
        s.add(fill);

        // velvet rope barrier
        const posts: number[] = [-7.5, -2.5, 2.5, 7.5];
        const ropeZ = backWall + 5;
        posts.forEach((x) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 12), BRASS);
            post.position.set(x, -0.25, ropeZ);
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 24), BRASS);
            base.position.set(x, -1.16, ropeZ);
            const top = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), BRASS);
            top.position.set(x, 0.75, ropeZ);
            s.add(post, base, top);
        });
        const ropeMat = new THREE.MeshStandardMaterial({ color: '#1b1210', roughness: 0.8 });
        for (let i = 0; i < posts.length - 1; i++) {
            const a = new THREE.Vector3(posts[i], 0.65, ropeZ);
            const b = new THREE.Vector3(posts[i + 1], 0.65, ropeZ);
            const mid = a.clone().add(b).multiplyScalar(0.5).setY(-0.2);
            const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 24, 0.05, 8), ropeMat);
            s.add(rope);
        }
    }

    /* ------------------------------------------------------------ runtime */

    private resize = () => {
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        // keep frames readable on portrait screens
        this.camera.fov = w / h < 0.8 ? 72 : 55;
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

        this.tmpA.set(...a.pos).lerp(this.tmpB.set(...b.pos), t);
        this.camera.position.copy(this.tmpA);
        // subtle hand-held parallax from the pointer
        this.camera.position.x += this.pointerSmooth.x * 0.35;
        this.camera.position.y -= this.pointerSmooth.y * 0.2;

        const look = new THREE.Vector3(...a.look).lerp(this.tmpB.set(...b.look), t);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(look);
        const roll = THREE.MathUtils.lerp(a.roll ?? 0, b.roll ?? 0, t);
        this.camera.rotateZ(roll);

        this.colA.set(a.fog).lerp(this.colB.set(b.fog), t);
        this.fog.color.copy(this.colA);
        (this.scene.background as THREE.Color).copy(this.colA);
        this.fog.density = THREE.MathUtils.lerp(a.density, b.density, t);
    }

    private loop = () => {
        this.raf = requestAnimationFrame(this.loop);
        const dt = Math.min(this.clock.getDelta(), 0.1);
        const elapsed = this.clock.elapsedTime;

        // critically-damped follow of the scroll target → buttery scrubbing
        const k = 1 - Math.exp(-dt * 4.5);
        this.progress += (this.target - this.progress) * k;
        if (Math.abs(this.target - this.progress) < 1e-5) this.progress = this.target;
        this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-dt * 3));

        this.applyCamera(this.progress);

        // the portrait dissolves as we pass through it
        const dz = this.camera.position.z - PORTRAIT_POS[2];
        this.portrait.mat.opacity = THREE.MathUtils.clamp(dz / 3, 0, 1);
        this.portrait.group.visible = dz > -0.5;

        this.skillRing.rotation.z = elapsed * 0.05;
        this.dust.rotation.y = Math.sin(elapsed * 0.05) * 0.02;
        this.dust.position.y = Math.sin(elapsed * 0.2) * 0.15;

        this.renderer.render(this.scene, this.camera);
        this.onProgress?.(this.progress);
    };
}
