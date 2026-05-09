"use client";
import React, { useState, useEffect, useCallback } from "react";
import { TextFlippingBoard } from "@/components/ui/text-flipping-board";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { SquigglyText } from "@/components/ui/squiggly-text";

const MESSAGES: string[] = [
  "STAY HUNGRY \nSTAY IN BED \n- STEVE JOBS",
  "hat did you get done this week?",
  "I burned $20 \nfor this shit.",
  "DONT WORRY \nBE HAPPY FFS.",
  "LADIES AND GENTLEMEN \nWELCOME TO F#!@# C!@$",
];

export default function TextFlippingBoardDemo() {
  const [msgIdx, setMsgIdx] = useState(0);

  const next = useCallback(
    () => setMsgIdx((i) => (i + 1) % MESSAGES.length),
    [],
  );

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="flex w-full h-full flex-col items-center justify-center gap-8 px-4">
      <TextFlippingBoard text={MESSAGES[msgIdx]} />
      <div className="w-full max-w-3xl">
        <p className="text-left text-white/70 text-sm md:text-base leading-relaxed">
          <span className="text-white/90">You</span>{" "}
          <span className="text-white/90">are not your job</span>,{" "}
          <span className="text-white/90">you&apos;re not how much money</span>{" "}
          you have in the bank. <span className="text-white/90">You are not the car</span> you drive.{" "}
          <span className="text-white/90">You&apos;re not the contents</span> of your wallet.{" "}
          <span className="text-white/90">You are not your fucking khakis</span>.{" "}
          <EncryptedText
            text="All singing, all dancing crap of the world."
            className="text-white/90"
            encryptedClassName="text-white/30"
            revealedClassName="text-white/90"
          />
        </p>
      </div>
    </div>
  );
}