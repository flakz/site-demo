"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { clsx, type ClassValue } from "clsx";
function cn(...a: ClassValue[]) { return clsx(a); }

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hasStarted, setHasStarted] = useState(false);

  const [revealCount, setRevealCount] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);
  const scrambleCharsRef = useRef<string[]>([]);

  useEffect(() => { setHasStarted(true); }, []);

  useEffect(() => {
    if (!isInView || !hasStarted) return;

    const initial = text ? text.split("").map(ch => ch === " " ? " " : generateRandomCharacter(charset)) : [];
    scrambleCharsRef.current = initial;
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setRevealCount(0);

    let isCancelled = false;

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(totalLength, Math.floor(elapsedMs / Math.max(1, revealDelayMs)));

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) return;

      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            scrambleCharsRef.current[index] = text[index] === " " ? " " : generateRandomCharacter(charset);
          }
        }
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs, hasStarted]);

  if (!text) return null;

  return (
    <motion.span ref={ref} className={cn(className)} aria-label={text} role="text" suppressHydrationWarning>
      {!hasStarted ? (
        <span className={cn(encryptedClassName)} suppressHydrationWarning>
          {" ".repeat(text.length)}
        </span>
      ) : (
        text.split("").map((char, index) => {
          const isRevealed = index < revealCount;
          const displayChar = isRevealed ? char : char === " " ? " " : (scrambleCharsRef.current[index] ?? generateRandomCharacter(charset));
          return <span key={index} className={cn(isRevealed ? revealedClassName : encryptedClassName)}>{displayChar}</span>;
        })
      )}
    </motion.span>
  );
};
