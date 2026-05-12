"use client"

import { useRef } from "react"

type SwapEffect = "opacity" | "blur" | "scale" | "clip" | "skew"

interface SwapProps {
    state: number
    effects?: SwapEffect[]
    duration?: number
    children: (state: number) => React.ReactNode
}

const effectFunctions = {
    opacity: (element: HTMLElement, progress: number, reverse: boolean) => {
        element.style.opacity = reverse ? `${progress}` : `${1 - progress}`
    },
    blur: (element: HTMLElement, progress: number, reverse: boolean) => {
        element.style.filter = `blur(${progress * 10}px)`
    },
    scale: (element: HTMLElement, progress: number, reverse: boolean) => {
        const scale = reverse ? progress : 1 - progress
        element.style.transform = `scale(${1 - scale * 0.3})`
    },
    clip: (element: HTMLElement, progress: number, reverse: boolean) => {
        const clip = reverse ? progress * 100 : (1 - progress) * 100
        element.style.clipPath = `inset(0 ${clip}% 0 0)`
    },
    skew: (element: HTMLElement, progress: number, reverse: boolean) => {
        const skew = reverse ? progress * 10 : (1 - progress) * 10
        element.style.transform = `skewX(-${skew}deg)`
    },
}

export function Swap({ state, effects = ["opacity", "blur"], duration = 0.5, children }: SwapProps) {
    const containerRef = useRef<HTMLSpanElement>(null)
    const previousStateRef = useRef(state)
    const animationRef = useRef<number | null>(null)

    const animate = (from: number, to: number) => {
        const container = containerRef.current
        if (!container) return

        const children = Array.from(container.children) as HTMLElement[]
        if (children.length < 2) return

        const outEl = children[0]
        const inEl = children[1]

        const startTime = performance.now()

        const animateFrame = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / (duration * 1000), 1)

            effects.forEach((effect) => {
                const fn = effectFunctions[effect]
                if (fn) {
                    fn(outEl, progress, false)
                    fn(inEl, progress, true)
                }
            })

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animateFrame)
            } else {
                outEl.style.opacity = "0"
                inEl.style.opacity = "1"
                inEl.style.filter = "none"
                inEl.style.transform = "none"
                inEl.style.clipPath = "none"

                const temp = outEl.cloneNode(true) as HTMLElement
                outEl.parentNode?.replaceChild(temp, outEl)
            }
        }

        animationRef.current = requestAnimationFrame(animateFrame)
    }

    if (previousStateRef.current !== state) {
        previousStateRef.current = state
        requestAnimationFrame(() => animate(previousStateRef.current, state))
    }

    return (
        <span ref={containerRef} className="relative inline-block">
            {children(state)}
        </span>
    )
}