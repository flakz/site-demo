"use client";

import { RotateCw, X, ArrowUp, Loader2 } from "lucide-react";
import Velaris from '@/components/forgeui/velaris';
import { TextFlippingBoard } from '@/components/ui/text-flipping-board';
import { EncryptedText } from '@/components/ui/encrypted-text';
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { AnimatePresence, motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
function c(...a: ClassValue[]) { return clsx(a); }

const DEMO_MSGS = [
  "STAY HUNGRY \nSTAY IN BED \n- STEVE JOBS",
  "hat did you get done this week?",
  "I burned $20 \nfor this shit.",
  "DONT WORRY \nBE HAPPY FFS.",
  "LADIES AND GENTLEMEN \nWELCOME TO F#!@# C!@$",
];

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://n8n.marno.pro/webhook/marno-chat";
const KB_SLUG = process.env.NEXT_PUBLIC_KB_SLUG || "kbase";

type Message = {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
};

const SUGGESTIONS = [
  { label: "Get started", prompt: "How do I get started with the platform?" },
  { label: "See templates", prompt: "Can you show me the available templates?" },
  { label: "Pricing", prompt: "What are the pricing plans available?" },
  { label: "Book a demo", prompt: "I would like to book a demo." },
  { label: "Documentation", prompt: "Where can I find the API documentation?" }
];

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
  useEffect(() => {
    const id = setInterval(() => setDemoIdx(i => (i + 1) % DEMO_MSGS.length), 6000);
    return () => clearInterval(id);
  }, []);

const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;
    if (!textOverride) setInputValue("");

    const userMsgObj: Message = { id: crypto.randomUUID(), role: 'user', text: textToSend.trim() };
    setMessages(prev => [...prev, userMsgObj]);
    setIsLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend.trim(), sessionId: sessionIdRef.current, slug: KB_SLUG }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      const resp = await res.json();
      const responseText: string = resp.response || "";

      const modelMessageId = crypto.randomUUID();
      setIsLoading(false);
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: "" }]);

      const chars = responseText.split("");
      let fullText = "";
      for (let i = 0; i < chars.length; i += 2) {
        fullText += chars.slice(i, i + 2).join("");
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
          <TextFlippingBoard text={DEMO_MSGS[demoIdx]} />
          <div className="w-full max-w-3xl">
            <p className="text-left text-white/70 text-sm md:text-base leading-relaxed">
              <span className="text-white/90">You</span>{" "}
              <span className="text-white/90">are not your job</span>,{" "}
              <span className="text-white/90">you&apos;re not how much money</span>{" "}
              you have in the bank. <span className="text-white/90">You are not the car</span> you drive.{" "}
              <span className="text-white/90">you&apos;re not the contents</span> of your wallet.{" "}
              <span className="text-white/90">You are not your fucking khakis</span>.{" "}
              <EncryptedText text="All singing, all dancing crap of the world." className="text-white/90" encryptedClassName="text-white/30" revealedClassName="text-white/90" />
            </p>
          </div>
        </div>
      </Velaris>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ originX: 1, originY: 1 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] sm:h-[720px] max-h-[calc(100vh-8rem)] z-50 bg-white rounded-[24px] shadow-[0_12px_48px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden border border-gray-100 chat-widget"
          >
            <div className="bg-[#0D72FF] text-white px-4 py-[14px] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-[26px] h-[26px] rounded-full bg-[#2A2E35] flex items-center justify-center overflow-hidden shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[1px]">
                    <path d="M4 17V10A4 4 0 0 1 12 10V17M12 17V10A4 4 0 0 1 20 10V17" />
                  </svg>
                </div>
                <span className="font-semibold text-[15px] tracking-wide">Marno AI</span>
              </div>
              <div className="flex items-center gap-3.5">
                <button onClick={handleReset} className="text-white hover:opacity-80 transition-opacity focus:outline-none" title="Reset chat">
                  <RotateCw size={18} strokeWidth={2.5} />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80 transition-opacity focus:outline-none">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4 pt-6 pb-28">
              <div className="flex flex-col items-center mb-6 text-center">
                <p className="text-[13px] text-gray-500 leading-relaxed max-w-[320px] text-center">Demo use free providers, expect slower replies.</p>
              </div>

              <div className="flex flex-col gap-1.5 w-full relative">
                <AnimatePresence mode="popLayout" initial={true}>
                  {messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const isRoleChange = prevMsg && (prevMsg.role !== msg.role || (prevMsg.role === 'system' && msg.role === 'model'));
                    const isUser = msg.role === 'user';
                    const isAi = msg.role === 'model' || msg.role === 'system';

                    const parts = isUser ? [msg.text] : msg.text.split(/(?:\r?\n){2,}/).filter(t => t.trim().length > 0);
                    if (parts.length === 0 && isAi) parts.push("");

                    return (
                      <motion.div
                        layout={isUser ? true : "position"}
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`flex flex-col gap-1.5 w-full origin-bottom ${isRoleChange ? 'mt-3' : ''} ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        {parts.map((part, pIdx) => (
                          <motion.div
                            layoutId={isUser && pIdx === 0 ? `suggestion-${msg.text}` : undefined}
                            key={pIdx}
                            className={`px-[16px] py-2 rounded-[12px] text-[15px] w-fit max-w-[88%] leading-snug overflow-hidden ${
                              isUser ? 'bg-[#0D72FF] text-white rounded-tr-sm' : 'bg-[#F0F2F5] text-[#1E1E1E] rounded-tl-sm'
                            }`}
                          >
                            <div className="[&>p]:m-0 [&>p:not(:last-child)]:mb-3 [&>ul]:my-2 [&>ul]:pl-5 [&>ul]:list-disc [&>ol]:my-2 [&>ol]:pl-5 [&>ol]:list-decimal [&>strong]:font-semibold [&_strong]:font-semibold">
                              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                {part || ' '}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    );
                  })}

                  {isLoading && (
                    <motion.div
                      layout
                      key="loading-indicator"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex justify-start mt-3 w-full"
                    >
                      <div className="bg-[#F0F2F5] text-[#1E1E1E] px-[16px] py-2 rounded-[12px] rounded-tl-sm text-[15px] w-fit max-w-[88%] leading-snug flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-gray-500" />
                        <span className="text-gray-500">Thinking...</span>
                      </div>
                    </motion.div>
                  )}

                  {!isLoading && messages.length === 2 && messages[0].role === 'system' && (
                    <motion.div
                      layout
                      key="suggestions"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
                      className="flex flex-wrap gap-2 mt-2 justify-start w-full"
                    >
                      {SUGGESTIONS.map((suggestion, idx) => (
                        <motion.button
                          layoutId={`suggestion-${suggestion.prompt}`}
                          key={idx}
                          onClick={() => handleSend(suggestion.prompt)}
                          className="bg-[#EBF5FF] text-[#0D72FF] hover:bg-[#D6EAFC] px-[14px] py-[8px] rounded-[10px] text-[14.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {suggestion.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
              <div className="relative flex items-center rounded-full bg-white border-2 border-gray-200 pointer-events-auto">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  disabled={isLoading}
                  className="w-full bg-transparent text-gray-900 placeholder-[#9A9A9A] rounded-full pl-5 pr-12 py-[10px] text-[15px] focus:outline-none focus:ring-[1.5px] focus:ring-[#0D72FF] transition-shadow disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isInputEmpty || isLoading}
                  className={`absolute top-1/2 -translate-y-1/2 right-[5px] w-[30px] h-[30px] flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    isInputEmpty || isLoading ? 'bg-[#E5E5E5] text-[#8C8C8C] cursor-not-allowed' : 'bg-[#0D72FF] text-white hover:bg-blue-600 cursor-pointer'
                  }`}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-12 right-4 sm:right-6 z-50 rounded-full overflow-hidden w-10 h-10 shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:scale-110 hover:rotate-12 active:scale-95 transition-all duration-200"
      >
        <img
          src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg"
          alt="Chat"
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
}