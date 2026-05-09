"use client";

import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { RotateCw, X, ArrowUp, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://n8n.marno.pro/webhook/marno-chat";
const KB_SLUG = process.env.NEXT_PUBLIC_KB_SLUG || "kbase";

type Message = { id: string; role: 'user' | 'model' | 'system'; text: string; };

const SUGGESTIONS = [
  { label: process.env.NEXT_PUBLIC_SUGGEST_1_LABEL || "Get started", prompt: process.env.NEXT_PUBLIC_SUGGEST_1_PROMPT || "How do I get started with the platform?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_2_LABEL || "See templates", prompt: process.env.NEXT_PUBLIC_SUGGEST_2_PROMPT || "Can you show me the available templates?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_3_LABEL || "Pricing", prompt: process.env.NEXT_PUBLIC_SUGGEST_3_PROMPT || "What are the pricing plans available?" },
  { label: process.env.NEXT_PUBLIC_SUGGEST_4_LABEL || "Book a demo", prompt: process.env.NEXT_PUBLIC_SUGGEST_4_PROMPT || "I would like to book a demo." },
  { label: process.env.NEXT_PUBLIC_SUGGEST_5_LABEL || "Documentation", prompt: process.env.NEXT_PUBLIC_SUGGEST_5_PROMPT || "Where can I find the API documentation?" }
];

const GREETING_1 = process.env.NEXT_PUBLIC_GREETING_1 || "Hi there! I'm an AI agent trained on docs, help articles, and other important content.";
const GREETING_2 = process.env.NEXT_PUBLIC_GREETING_2 || "How can I best help you today?";

export default function ChatWidget({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: 'system', text: GREETING_1 },
    { id: crypto.randomUUID(), role: 'system', text: GREETING_2 }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sessionIdRef.current = crypto.randomUUID(); }, []);

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
      { id: crypto.randomUUID(), role: 'system', text: GREETING_1 },
      { id: crypto.randomUUID(), role: 'system', text: GREETING_2 }
    ]);
    setInputValue("");
    sessionIdRef.current = crypto.randomUUID();
  };
  const isInputEmpty = inputValue.trim().length === 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed bottom-[56px] right-4 sm:bottom-[72px] sm:right-6 z-[51] w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] sm:h-[720px] max-h-[calc(100vh-8rem)] z-50 bg-white rounded-[24px] shadow-[0_12px_48px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden border border-gray-100 chat-widget">
      <div className="bg-[#0D72FF] text-white px-4 py-[14px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-[26px] h-[26px] rounded-full bg-[#2A2E35] flex items-center justify-center overflow-hidden shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="translate-y-[1px]"><path d="M4 17V10A4 4 0 0 1 12 10V17M12 17V10A4 4 0 0 1 20 10V17" /></svg>
          </div>
          <span className="font-semibold text-[15px] tracking-wide">Marno AI</span>
        </div>
        <div className="flex items-center gap-3.5">
          <button onClick={handleReset} className="text-white hover:opacity-80 transition-opacity focus:outline-none" title="Reset chat"><RotateCw size={18} strokeWidth={2.5} /></button>
          <button onClick={onClose} className="text-white hover:opacity-80 transition-opacity focus:outline-none"><X size={20} strokeWidth={2.5} /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4 pt-6 pb-28">
        <div className="flex flex-col items-center mb-6 text-center"><p className="text-[13px] text-gray-500 leading-relaxed max-w-[320px] text-center">Demo use free providers, expect slower replies.</p></div>
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
                <motion.div layout={isUser ? true : "position"} key={msg.id} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease: "easeOut" }} className={`flex flex-col gap-1.5 w-full origin-bottom ${isRoleChange ? 'mt-3' : ''} ${isUser ? 'items-end' : 'items-start'}`}>
                  {parts.map((part, pIdx) => (
                    <motion.div layoutId={isUser && pIdx === 0 ? `suggestion-${msg.text}` : undefined} key={pIdx} className={`px-[16px] py-2 rounded-[12px] text-[15px] w-fit max-w-[88%] leading-snug overflow-hidden ${isUser ? 'bg-[#0D72FF] text-white rounded-tr-sm' : 'bg-[#F0F2F5] text-[#1E1E1E] rounded-tl-sm'}`}>
                      <div className="[&>p]:m-0 [&>p:not(:last-child)]:mb-3 [&>ul]:my-2 [&>ul]:pl-5 [&>ul]:list-disc [&>ol]:my-2 [&>ol]:pl-5 [&>ol]:list-decimal [&>strong]:font-semibold [&_strong]:font-semibold"><ReactMarkdown remarkPlugins={[remarkBreaks]}>{part || ' '}</ReactMarkdown></div>
                    </motion.div>
                  ))}
                </motion.div>
              );
            })}
            {isLoading && (
              <motion.div layout key="loading-indicator" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex justify-start mt-3 w-full">
                <div className="bg-[#F0F2F5] text-[#1E1E1E] px-[16px] py-2 rounded-[12px] rounded-tl-sm text-[15px] w-fit max-w-[88%] leading-snug flex items-center gap-2"><Loader2 size={16} className="animate-spin text-gray-500" /><span className="text-gray-500">Thinking...</span></div>
              </motion.div>
            )}
            {!isLoading && messages.length === 2 && messages[0].role === 'system' && (
              <motion.div layout key="suggestions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.15 } }} transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }} className="flex flex-wrap gap-2 mt-2 justify-start w-full">
                {SUGGESTIONS.map((suggestion) => (
                  <motion.button layoutId={`suggestion-${suggestion.prompt}`} key={suggestion.prompt} onClick={() => handleSend(suggestion.prompt)} className="bg-[#EBF5FF] text-[#0D72FF] hover:bg-[#D6EAFC] px-[14px] py-[8px] rounded-[10px] text-[14.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">{suggestion.label}</motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <div className="relative flex items-center rounded-full bg-white border-2 border-gray-200 pointer-events-auto">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message..." disabled={isLoading} className="w-full bg-transparent text-gray-900 placeholder-[#9A9A9A] rounded-full pl-5 pr-12 py-[10px] text-[15px] focus:outline-none focus:ring-[1.5px] focus:ring-[#0D72FF] transition-shadow disabled:opacity-70 disabled:cursor-not-allowed" />
          <button onClick={() => handleSend()} disabled={isInputEmpty || isLoading} className={`absolute top-1/2 -translate-y-1/2 right-[5px] w-[30px] h-[30px] flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${isInputEmpty || isLoading ? 'bg-[#E5E5E5] text-[#8C8C8C] cursor-not-allowed' : 'bg-[#0D72FF] text-white hover:bg-blue-600 cursor-pointer'}`}><ArrowUp size={18} strokeWidth={2.5} /></button>
        </div>
      </div>
    </motion.div>
  );
}
