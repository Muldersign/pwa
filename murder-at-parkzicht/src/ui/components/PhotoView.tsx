import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Hotspot, PhotoFigure, PhotoObject, PhotoScene } from '../../engine/types';

const W = 400;
const H = 260;
const BASE = 255;

type Pt = { x: number; y: number };

const POSES: Record<string, { l: [number, number]; r: [number, number] }> = {
  stand: { l: [-31, -60], r: [31, -60] },
  hold: { l: [-13, -82], r: [13, -82] },
  sit: { l: [-13, -82], r: [13, -82] },
  sing: { l: [-31, -60], r: [11, -138] },
  'arms-up': { l: [-36, -192], r: [36, -192] },
  point: { l: [-31, -60], r: [58, -112] },
};

export function figureGeom(f: PhotoFigure) {
  const s = f.scale ?? 1;
  const cx = f.x;
  const pose = POSES[f.pose ?? 'stand'];
  const p = (dx: number, dy: number): Pt => ({ x: cx + dx * s, y: BASE + dy * s });
  const shoulderL = p(-22, -120);
  const shoulderR = p(22, -120);
  const wristL = p(...pose.l);
  const wristR = p(...pose.r);
  const ext = (sh: Pt, w: Pt): Pt => {
    const dx = w.x - sh.x;
    const dy = w.y - sh.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: w.x + (dx / len) * 6 * s, y: w.y + (dy / len) * 6 * s };
  };
  return {
    s,
    cx,
    head: p(0, -150),
    chest: p(0, -95),
    shoulderL,
    shoulderR,
    wristL,
    wristR,
    handL: ext(shoulderL, wristL),
    handR: ext(shoulderR, wristR),
  };
}

function hotspotPos(scene: PhotoScene, h: Hotspot): Pt & { r: number } {
  if (h.anchor) {
    const g = figureGeom(scene.figures[h.anchor.figure]);
    const map = { wristL: g.wristL, wristR: g.wristR, head: g.head, chest: g.chest, hand: g.handR };
    const pt = map[h.anchor.part];
    return { ...pt, r: h.r ?? 12 * g.s + 2 };
  }
  return { x: h.x ?? 0, y: h.y ?? 0, r: h.r ?? 14 };
}

const PALETTES = {
  warm: ['#6a4426', '#24160d'],
  cold: ['#33404c', '#11161b'],
  sepia: ['#b0915f', '#5a4429'],
  flash: ['#7d6a55', '#2a211a'],
};

function Figure({ f }: { f: PhotoFigure }) {
  const g = figureGeom(f);
  const { s } = g;
  const skin = f.skin ?? '#dcae88';
  const hair = f.hair ?? '#2a1d15';
  const cuffColor = '#efe6d2';
  const arm = (sh: Pt, w: Pt, side: 'L' | 'R') => {
    const mid = { x: (sh.x + w.x) / 2, y: (sh.y + w.y) / 2 };
    const has = f.cufflinks !== undefined && (side === 'L' ? f.cufflinks >= 1 : f.cufflinks === 2);
    return (
      <g key={side}>
        <line x1={sh.x} y1={sh.y} x2={f.tshirt ? mid.x : w.x} y2={f.tshirt ? mid.y : w.y} stroke={f.shirt} strokeWidth={12 * s} strokeLinecap="round" />
        {f.tshirt && <line x1={mid.x} y1={mid.y} x2={w.x} y2={w.y} stroke={skin} strokeWidth={9 * s} strokeLinecap="round" />}
        {!f.tshirt && <circle cx={w.x} cy={w.y} r={5.2 * s} fill={cuffColor} />}
        {!f.tshirt && f.cufflinks !== undefined &&
          (has ? (
            <circle cx={w.x} cy={w.y} r={2.4 * s} fill="#e3c25a" stroke="#7a5a10" strokeWidth={0.5} />
          ) : (
            <line x1={w.x - 2 * s} y1={w.y} x2={w.x + 2 * s} y2={w.y} stroke="#3a2a20" strokeWidth={1} />
          ))}
        <circle cx={side === 'L' ? g.handL.x : g.handR.x} cy={side === 'L' ? g.handL.y : g.handR.y} r={4.6 * s} fill={skin} />
      </g>
    );
  };
  const hand = g.handR;
  return (
    <g filter={f.blur ? 'url(#blur)' : undefined}>
      {/* torso */}
      <path
        d={`M ${g.cx - 23 * s} ${BASE + 6} L ${g.cx - 23 * s} ${BASE - 116 * s} Q ${g.cx - 23 * s} ${BASE - 128 * s} ${g.cx - 10 * s} ${BASE - 128 * s} L ${g.cx + 10 * s} ${BASE - 128 * s} Q ${g.cx + 23 * s} ${BASE - 128 * s} ${g.cx + 23 * s} ${BASE - 116 * s} L ${g.cx + 23 * s} ${BASE + 6} Z`}
        fill={f.shirt}
        stroke="#000"
        strokeOpacity="0.25"
      />
      {!f.tshirt && <path d={`M ${g.cx - 6 * s} ${BASE - 128 * s} L ${g.cx} ${BASE - 116 * s} L ${g.cx + 6 * s} ${BASE - 128 * s}`} fill="none" stroke="#000" strokeOpacity="0.35" />}
      {f.tshirt && (
        <text x={g.cx} y={BASE - 92 * s} fontSize={6 * s} textAnchor="middle" fill="#2a1d15" fontFamily="monospace" fontWeight="bold">
          KEY MASTER
        </text>
      )}
      {/* neck + head */}
      <rect x={g.cx - 5 * s} y={BASE - 138 * s} width={10 * s} height={12 * s} fill={skin} />
      <ellipse cx={g.head.x} cy={g.head.y} rx={15 * s} ry={17 * s} fill={skin} />
      <path d={`M ${g.cx - 15 * s} ${g.head.y - 2 * s} Q ${g.cx - 14 * s} ${g.head.y - 20 * s} ${g.cx} ${g.head.y - 19 * s} Q ${g.cx + 14 * s} ${g.head.y - 20 * s} ${g.cx + 15 * s} ${g.head.y - 2 * s} Q ${g.cx} ${g.head.y - 12 * s} ${g.cx - 15 * s} ${g.head.y - 2 * s} Z`} fill={hair} />
      <circle cx={g.cx - 5 * s} cy={g.head.y} r={1.4 * s} fill="#1a120d" />
      <circle cx={g.cx + 5 * s} cy={g.head.y} r={1.4 * s} fill="#1a120d" />
      <path d={`M ${g.cx - 4 * s} ${g.head.y + 8 * s} Q ${g.cx} ${g.head.y + 10 * s} ${g.cx + 4 * s} ${g.head.y + 8 * s}`} stroke="#5a2a20" fill="none" strokeWidth={s} />
      {f.wet && (
        <g stroke="#9cc3e6" strokeWidth={1.2} strokeLinecap="round">
          <line x1={g.cx - 16 * s} y1={g.head.y - 4 * s} x2={g.cx - 17 * s} y2={g.head.y + 2 * s} />
          <line x1={g.cx + 16 * s} y1={g.head.y - 6 * s} x2={g.cx + 17 * s} y2={g.head.y} />
          <line x1={g.cx + 4 * s} y1={g.head.y - 21 * s} x2={g.cx + 4 * s} y2={g.head.y - 16 * s} />
        </g>
      )}
      {f.prop === 'key' && (
        <g>
          <path d={`M ${g.cx - 6 * s} ${BASE - 128 * s} L ${g.cx} ${BASE - 100 * s} L ${g.cx + 6 * s} ${BASE - 128 * s}`} fill="none" stroke="#c0262b" strokeWidth={1.8 * s} />
          <circle cx={g.cx} cy={BASE - 96 * s} r={3 * s} fill="none" stroke="#d8b450" strokeWidth={1.4 * s} />
          <rect x={g.cx - 0.9 * s} y={BASE - 93 * s} width={1.8 * s} height={9 * s} fill="#d8b450" />
        </g>
      )}
      {arm(g.shoulderL, g.wristL, 'L')}
      {arm(g.shoulderR, g.wristR, 'R')}
      {f.prop === 'mic' && <g><rect x={hand.x - 1.5 * s} y={hand.y - 2 * s} width={3 * s} height={11 * s} fill="#111" /><circle cx={hand.x} cy={hand.y - 3 * s} r={3.2 * s} fill="#444" /></g>}
      {f.prop === 'glass' && <rect x={hand.x - 3.5 * s} y={hand.y - 11 * s} width={7 * s} height={10 * s} rx={1} fill="#d8a640" fillOpacity="0.8" stroke="#fff" strokeOpacity="0.6" strokeWidth={0.6} />}
      {f.prop === 'phone' && <rect x={hand.x - 3 * s} y={hand.y - 10 * s} width={6 * s} height={11 * s} rx={1.2} fill="#151515" stroke="#666" strokeWidth={0.5} />}
      {f.prop === 'envelope' && <rect x={g.cx - 11 * s} y={BASE - 92 * s} width={22 * s} height={14 * s} fill="#b88a4a" stroke="#6b4a1e" strokeWidth={0.8} />}
      {f.prop === 'cue' && <line x1={hand.x - 40 * s} y1={hand.y + 40 * s} x2={hand.x + 30 * s} y2={hand.y - 80 * s} stroke="#c7a46a" strokeWidth={2.4 * s} strokeLinecap="round" />}
      {f.prop === 'cue' && <rect x={hand.x + 27 * s} y={hand.y - 86 * s} width={4 * s} height={4 * s} fill="#2f63c9" />}
      {/* name tag */}
      <g>
        <rect x={g.cx - 21} y={BASE - 26 * s - 6} width={42} height={11} rx={2} fill="#120d0a" fillOpacity="0.7" />
        <text x={g.cx} y={BASE - 26 * s + 2} fontSize="7.5" textAnchor="middle" fill="#efe3c8" fontFamily="sans-serif">
          {f.label}
        </text>
      </g>
    </g>
  );
}

function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

function Obj({ o }: { o: PhotoObject }) {
  const y = o.y ?? 0;
  const w = o.w ?? 60;
  switch (o.kind) {
    case 'lamp':
      return (
        <g>
          <line x1={o.x} y1={0} x2={o.x} y2={22} stroke="#111" />
          <path d={`M ${o.x - 14} 34 L ${o.x - 6} 22 L ${o.x + 6} 22 L ${o.x + 14} 34 Z`} fill="#3a2a1a" />
          <ellipse cx={o.x} cy={60} rx={70} ry={40} fill="#ffd98a" opacity="0.12" />
        </g>
      );
    case 'sign':
      return (
        <g>
          <rect x={o.x} y={y} width={w} height={20} rx={3} fill="#1a120d" stroke="#c9a24a" />
          <text x={o.x + w / 2} y={y + 14} fontSize="10" textAnchor="middle" fill="#e8c97a" fontFamily="Georgia, serif" letterSpacing="1">
            {o.label}
          </text>
        </g>
      );
    case 'clock': {
      const [hh, mm] = (o.value ?? '00:00').split(':').map(Number);
      const ha = (((hh % 12) + mm / 60) * 30 - 90) * (Math.PI / 180);
      const ma = (mm * 6 - 90) * (Math.PI / 180);
      return (
        <g>
          <circle cx={o.x} cy={y} r={18} fill="#efe3c8" stroke="#3a2a1a" strokeWidth={3} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i} x1={o.x + Math.cos(a) * 14} y1={y + Math.sin(a) * 14} x2={o.x + Math.cos(a) * 16} y2={y + Math.sin(a) * 16} stroke="#3a2a1a" />;
          })}
          <line x1={o.x} y1={y} x2={o.x + Math.cos(ha) * 8} y2={y + Math.sin(ha) * 8} stroke="#1a120d" strokeWidth={2} strokeLinecap="round" />
          <line x1={o.x} y1={y} x2={o.x + Math.cos(ma) * 13} y2={y + Math.sin(ma) * 13} stroke="#1a120d" strokeWidth={1.2} strokeLinecap="round" />
          <circle cx={o.x} cy={y} r={1.4} fill="#7a1f2b" />
        </g>
      );
    }
    case 'coat-hooks': {
      const items = (o.value ?? '').split(',');
      return (
        <g>
          <line x1={o.x - 6} y1={y} x2={o.x + items.length * 18 - 12} y2={y} stroke="#3a2a1a" strokeWidth={3} />
          {items.map((it, i) => {
            const empty = it.startsWith('!');
            const x = o.x + i * 18;
            return (
              <g key={i}>
                <text x={x} y={y - 5} fontSize="7" textAnchor="middle" fill="#efe3c8" fontFamily="Georgia, serif">
                  {it.replace('!', '')}
                </text>
                <path d={`M ${x} ${y} l 0 5 q 0 3 3 3`} stroke="#c9a24a" fill="none" />
                {!empty && <path d={`M ${x - 6} ${y + 6} L ${x + 6} ${y + 6} L ${x + 8} ${y + 46} L ${x - 8} ${y + 46} Z`} fill={i === 0 && o.value?.startsWith('S') ? '#b08a5a' : ['#3b3b44', '#5a3a2a', '#2e3a2e', '#4a4038', '#6a2a2a'][i % 5]} />}
              </g>
            );
          })}
        </g>
      );
    }
    case 'bar':
      return (
        <g>
          <rect x={o.x} y={175} width={w} height={90} fill="#3a2516" />
          <rect x={o.x - 4} y={171} width={w + 8} height={7} fill="#5a3a22" />
          {Array.from({ length: Math.floor(w / 40) }).map((_, i) => (
            <rect key={i} x={o.x + 8 + i * 40} y={186} width={30} height={60} fill="none" stroke="#000" strokeOpacity="0.3" />
          ))}
        </g>
      );
    case 'trophy':
      return (
        <g>
          <defs>
            <linearGradient id="gold" x1="0" x2="1">
              <stop offset="0" stopColor="#8a6a22" />
              <stop offset="0.45" stopColor="#f3dd9c" />
              <stop offset="1" stopColor="#9b7a2e" />
            </linearGradient>
          </defs>
          <rect x={o.x - 12} y={163} width={24} height={9} fill="#2a1d15" stroke="#c9a24a" strokeWidth={0.6} />
          <circle cx={o.x - 5} cy={158} r={5.5} fill="url(#gold)" />
          <circle cx={o.x + 5} cy={158} r={5.5} fill="url(#gold)" />
          <rect x={o.x - 4.5} y={124} width={9} height={34} rx={4.5} fill="url(#gold)" />
          <text x={o.x} y={170} fontSize="4.5" textAnchor="middle" fill="#e8c97a">B.o.B.</text>
        </g>
      );
    case 'confetti': {
      const r = rng(7);
      const cols = ['#e8c97a', '#c45a7c', '#6fa0d8', '#efe3c8', '#7ab36a'];
      return (
        <g>
          {Array.from({ length: 70 }).map((_, i) => (
            <rect key={i} x={r() * W} y={r() * 150} width={3} height={1.6} fill={cols[i % cols.length]} transform={`rotate(${r() * 180} ${r() * W} ${r() * 150})`} opacity="0.85" />
          ))}
        </g>
      );
    }
    case 'speaker':
      return (
        <g transform={`rotate(-28 ${o.x} ${y})`}>
          <rect x={o.x - 16} y={y - 22} width={32} height={44} rx={3} fill="#1a1a1a" stroke="#444" />
          <circle cx={o.x} cy={y + 6} r={9} fill="#333" stroke="#555" />
          <path d={`M ${o.x - 14} ${y - 18} L ${o.x + 2} ${y - 2}`} stroke="#999" strokeWidth={0.8} />
        </g>
      );
    case 'stain':
      return (
        <g>
          <circle cx={o.x} cy={y} r={58} fill="url(#stain)" />
          <circle cx={o.x} cy={y} r={46} fill="none" stroke="#6b4a22" strokeOpacity="0.5" strokeWidth={4} />
        </g>
      );
    case 'stage':
      return (
        <g>
          <rect x={o.x} y={0} width={w} height={220} fill="#5a1520" opacity="0.45" />
          {Array.from({ length: Math.floor(w / 18) }).map((_, i) => (
            <line key={i} x1={o.x + 9 + i * 18} y1={0} x2={o.x + 9 + i * 18} y2={220} stroke="#000" strokeOpacity="0.25" strokeWidth={4} />
          ))}
          <rect x={o.x} y={218} width={w} height={50} fill="#2a1a12" />
        </g>
      );
    case 'table':
      return (
        <g>
          <rect x={o.x} y={205} width={w} height={14} rx={2} fill="#4a3020" stroke="#000" strokeOpacity="0.4" />
          <rect x={o.x + 10} y={219} width={8} height={40} fill="#3a2516" />
          <rect x={o.x + w - 18} y={219} width={8} height={40} fill="#3a2516" />
          {[0.2, 0.45, 0.7].map((p, i) => (
            <rect key={i} x={o.x + w * p} y={196} width={8} height={10} fill="#d8a640" opacity="0.8" />
          ))}
        </g>
      );
    case 'pool':
      return (
        <g>
          <rect x={o.x - 8} y={188} width={w + 16} height={60} rx={6} fill="#4a2c18" />
          <rect x={o.x} y={194} width={w} height={46} fill="#1f5a3a" />
          {[0, 0.5, 1].map((p, i) => (
            <circle key={i} cx={o.x + w * p} cy={194} r={4} fill="#111" />
          ))}
          <circle cx={o.x + w * 0.4} cy={214} r={3.5} fill="#efe3c8" />
          <circle cx={o.x + w * 0.62} cy={220} r={3.5} fill="#111" />
          <circle cx={o.x + w * 0.7} cy={208} r={3.5} fill="#c0262b" />
        </g>
      );
    case 'door':
      return (
        <g>
          <rect x={o.x} y={40} width={w} height={220} fill="#3b2516" stroke="#c9a24a" strokeOpacity="0.5" strokeWidth={2} />
          <rect x={o.x + 8} y={56} width={w - 16} height={70} fill="none" stroke="#000" strokeOpacity="0.35" />
          <rect x={o.x + 8} y={140} width={w - 16} height={100} fill="none" stroke="#000" strokeOpacity="0.35" />
          <circle cx={o.x + w - 10} cy={150} r={3} fill="#c9a24a" />
          {o.label && (
            <g>
              <rect x={o.x + w / 2 - 26} y={84} width={52} height={12} fill="#efe3c8" />
              <text x={o.x + w / 2} y={93} fontSize="7" textAnchor="middle" fill="#2a1d15" fontFamily="Georgia, serif">
                {o.label}
              </text>
            </g>
          )}
        </g>
      );
    default:
      return null;
  }
}

interface Props {
  scene: PhotoScene;
  found?: string[];
  onHotspot?: (h: Hotspot) => void;
  compact?: boolean;
}

export function PhotoView({ scene, found = [], onHotspot }: Props) {
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);
  const moved = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [c1, c2] = PALETTES[scene.palette];

  const clamp = (v: { x: number; y: number; w: number; h: number }) => ({
    ...v,
    x: Math.max(0, Math.min(W - v.w, v.x)),
    y: Math.max(0, Math.min(H - v.h, v.y)),
  });
  const zoomAround = (cx: number, cy: number, w: number) => {
    const ww = Math.max(90, Math.min(W, w));
    const hh = (ww * H) / W;
    setVb(clamp({ x: cx - ww / 2, y: cy - hh / 2, w: ww, h: hh }));
  };
  const zoomed = vb.w < W - 1;

  const tap = (h: Hotspot) => {
    if (moved.current) return;
    const p = hotspotPos(scene, h);
    zoomAround(p.x, p.y, 150);
    setSelected(h);
    onHotspot?.(h);
  };

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    moved.current = false;
    drag.current = { px: e.clientX, py: e.clientY, vx: vb.x, vy: vb.y };
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag.current || !zoomed || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const k = vb.w / rect.width;
    const dx = (e.clientX - drag.current.px) * k;
    const dy = (e.clientY - drag.current.py) * k;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
    setVb((v) => clamp({ ...v, x: drag.current!.vx - dx, y: drag.current!.vy - dy }));
  };
  const onUp = () => {
    drag.current = null;
    window.setTimeout(() => (moved.current = false), 0);
  };

  const spots = useMemo(() => scene.hotspots.map((h) => ({ h, p: hotspotPos(scene, h) })), [scene]);

  return (
    <div className="select-none">
      <div className="relative rounded-sm bg-[#f4ecd8] p-2 pb-7 shadow-[0_8px_24px_rgba(0,0,0,0.55)]" style={{ transform: 'rotate(-0.6deg)' }}>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="block h-auto w-full touch-none bg-black transition-[all] duration-300"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          role="img"
          aria-label={scene.caption}
        >
          <defs>
            <linearGradient id={`bg-${scene.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={c1} />
              <stop offset="1" stopColor={c2} />
            </linearGradient>
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor="#000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.65" />
            </radialGradient>
            <radialGradient id="stain">
              <stop offset="0%" stopColor="#8a6a3a" stopOpacity="0.35" />
              <stop offset="80%" stopColor="#6b4a22" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6b4a22" stopOpacity="0" />
            </radialGradient>
            <filter id="blur">
              <feGaussianBlur stdDeviation="1.6" />
            </filter>
            <filter id="sepia">
              <feColorMatrix type="matrix" values="0.45 0.6 0.15 0 0  0.38 0.55 0.13 0 0  0.28 0.42 0.1 0 0  0 0 0 1 0" />
            </filter>
          </defs>
          <g filter={scene.palette === 'sepia' ? 'url(#sepia)' : undefined}>
            <rect x={0} y={0} width={W} height={H} fill={`url(#bg-${scene.id})`} />
            {scene.objects.filter((o) => !['bar', 'trophy', 'table', 'pool', 'confetti', 'stain', 'speaker'].includes(o.kind)).map((o, i) => <Obj key={`b${i}`} o={o} />)}
            {scene.figures.filter((f) => f.behind).map((f, i) => <Figure key={`fb${i}`} f={f} />)}
            {scene.objects.filter((o) => ['bar', 'trophy', 'speaker'].includes(o.kind)).map((o, i) => <Obj key={`m${i}`} o={o} />)}
            {scene.figures.filter((f) => !f.behind).map((f, i) => <Figure key={`ff${i}`} f={f} />)}
            {scene.objects.filter((o) => ['table', 'pool', 'confetti'].includes(o.kind)).map((o, i) => <Obj key={`f${i}`} o={o} />)}
          </g>
          {scene.objects.filter((o) => o.kind === 'stain').map((o, i) => <Obj key={`s${i}`} o={o} />)}
          {scene.damaged && (
            <g stroke="#f4ecd8" strokeOpacity="0.5" fill="none">
              <path d="M 0 120 Q 120 110 230 130 T 400 118" strokeWidth={1.2} />
              <path d="M 300 0 L 286 260" strokeWidth={0.8} />
            </g>
          )}
          <rect x={0} y={0} width={W} height={H} fill="url(#vignette)" pointerEvents="none" />
          <text x={W - 8} y={H - 8} fontSize="11" textAnchor="end" fill="#ff9a3a" fontFamily="monospace" opacity="0.9">
            {scene.stamp}
          </text>
          {spots.map(({ h, p }) => {
            const isFound = found.includes(h.id) || selected?.id === h.id;
            return (
              <g key={h.id} onClick={() => tap(h)} style={{ cursor: 'pointer' }} role="button" aria-label={h.label}>
                <circle cx={p.x} cy={p.y} r={Math.max(p.r, 10)} fill="#000" fillOpacity="0.001" />
                <circle cx={p.x} cy={p.y} r={p.r} fill="none" stroke={isFound ? '#7ad07a' : '#e8c97a'} strokeWidth={zoomed ? 0.8 : 1.4} strokeDasharray="3 2" opacity="0.9" />
                {!isFound && (
                  <circle cx={p.x} cy={p.y} r={4} fill="none" stroke="#e8c97a" strokeWidth={1}>
                    <animate attributeName="r" from="3" to={p.r} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
        <div className="absolute bottom-1.5 left-3 right-3 truncate font-type text-[11px] text-paper-ink/80">{scene.caption}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border border-gold/40 bg-wood-2 px-3 py-1.5 text-sm text-parchment" onClick={() => zoomAround(vb.x + vb.w / 2, vb.y + vb.h / 2, vb.w / 1.6)} aria-label="Inzoomen">
          🔍 +
        </button>
        <button className="rounded-md border border-gold/40 bg-wood-2 px-3 py-1.5 text-sm text-parchment" onClick={() => zoomAround(vb.x + vb.w / 2, vb.y + vb.h / 2, vb.w * 1.6)} aria-label="Uitzoomen">
          −
        </button>
        {zoomed && (
          <button className="rounded-md border border-gold/40 bg-wood-2 px-3 py-1.5 text-sm text-parchment" onClick={() => { setVb({ x: 0, y: 0, w: W, h: H }); setSelected(null); }}>
            Hele foto
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{zoomed ? 'Sleep om te schuiven' : 'Tik op een ◌ om in te zoomen'}</span>
      </div>
      {selected && (
        <div className="paper anim-rise mt-3 rounded-md p-3 text-[15px]">
          <div className="font-type text-xs uppercase tracking-wider text-bordeaux">{selected.label}</div>
          <p className="mt-1">{selected.detail}</p>
        </div>
      )}
    </div>
  );
}
