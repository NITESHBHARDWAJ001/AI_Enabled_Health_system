import { useEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as aiApi from "@/api/ai";
import type { AIConversationType, AIMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/cn";
import { extractErrorMessage } from "@/api/client";
import { toast } from "@/store/toastStore";

export function ChatPanel({
  type,
  patientId,
  className,
  emptyStateHint,
}: {
  type: AIConversationType;
  patientId?: string;
  className?: string;
  emptyStateHint?: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();

  const stt = useSpeechRecognition((finalText) => {
    setInput((prev) => (prev ? `${prev} ${finalText}` : finalText));
  });

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    aiApi
      .startConversation(type, patientId)
      .then((conversation) => {
        setConversationId(conversation.id);
        setMessages(conversation.messages ?? []);
      })
      .catch((err) => {
        startedRef.current = false;
        toast({ title: "Couldn't start AI assistant", description: extractErrorMessage(err), variant: "error" });
      })
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, patientId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || !conversationId || sending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, conversationId, role: "USER", content, createdAt: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const { reply } = await aiApi.sendMessage(conversationId, content);
      setMessages((prev) => [...prev, reply]);
      tts.speak(reply.content);
    } catch (err) {
      toast({ title: "AI assistant is unavailable", description: extractErrorMessage(err), variant: "error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div ref={listRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {initializing && (
          <div className="flex h-full items-center justify-center text-surface-400">
            <Spinner className="h-5 w-5" />
          </div>
        )}
        {!initializing && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-surface-400">
            <Sparkles className="h-6 w-6 text-accent-500" />
            <p className="text-sm">{emptyStateHint ?? "Ask me anything about your health — I'm here to help."}</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", m.role === "USER" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "USER"
                    ? "bg-brand-700 text-white rounded-br-sm"
                    : "bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-100 rounded-bl-sm"
                )}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-100 dark:bg-surface-800 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-surface-400" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-end gap-2 border-t border-surface-200 dark:border-surface-800 pt-3">
        {stt.supported && (
          <button
            type="button"
            onClick={() => (stt.isListening ? stt.stop() : stt.start())}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              stt.isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-brand-700"
            )}
            title={stt.isListening ? "Stop listening" : "Speak your message"}
          >
            {stt.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        {tts.supported && (
          <button
            type="button"
            onClick={() => tts.setEnabled((v) => !v)}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              tts.enabled
                ? "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
                : "bg-surface-100 dark:bg-surface-800 text-surface-500"
            )}
            title={tts.enabled ? "Voice replies on" : "Voice replies off"}
          >
            {tts.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={stt.isListening ? stt.interimText || "Listening..." : "Type your message..."}
          rows={1}
          className="max-h-28 flex-1 resize-none rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim() || sending || initializing}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-surface-400">
        AI guidance only — not a diagnosis. Always confirm with your doctor.
      </p>
    </div>
  );
}
