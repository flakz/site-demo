"use client";

import React, { useState, useRef, useEffect, useMemo, type ReactNode, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import dynamic from "next/dynamic";
import { clsx, type ClassValue } from "clsx";
import { ChevronDown } from "lucide-react";
function cn(...a: ClassValue[]) { return clsx(a); }

// Lazy loaded chat widget
const ChatWidget = dynamic(() => import("./chat-widget").then(m => m.default), { ssr: false });

// ── Velaris (WebGL Background) ─────────────────────────────────────────

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};

const vertexShaderGLSL = `attribute vec2 position; varying vec2 vUv; void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragmentShaderGLSL = `
precision highp float; varying vec2 vUv;
uniform vec2 u_resolution; uniform float u_time; uniform float u_grain; uniform vec3 u_colors[4]; uniform vec3 u_bg;
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){ const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439); vec2 i = floor(v+dot(v,C.yy)); vec2 x0 = v-i+dot(i,C.xx); vec2 i1 = (x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0); vec4 x12 = x0.xyxy+C.xxzz; x12.xy -= i1; i = mod(i,289.0); vec3 p = permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0)); vec3 m = max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0); m = m*m; m = m*m; vec3 x = 2.0*fract(p*C.www)-1.0; vec3 h = abs(x)-0.5; vec3 ox = floor(x+0.5); vec3 a0 = x-ox; m *= 1.79284291400159-0.85373472095314*(a0*a0+h*h); vec3 g; g.x = a0.x*x0.x+h.x*x0.y; g.yz = a0.yz*x12.xz+h.yz*x12.yw; return 130.0*dot(m,g); }
void main() { vec2 uv = vUv, p = uv-0.5; p.x *= u_resolution.x/u_resolution.y; float t = u_time*0.1; float n1=snoise(p*0.4+vec2(t*0.2,-t*0.3)), n2=snoise(p*0.55+vec2(-t*0.15,t*0.25)+n1*0.25), dist=length(p)*1.5; vec3 col=mix(u_bg*0.2,u_bg,1.0-smoothstep(0.3,1.2,dist)); col=mix(col,u_colors[0],smoothstep(-0.2,0.5,n1)*0.85); col=mix(col,u_colors[1],smoothstep(-0.1,0.6,n2)*0.7+u_colors[1]*(1.0-smoothstep(0.8,0.0,dist))*0.3); col=mix(col,u_colors[3],smoothstep(0.0,0.7,n1*n2)*0.5); col+=(fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time)-0.5)*u_grain*0.1; gl_FragColor=vec4(col,1.0); }
`;

function Velaris({ bg="#000000", colors=["#86efac","#4ade80","#059669","#000000"], speed=2.0, grain=0.3, height="100vh", className, children }: { bg?: string; colors?: string[]; speed?: number; grain?: number; height?: string; className?: string; children?: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    const createShader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderGLSL));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderGLSL));
    gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const locs = { res: gl.getUniformLocation(program,"u_resolution"), time: gl.getUniformLocation(program,"u_time"), grain: gl.getUniformLocation(program,"u_grain"), colors: gl.getUniformLocation(program,"u_colors"), bg: gl.getUniformLocation(program,"u_bg") };
    let resizeTimer: ReturnType<typeof setTimeout>;
    const resize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { const dpr = Math.min(window.devicePixelRatio, 2); canvas.width = container.clientWidth * dpr; canvas.height = container.clientHeight * dpr; gl.viewport(0, 0, canvas.width, canvas.height); }, 100); };
    const ro = new ResizeObserver(resize); ro.observe(container);
    let raf: number, lastT = 0; const render = (t: number) => { if (t - lastT >= 33) { lastT = t; gl.uniform2f(locs.res, canvas.width, canvas.height); gl.uniform1f(locs.time, t * 0.001 * speed); gl.uniform1f(locs.grain, grain); gl.uniform3f(locs.bg, ...hexToRgb(bg)); gl.uniform3fv(locs.colors, new Float32Array(colors.slice(0, 4).flatMap(hexToRgb))); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); } raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [bg, colors, speed, grain]);
  return (
    <div ref={containerRef} style={{ height }} className={["relative w-full overflow-hidden", className].filter(Boolean).join(" ")}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

// ── EncryptedText ──────────────────────────────────────────────────────

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

const EncryptedText = ({ text, className, revealDelayMs=50, charset=DEFAULT_CHARSET, flipDelayMs=50, encryptedClassName, revealedClassName }: { text: string; className?: string; revealDelayMs?: number; charset?: string; flipDelayMs?: number; encryptedClassName?: string; revealedClassName?: string; }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hasStarted, setHasStarted] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const lastFlipTimeRef = useRef(0);
  const scrambleCharsRef = useRef<string[]>([]);
  useEffect(() => { setHasStarted(true); }, []);
  useEffect(() => {
    if (!isInView || !hasStarted) return;
    const initial = text.split("").map(ch => ch === " " ? " " : charset[Math.floor(Math.random() * charset.length)]);
    scrambleCharsRef.current = initial;
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setRevealCount(0);
    let isCancelled = false;
    const update = (now: number) => {
      if (isCancelled) return;
      const elapsedMs = now - startTimeRef.current;
      const currentRevealCount = Math.min(text.length, Math.floor(elapsedMs / Math.max(1, revealDelayMs)));
      setRevealCount(currentRevealCount);
      if (currentRevealCount >= text.length) return;
      if (now - lastFlipTimeRef.current >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < text.length; index += 1) {
          if (index >= currentRevealCount) scrambleCharsRef.current[index] = text[index] === " " ? " " : charset[Math.floor(Math.random() * charset.length)];
        }
        lastFlipTimeRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);
    return () => { isCancelled = true; if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current); };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs, hasStarted]);
  if (!text) return null;
  return (
    <motion.span ref={ref} className={cn(className)} aria-label={text} role="text" suppressHydrationWarning>
      {!hasStarted ? <span className={encryptedClassName} suppressHydrationWarning>{" ".repeat(text.length)}</span> :
        text.split("").map((char, index) => {
          const isRevealed = index < revealCount;
          const displayChar = isRevealed ? char : char === " " ? " " : (scrambleCharsRef.current[index] ?? charset[Math.floor(Math.random() * charset.length)]);
          return <span key={index} className={isRevealed ? revealedClassName : encryptedClassName}>{displayChar}</span>;
        })
      }
    </motion.span>
  );
};

// ── TextFlippingBoard ──────────────────────────────────────────────────

const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()-+&=;:'\"%,./?°";
const BOARD_ROWS = 6, BOARD_COLS = 22;
const COL_D = 30, ROW_D = 20, STEP_MS = 35, FLIP_S = 0.25;
const BASE_TOTAL_S = ((BOARD_COLS - 1) * COL_D + (BOARD_ROWS - 1) * ROW_D + 8 * STEP_MS) / 1000;

type AccentColor = { top: string; bottom: string; text: string; };
const ACCENT_COLORS: AccentColor[] = [
  { top: "bg-red-600", bottom: "bg-red-700", text: "text-white" },
  { top: "bg-orange-500", bottom: "bg-orange-600", text: "text-white" },
  { top: "bg-yellow-400", bottom: "bg-yellow-500", text: "text-neutral-900" },
  { top: "bg-green-600", bottom: "bg-green-700", text: "text-white" },
  { top: "bg-blue-600", bottom: "bg-blue-700", text: "text-white" },
  { top: "bg-violet-600", bottom: "bg-violet-700", text: "text-white" },
  { top: "bg-white", bottom: "bg-neutral-100", text: "text-neutral-900" },
];

const CELL_TEXT_STYLE: React.CSSProperties = { fontSize: "clamp(6px, 2vw, 22px)", lineHeight: 1 };

const FlapCell = React.memo(function FlapCell({ target, delay, stepMs, flipDuration }: { target: string; delay: number; stepMs: number; flipDuration: number; }) {
  const [current, setCurrent] = useState(" ");
  const [prev, setPrev] = useState(" ");
  const [flipId, setFlipId] = useState(0);
  const [accent, setAccent] = useState<AccentColor | null>(null);
  const [prevAccent, setPrevAccent] = useState<AccentColor | null>(null);
  const curRef = useRef(" ");
  const tgtRef = useRef<string | null>(null);
  const accentRef = useRef<AccentColor | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (startTimer.current) clearTimeout(startTimer.current);
    if (stepTimer.current) clearTimeout(stepTimer.current);
    startTimer.current = null;
    stepTimer.current = null;
    const normalized = FLAP_CHARS.includes(target.toUpperCase()) ? target.toUpperCase() : " ";
    if (normalized === tgtRef.current) return;
    tgtRef.current = normalized;
    if (normalized === " " && curRef.current === " ") return;
    const scrambleCount = normalized === " " ? 5 + Math.floor(Math.random() * 4) : 12 + Math.floor(Math.random() * 6);
    const runStep = (i: number) => {
      const isLast = i === scrambleCount;
      const ch = isLast ? normalized : FLAP_CHARS[1 + Math.floor(Math.random() * (FLAP_CHARS.length - 1))];
      const newAccent = isLast ? null : Math.random() < 0.2 ? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)] : null;
      setPrev(curRef.current);
      setPrevAccent(accentRef.current);
      curRef.current = ch;
      accentRef.current = newAccent;
      setCurrent(ch);
      setAccent(newAccent);
      setFlipId((n) => n + 1);
      if (!isLast) stepTimer.current = setTimeout(() => runStep(i + 1), stepMs);
    };
    startTimer.current = setTimeout(() => runStep(1), delay);
    return () => { if (startTimer.current) clearTimeout(startTimer.current); if (stepTimer.current) clearTimeout(stepTimer.current); startTimer.current = null; stepTimer.current = null; tgtRef.current = null; };
  }, [target, delay, stepMs]);
  const show = current === " " ? " " : current;
  const showPrev = prev === " " ? " " : prev;
  const textCx = "absolute inset-x-0 flex select-none items-center justify-center font-mono font-bold tracking-wide";
  const topBg = accent?.top ?? "bg-neutral-200/80 dark:bg-neutral-900";
  const bottomBg = accent?.bottom ?? "bg-neutral-200/80 dark:bg-neutral-900";
  const textColor = accent?.text ?? "text-neutral-800 dark:text-white";
  const flapTopBg = prevAccent?.top ?? "bg-neutral-100 dark:bg-neutral-800";
  const flapTextColor = prevAccent?.text ?? "text-neutral-800 dark:text-white";
  const bottomDelay = flipDuration * 0.5;
  return (
    <div className="flex aspect-3/6 flex-col overflow-hidden rounded-[2px] border border-neutral-300 md:rounded-[3px] md:border-2 dark:border-black">
      <div className="relative flex-1 perspective-dramatic transform-3d">
        <div className="absolute inset-0 z-40 hidden flex-row items-center justify-center md:flex">
          <div className="h-1/2 w-px rounded-tr-sm rounded-br-sm bg-neutral-300 dark:bg-black" />
          <div className="flex h-px flex-1 bg-neutral-300 dark:bg-black" />
          <div className="h-1/2 w-px rounded-tl-sm rounded-bl-sm bg-neutral-300 dark:bg-black" />
        </div>
        <div className={cn("absolute inset-x-0 top-0 h-[calc(50%-0.5px)] overflow-hidden rounded-t-[3px]", topBg)}>
          <div className={cn(textCx, textColor, "top-0 h-[200%]")} style={CELL_TEXT_STYLE}>{show}</div>
        </div>
        <div className={cn("absolute inset-x-0 bottom-0 h-[calc(50%-0.5px)] overflow-hidden rounded-b-[3px]", bottomBg)}>
          <div className={cn(textCx, textColor, "bottom-0 h-[200%]")} style={CELL_TEXT_STYLE}>{show}</div>
          {flipId > 0 && <motion.div key={`s${flipId}`} className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),transparent_60%)] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8),transparent_60())]" initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} transition={{ duration: flipDuration * 1.3, ease: "easeOut" }} />}
        </div>
        {flipId > 0 && (
          <motion.div key={flipId} className={cn("absolute inset-x-0 top-0 z-10 h-[calc(50%-0.5px)] origin-bottom overflow-hidden rounded-t-[3px] backface-hidden transform-3d", flapTopBg)} initial={{ rotateX: 0 }} animate={{ rotateX: -100 }} transition={{ duration: flipDuration, ease: [0.55, 0.055, 0.675, 0.19] }}>
            <div className={cn(textCx, flapTextColor, "top-0 h-[200%]")} style={CELL_TEXT_STYLE}>{showPrev}</div>
            <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,1))] dark:bg-[linear-gradient(to_bottom,rgba(0,0,0,0),rgba(0,0,0,1))]" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: flipDuration }} />
          </motion.div>
        )}
        {flipId > 0 && (
          <motion.div key={`b${flipId}`} className={cn("absolute inset-x-0 bottom-0 z-10 h-[calc(50%-0.5px)] origin-top overflow-hidden rounded-b-[3px] backface-hidden transform-3d", bottomBg)} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} transition={{ duration: flipDuration * 0.85, delay: bottomDelay, ease: [0.33, 1.55, 0.64, 1] }}>
            <div className={cn(textCx, textColor, "bottom-0 h-[200%]")} style={CELL_TEXT_STYLE}>{show}</div>
            <motion.div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0),rgba(255,255,255,0.6))] dark:bg-[linear-gradient(to_top,rgba(0,0,0,0),rgba(0,0,0,0.6))]" initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} transition={{ duration: flipDuration * 0.85, delay: bottomDelay }} />
          </motion.div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-[0.5px] bg-neutral-400/50 dark:bg-black/50" />
      </div>
      <div className="h-2 w-full bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_1px,transparent_1px,transparent_0.15rem)] mask-t-from-50% text-neutral-400 opacity-20 md:h-4 md:bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_1px,transparent_1px,transparent_0.2rem)] dark:text-black dark:opacity-100" />
    </div>
  );
}, (prevProps, nextProps) => prevProps.target === nextProps.target && prevProps.delay === nextProps.delay && prevProps.stepMs === nextProps.stepMs && prevProps.flipDuration === nextProps.flipDuration);

const COLOR_MAP: Record<string, string> = { "{R}": "#D32F2F", "{O}": "#F57C00", "{Y}": "#FBC02D", "{G}": "#43A047", "{B}": "#1E88E5", "{V}": "#8E24AA", "{W}": "#FAFAFA" };

type ParsedCell = { type: "char"; value: string } | { type: "color"; hex: string };

function parseRow(row: string): ParsedCell[] {
  const cells: ParsedCell[] = [], len = row.length;
  for (let i = 0; i < len; i++) {
    if (row[i] === "{" && i + 2 < len && row[i + 2] === "}") {
      const hex = COLOR_MAP[row.substring(i, i + 3)];
      if (hex) { cells.push({ type: "color", hex }); i += 2; continue; }
    }
    cells.push({ type: "char", value: row[i] });
  }
  return cells;
}

function wrapText(input: string, max: number): string[] {
  return input.split("\n").flatMap(p => p.trim() === "" ? [""] : p.split(/[ \t]+/).filter(Boolean).reduce<string[][]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (!last || last.join(" ").length + 1 + word.length > max) return [...lines, [word]];
    return [...lines.slice(0, -1), [...last, word]];
  }, []).map(l => l.join(" ")));
}

function TextFlippingBoard({ rows, text, className, duration = BASE_TOTAL_S }: { rows?: string[]; text?: string; className?: string; duration?: number; }) {
  const scale = duration / BASE_TOTAL_S;
  const colDelay = COL_D * scale, rowDelay = ROW_D * scale, stepMs = STEP_MS * scale;
  const flipDur = Math.min(0.6, Math.max(0.15, FLIP_S * scale));
  const board = useMemo(() => {
    const grid: ParsedCell[][] = Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }, () => ({ type: "char" as const, value: " " })));
    if (text) {
      const lines = wrapText(text, BOARD_COLS).slice(0, BOARD_ROWS);
      const startRow = Math.max(0, Math.floor((BOARD_ROWS - lines.length) / 2));
      lines.forEach((line, i) => {
        const row = startRow + i;
        if (row >= BOARD_ROWS) return;
        const parsed = parseRow(line);
        const startCol = Math.max(0, Math.floor((BOARD_COLS - parsed.length) / 2));
        parsed.forEach((cell, c) => { if (startCol + c < BOARD_COLS) grid[row][startCol + c] = cell; });
      });
    } else if (rows) {
      rows.forEach((row, r) => {
        if (r >= BOARD_ROWS) return;
        const parsed = parseRow(row);
        parsed.forEach((cell, c) => { if (c < BOARD_COLS) grid[r][c] = cell; });
      });
    }
    return grid;
  }, [rows, text]);
  return (
    <div className={["relative mx-auto w-full max-w-3xl rounded-xl bg-neutral-100 p-2 shadow-xl md:rounded-2xl md:p-4 dark:bg-neutral-900 dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)]", className].filter(Boolean).join(" ")}>
      <div className="grid gap-px md:gap-[3px]" style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)` }}>
        {board.map((row, r) => row.map((cell, c) =>
          cell.type === "color" ? <div key={`${r}-${c}`} className="aspect-3/5 rounded-[3px] border-2 border-neutral-300 dark:border-black" style={{ backgroundColor: cell.hex }} /> :
            <FlapCell key={`${r}-${c}`} target={cell.value} delay={c * colDelay + r * rowDelay} stepMs={stepMs} flipDuration={flipDur} />
        ))}
      </div>
    </div>
  );
}

const DEMO_MSGS = [
  process.env.NEXT_PUBLIC_BOARD_MSG_1 || "STAY HUNGRY \nSTAY IN BED \n- STEVE JOBS",
  process.env.NEXT_PUBLIC_BOARD_MSG_2 || "hat did you get done this week?",
  process.env.NEXT_PUBLIC_BOARD_MSG_3 || "I burned $20 \nfor this shit.",
  process.env.NEXT_PUBLIC_BOARD_MSG_4 || "DONT WORRY \nBE HAPPY FFS.",
  process.env.NEXT_PUBLIC_BOARD_MSG_5 || "LADIES AND GENTLEMEN \nWELCOME TO F#!@# C!@$",
];
const LANDING_TEXT = process.env.NEXT_PUBLIC_LANDING_TEXT || "You are not your job, you're not how much money you have in the bank. You are not the car you drive. You're not the contents of your wallet. You are not your fucking khakis. All singing, all dancing crap of the world.";
const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://n8n.marno.pro/webhook/marno-chat";
const KB_SLUG = process.env.NEXT_PUBLIC_KB_SLUG || "kbase";

type Message = { id: string; role: 'user' | 'model' | 'system'; text: string; };

const SUGGESTIONS = [
  { label: process.env.NEXT_PUBLIC_SUGGEST_1_LABEL || "Get started", prompt: process.env.NEXT_PUBLIC_SUGGEST_1_PROMPT || "How do I get started with the platform?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_2_LABEL || "See templates", prompt: process.env.NEXT_PUBLIC_SUGGEST_2_PROMPT || "Can you show me the available templates?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_3_LABEL || "Pricing", prompt: process.env.NEXT_PUBLIC_SUGGEST_3_PROMPT || "What are the pricing plans available?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_4_LABEL || "Book a demo", prompt: process.env.NEXT_PUBLIC_SUGGEST_4_PROMPT || "I would like to book a demo." },
  { label: process.env.NEXT_PUBLIC_SUGGEST_5_LABEL || "Documentation", prompt: process.env.NEXT_PUBLIC_SUGGEST_5_PROMPT || "Where can I find the API documentation?" },
];

function AccordionFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const items = [
    {
      title: process.env.NEXT_PUBLIC_FAQ_1_TITLE || "How do I place an order?",
      content: process.env.NEXT_PUBLIC_FAQ_1_CONTENT || "Browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping and payment information to complete your purchase.",
    },
    {
      title: process.env.NEXT_PUBLIC_FAQ_2_TITLE || "Can I modify or cancel my order?",
      content: process.env.NEXT_PUBLIC_FAQ_2_CONTENT || "Yes, you can modify or cancel your order before it's shipped. Once your order is processed, you can't make changes.",
    },
    {
      title: process.env.NEXT_PUBLIC_FAQ_3_TITLE || "What payment methods do you accept?",
      content: process.env.NEXT_PUBLIC_FAQ_3_CONTENT || "We accept all major credit cards, debit cards, and PayPal. Your payment information is encrypted and processed securely.",
    },
    {
      title: process.env.NEXT_PUBLIC_FAQ_4_TITLE || "How long does shipping take?",
      content: process.env.NEXT_PUBLIC_FAQ_4_CONTENT || "Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business day delivery.",
    },
  ];

  return (
    <div className="w-full max-w-3xl">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            idx > 0 && "border-t border-white/10",
          )}
        >
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className="flex w-full items-center justify-between py-3 text-left text-white/80 hover:text-white transition-colors"
          >
            <span className="text-sm md:text-base font-medium">{item.title}</span>
            <motion.span
              animate={{ rotate: openIdx === idx ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/50"
            >
              <ChevronDown size={18} />
            </motion.span>
          </button>
          <motion.div
            initial={false}
            animate={{
              height: openIdx === idx ? "auto" : 0,
              opacity: openIdx === idx ? 1 : 0,
            }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-3 text-sm text-white/50 leading-relaxed">
              {item.content}
            </p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: 'system', text: "Hi there! I'm an AI agent trained on docs, help articles, and other important content." },
    { id: crypto.randomUUID(), role: 'system', text: "How can I best help you today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sessionIdRef.current = crypto.randomUUID(); }, []);
  useEffect(() => { const id = setInterval(() => setDemoIdx(i => (i + 1) % DEMO_MSGS.length), 6000); return () => clearInterval(id); }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    const trimmed = textToSend.trim();
    if (!trimmed) return;
    if (!textOverride) setInputValue("");
    const userMsgObj: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);
    try {
      const res = await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: trimmed, sessionId: sessionIdRef.current, slug: KB_SLUG }) });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      const resp = await res.json();
      const responseText = resp.response || "";
      const modelMessageId = crypto.randomUUID();
      setIsLoading(false);
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: "" }]);
      const chars = responseText.split("");
      let fullText = "";
      for (let i = 0; i < chars.length; i += 2) {
        fullText += chars[i] + (chars[i + 1] || "");
        setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, text: fullText } : m));
        await new Promise(r => setTimeout(r, 10));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: "I'm sorry, I encountered an error. Please check your connection or try again later." }]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSend(); };
  const handleReset = () => {
    setMessages([
      { id: crypto.randomUUID(), role: 'system', text: "Hi there! I'm an AI agent trained on docs, help articles, and other important content." },
      { id: crypto.randomUUID(), role: 'system', text: "How can I best help you today?" }
    ]);
    setInputValue("");
    sessionIdRef.current = crypto.randomUUID();
  };
  const isInputEmpty = inputValue.trim().length === 0;

  return (
    <div className="min-h-screen bg-white">
      <Velaris height="100vh" bg="#000000" colors={["#86efac", "#4ade80", "#059669", "#000000"]} speed={2} grain={0.3}>
        <div className="flex w-full h-full flex-col items-center justify-center gap-8 px-4">
          <div className="w-full max-w-3xl">
            <p className="text-left text-white/70 text-sm md:text-base leading-relaxed">{LANDING_TEXT.split('\n').map((line, i) => (<span key={i}>{line}{i < LANDING_TEXT.split('\n').length - 1 && <br />}</span>))}</p>
          </div>
          <TextFlippingBoard text={DEMO_MSGS[demoIdx]} />
          <AccordionFAQ />
        </div>
      </Velaris>
      <AnimatePresence>
        {isOpen && <ChatWidget onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full overflow-hidden w-10 h-10 shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:scale-110 hover:rotate-12 active:scale-95 transition-all duration-200">
        <img src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg" alt="Chat" className="w-full h-full object-cover" />
      </button>
    </div>
  );
}
