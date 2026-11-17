import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { personalInfo } from '../data';
import { JourneyScene } from './JourneyScene';
import { chapters, groups, type Chapter } from './journeyData';
import './journey.css';

const findChapter = (p: number) => Math.max(0, chapters.findIndex((c) => p >= c.start && p < c.end));

export const ScrollJourney: React.FC = () => {
    const trackRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const pctRef = useRef<HTMLSpanElement>(null);
    const [active, setActive] = useState(0);
    const [atStart, setAtStart] = useState(true);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const track = trackRef.current;
        if (!canvas || !track) return;

        let last = -1;
        let lastStart = true;
        let scene: JourneyScene | null = null;
        let cancelled = false;
        const onProgress = (p: number) => {
            groups.forEach((g, i) => {
                const el = barRefs.current[i];
                if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - g.start) / (g.end - g.start)))})`;
            });
            if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}%`;
            const idx = findChapter(p);
            if (idx !== last) {
                last = idx;
                setActive(idx);
            }
            const s = p < 0.015;
            if (s !== lastStart) {
                lastStart = s;
                setAtStart(s);
            }
        };

        const onScroll = () => {
            const rect = track.getBoundingClientRect();
            const total = track.offsetHeight - window.innerHeight;
            scene?.setTarget(total > 0 ? -rect.top / total : 0);
        };
        // the 3D cards are drawn with the serif, so give it a moment to load first
        const fontsReady = Promise.all([
            document.fonts.load('500 74px "Cormorant Garamond"'),
            document.fonts.load('500 26px Inter'),
        ]).catch(() => undefined);
        Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
            if (cancelled) return;
            scene = new JourneyScene(canvas, onProgress);
            onScroll();
            setReady(true);
        });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelled = true;
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            scene?.dispose();
        };
    }, []);

    const scrollToProgress = (p: number) => {
        const track = trackRef.current;
        if (!track) return;
        const top = track.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + p * (track.offsetHeight - window.innerHeight), behavior: 'smooth' });
    };

    const chapter: Chapter = chapters[active];
    const group = chapter.group;

    return (
        <section ref={trackRef} className="journey-track" id="home">
            <div className="journey-stage">
                <canvas ref={canvasRef} className="journey-canvas" />
                <div className="journey-vignette" />
                <div className="journey-grain" />

                <div className={`journey-ui ${ready ? 'is-ready' : ''}`}>
                    {/* top bar */}
                    <header className="j-top">
                        <nav className="j-top-left">
                            <a href="/AbdelrmanCV.pdf" target="_blank" rel="noreferrer">CV</a>
                            <a href={personalInfo.socials.github} target="_blank" rel="noreferrer">GitHub</a>
                            <button type="button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                                Contact
                            </button>
                        </nav>
                        <button type="button" className="j-mark" onClick={() => scrollToProgress(0)}>
                            {personalInfo.name.split(' ').map((w) => (
                                <span key={w}>{w}</span>
                            ))}
                        </button>
                        <div className="j-top-right">
                            <span className="j-dot" /> scroll <span ref={pctRef}>0%</span>
                        </div>
                    </header>

                    {/* mini-map card */}
                    {chapter.mini && (
                        <figure key={`mini-${chapter.id}`} className="j-mini">
                            <img src={chapter.mini.image} alt="" />
                            <figcaption>{chapter.mini.label}</figcaption>
                        </figure>
                    )}

                    {/* side caption */}
                    {chapter.caption && (
                        <p key={`cap-${chapter.id}`} className="j-caption">
                            {chapter.caption}
                        </p>
                    )}

                    {/* centered whisper for interludes */}
                    {chapter.whisper && (
                        <p key={`wh-${chapter.id}`} className="j-whisper">
                            {chapter.whisper}
                        </p>
                    )}

                    {/* big title */}
                    {chapter.title && (
                        <div key={`t-${chapter.id}`} className="j-title-wrap">
                            <p className="j-eyebrow">{chapter.eyebrow}</p>
                            <h1 className="j-title">
                                {chapter.title.split(' ').map((word, i) => (
                                    <span key={i} style={{ animationDelay: `${i * 70}ms` }}>
                                        {word}&nbsp;
                                    </span>
                                ))}
                            </h1>
                        </div>
                    )}

                    {/* chapter strip */}
                    <footer className="j-bottom">
                        <ol className="j-strip">
                            {groups.map((g, i) => (
                                <li key={g.label} className={i === group ? 'is-active' : ''}>
                                    <button type="button" onClick={() => scrollToProgress(g.start + 0.02)}>
                                        <span className="j-bar">
                                            <span ref={(el) => { barRefs.current[i] = el; }} />
                                        </span>
                                        <span className="j-strip-body">
                                            {g.thumb ? (
                                                <img src={g.thumb} alt="" />
                                            ) : (
                                                <span className="j-numeral">{g.numeral}</span>
                                            )}
                                            <span className="j-strip-text">
                                                <small>{g.numeral}/V — {g.sub}</small>
                                                <strong>{g.label}</strong>
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>

                        {chapter.cta ? (
                            chapter.cta.external ? (
                                <a key={chapter.id} className="j-pill" href={chapter.cta.href}>
                                    {chapter.cta.label} <span aria-hidden>→</span>
                                </a>
                            ) : (
                                <Link key={chapter.id} className="j-pill" to={chapter.cta.href}>
                                    {chapter.cta.label} <span aria-hidden>→</span>
                                </Link>
                            )
                        ) : (
                            <button type="button" className="j-pill" onClick={() => scrollToProgress(Math.min(1, chapter.end + 0.01))}>
                                next <span aria-hidden>↓</span>
                            </button>
                        )}
                    </footer>

                    {atStart && (
                        <div className="j-hint">
                            <span>scroll to enter</span>
                            <i />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
