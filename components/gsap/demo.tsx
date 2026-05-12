"use client"

import { Marquee } from "@/components/ui/marquee";

const reviews = [
  {
    name: "Ken Masters",
    username: "@kmasters",
    body: "\"Our productivity has nearly doubled since onboarding. Automation features removed repetitive tasks, allowing our team to focus on building instead of managing operations.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/rough.webp",
  },
  {
    name: "Kira Athrun",
    username: "@kathrun",
    body: "\"What surprised us most was how quickly our team adapted. Minimal learning curve, excellent documentation, and powerful features make it a must-have for modern SaaS companies.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/albert.webp",
  },
  {
    name: "Lirael Nassun",
    username: "@lnassun",
    body: "\"This is easily one of the most reliable SaaS tools we've adopted. The UI is intuitive, integrations are seamless, and it saves us countless hours every week.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/linda.webp",
  },
  {
    name: "Jessica",
    username: "@jessica",
    body: "Switching to this platform streamlined our entire workflow. Setup was effortless, performance improved instantly, and our team now ships features faster without worrying about infrastructure.",
    profile: "https://images.shadcnspace.com/assets/profiles/jessica.webp",
  },
  {
    name: "Jenny",
    username: "@jenny",
    body: "\"We evaluated multiple solutions, but this stood out immediately. It's fast, scalable, and thoughtfully designed for growing teams that need stability without added complexity.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/jenny.webp",
  },
  {
    name: "Kira Athrun",
    username: "@kathrun2",
    body: "\"What surprised us most was how quickly our team adapted. Minimal learning curve, excellent documentation, and powerful features make it a must-have for modern SaaS companies.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/albert.webp",
  },
  {
    name: "Ken Masters",
    username: "@kmasters2",
    body: "\"Our productivity has nearly doubled since onboarding. Automation features removed repetitive tasks, allowing our team to focus on building instead of managing operations.\"",
    profile: "https://images.shadcnspace.com/assets/profiles/rough.webp",
  },
];

const firstRow = reviews.slice(0, Math.ceil(reviews.length / 2));
const secondRow = reviews.slice(Math.ceil(reviews.length / 2));

const ReviewCard = ({
  profile,
  name,
  username,
  body,
}: {
  profile: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <div className="relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="p-0 flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <img
            className="rounded-full"
            width="32"
            height="32"
            alt=""
            src={profile}
          />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs font-medium text-white/50">
              {username}
            </p>
          </div>
        </div>
        <p className="text-sm line-clamp-2 text-white/80">{body}</p>
      </div>
    </div>
  );
};

export const Demo = () => {
  return (
    <div className="relative flex w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/4 bg-[linear-gradient(to right,rgba(0,0,0,0.15),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-[linear-gradient(to left,rgba(0,0,0,0.15),transparent)]" />
      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
          </div>
  );
};