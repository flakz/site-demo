"use client"

import { Marquee } from "@/components/ui/marquee";

const profiles = [
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-1.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-2.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-3.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-4.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-5.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-6.png",
    "https://raw.githubusercontent.com/flakz/marno-chat-widget/emdash/sixty-emus-drum-smyyq/public/avatars/avatar-7.png",
];

const reviews = [
  {
    name: "Ken Masters",
    username: "@kmasters",
    body: "Okay fine, the green bubble works. Didn't expect it to reply.",
    profile: profiles[0],
  },
  {
    name: "Kira Athrun",
    username: "@kathrun",
    body: "ngl that bubble got me like bro this actually works",
    profile: profiles[1],
  },
  {
    name: "Lirael Nassun",
    username: "@lnassun",
    body: "Chat widget says hi. Chat widget means business. Simple.",
    profile: profiles[2],
  },
  {
    name: "Jessica",
    username: "@jessica",
    body: "Lowkey impressed. This thing answered faster than expected.",
    profile: profiles[3],
  },
  {
    name: "Jenny",
    username: "@jenny",
    body: "No real person? Okay but the answers were actually helpful",
    profile: profiles[4],
  },
  {
    name: "Kira Athrun",
    username: "@kathrun2",
    body: "Found the secret bubble and immediately clicked it",
    profile: profiles[5],
  },
  {
    name: "Ken Masters",
    username: "@kmasters2",
    body: "Works on the first try. No friction. That's rare fr.",
    profile: profiles[6],
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
      <div className="flex flex-col gap-2">
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
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
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