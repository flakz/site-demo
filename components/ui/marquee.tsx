import { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <>
      <style>
        {`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(calc(-100% - var(--gap)));
            }
          }

          @keyframes marquee-vertical {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(calc(-100% - var(--gap)));
            }
          }

          .animate-marquee {
            animation: marquee var(--duration) linear infinite;
          }

          .animate-marquee-vertical {
            animation: marquee-vertical var(--duration) linear infinite;
          }

          .animate-reverse {
            animation-direction: reverse !important;
          }

          .pause-on-hover:hover .animate-marquee,
          .pause-on-hover:hover .animate-marquee-vertical {
            animation-play-state: paused !important;
          }
        `}
      </style>
      <div
        {...props}
        className={cn(
          "group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
          !vertical ? "flex-row" : "flex-col",
          pauseOnHover ? "pause-on-hover" : "",
          className,
        )}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex shrink-0 justify-around gap-(--gap)",
                !vertical ? "animate-marquee flex-row" : "animate-marquee-vertical flex-col",
                reverse ? "animate-reverse" : ""
              )}
            >
              {children}
            </div>
          ))}
      </div>
    </>
  );
}