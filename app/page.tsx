"use client";

import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { GithubInlineComments } from "@/components/github-inline-comments";
function cn(...a: (string | undefined | null | false)[]) { return a.filter(Boolean).join(" "); }

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

// ── LandingText (parse markers: *bold* = highlight, $scramble$ = animated) ──

function parseLandingText(text: string) {
  const parts: { text: string; type: 'plain' | 'highlight' | 'scramble' }[] = [];
  const regex = /(\*[^*]+\*|\$[^*$]+\$)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), type: 'plain' });
    const content = match[0].slice(1, -1);
    if (match[0].startsWith('*')) parts.push({ text: content, type: 'highlight' });
    else if (match[0].startsWith('$')) parts.push({ text: content, type: 'scramble' });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), type: 'plain' });
  return parts;
}

function LandingText({ text }: { text: string }) {
  const parts = parseLandingText(text);
  return (
    <p className="text-left text-white/70 text-sm md:text-base leading-relaxed">
      {parts.map((part, i) => {
        if (part.type === 'plain') return <span key={i}>{part.text}</span>;
        if (part.type === 'highlight') return <strong key={i} className="font-semibold text-white">{part.text}</strong>;
        return <EncryptedText key={i} text={part.text} revealedClassName="font-semibold text-white" encryptedClassName="font-semibold text-white/20" />;
      })}
    </p>
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
      if (currentRevealCount >= text.length) { animationFrameRef.current = null; return; }
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

const STATIC_DIFF = [
  { kind: "hunk", content: "@@ -10,8 +10,10 @@" },
  { kind: "context", old: 10, new: 10, content: " export async function getUserName(id: string) {" },
  { kind: "context", old: 11, new: 11, content: "   // Fetch user from cache or database" },
  { kind: "del", old: 12, new: null, content: "   const user = cache.get(id)" },
  { kind: "add", old: null, new: 12, content: "   let user = cache.get(id)" },
  { kind: "context", old: 13, new: 13, content: "   if (!user) {" },
  { kind: "add", old: null, new: 14, content: "     user = await db.users.findById(id)" },
  { kind: "add", old: null, new: 15, content: "     if (user) cache.set(id, user)" },
  { kind: "context", old: 14, new: 16, content: "   }" },
  { kind: "context", old: 15, new: 17, content: "   return user?.name" },
  { kind: "add", old: null, new: 18, content: "   return user?.name ?? '(unknown)'" },
  { kind: "context", old: 16, new: 19, content: " }" },
] as const;
const LANDING_TEXT = process.env.NEXT_PUBLIC_LANDING_TEXT || "You are not your job, you're not how much money you have in the bank. You are not the car you drive. You're not the contents of your wallet. *$All singing, all dancing crap of the world.*";

const FAQ_ITEMS = [
  { title: process.env.NEXT_PUBLIC_FAQ_1_TITLE || "How do I place an order?", content: process.env.NEXT_PUBLIC_FAQ_1_CONTENT || "Browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping and payment information to complete your purchase." },
  { title: process.env.NEXT_PUBLIC_FAQ_2_TITLE || "Can I modify or cancel my order?", content: process.env.NEXT_PUBLIC_FAQ_2_CONTENT || "Yes, you can modify or cancel your order before it's shipped. Once your order is processed, you can't make changes." },
  { title: process.env.NEXT_PUBLIC_FAQ_3_TITLE || "What payment methods do you accept?", content: process.env.NEXT_PUBLIC_FAQ_3_CONTENT || "We accept all major credit cards, debit cards, and PayPal. Your payment information is encrypted and processed securely." },
  { title: process.env.NEXT_PUBLIC_FAQ_4_TITLE || "How long does shipping take?", content: process.env.NEXT_PUBLIC_FAQ_4_CONTENT || "Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business day delivery." },
];

function AccordionFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="w-full max-w-3xl">
      {FAQ_ITEMS.map((item, idx) => (
        <div key={idx} className={cn(idx > 0 && "border-t border-white/10")}>
          <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} className="flex w-full items-center justify-between py-3 text-left text-white/80 hover:text-white transition-colors">
            <span className="text-sm md:text-base font-medium">{item.title}</span>
            <motion.span animate={{ rotate: openIdx === idx ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/50"><ChevronDown size={18} /></motion.span>
          </button>
          <motion.div initial={false} animate={{ height: openIdx === idx ? "auto" : 0, opacity: openIdx === idx ? 1 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
            <p className="pb-3 text-sm text-white/50 leading-relaxed">{item.content}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Velaris height="100vh" bg="#000000" colors={["#86efac", "#4ade80", "#059669", "#000000"]} speed={2} grain={0.3}>
        <div className="flex w-full h-full flex-col items-center justify-center gap-8 px-4">
          <div className="w-full max-w-3xl">
            <LandingText text={LANDING_TEXT} />
          </div>
          <div className="w-full max-w-3xl">
            <GithubInlineComments fileName="src/server.ts" diff={STATIC_DIFF} />
          </div>
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
