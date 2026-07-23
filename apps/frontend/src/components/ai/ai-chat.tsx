"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Bot, User, X, Maximize2, Minimize2,
  Lightbulb, BookOpen, TrendingUp, ArrowRight, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const suggestions = [
  "How do I submit a clearance request?",
  "What is my clearance status?",
  "Which officers need to approve my clearance?",
  "How do I download my certificate?",
  "Show me clearance statistics",
  "How do I check exam eligibility?",
  "What should I do next?",
  "Show me recommendations",
];

const quickActions = [
  { label: "Submit Clearance", icon: ArrowRight, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Check Status", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "View Workflow", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
  { label: "Get Help", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10" },
];

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your ClearPath AI assistant. I can help with clearance requests, exam eligibility, workflow questions, and more. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getResponse = useCallback(async (userMessage: string): Promise<{
    reply: string;
    intent?: string;
    followUps?: string[];
  }> => {
    if (!isOnline) {
      const q = userMessage.toLowerCase();
      if (q.includes("clearance") || q.includes("submit")) {
        return { reply: "Clearance is the process of getting approvals from all relevant departments before exams. It includes 6 stages: Finance, Library, Lab, Sports, Department, and Registrar.", followUps: ["How do I submit?", "What are the requirements?"] };
      }
      if (q.includes("workflow") || q.includes("stage") || q.includes("approve")) {
        return { reply: "The clearance workflow has 6 sequential stages: Finance Officer, Library Officer, Lab Officer, Sports Officer, Department Officer, and Registrar. Each must approve before moving on.", followUps: ["Which officer is next?", "What if rejected?"] };
      }
      if (q.includes("certificate") || q.includes("download")) {
        return { reply: "Your clearance certificate is automatically generated when all 6 stages are approved. It includes a unique HMAC-signed QR code for verification.", followUps: ["How to verify?", "What if QR is damaged?"] };
      }
      if (q.includes("eligible") || q.includes("exam")) {
        return { reply: "Exam eligibility is granted automatically when all 6 clearance stages are approved. Check your dashboard for current status.", followUps: ["What if not eligible?", "Check my clearance status"] };
      }
      return {
        reply: "I'm here to help! You can ask me about clearance, workflow, certificates, exam eligibility, or reports. (Offline mode - limited responses)",
        followUps: ["Tell me about clearance", "What is the workflow?"],
      };
    }

    try {
      const chatHistory = messages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await apiService.ai.chat([
        ...chatHistory,
        { role: "user", content: userMessage },
      ]);

      setApiAvailable(true);
      return {
        reply: response.reply,
        intent: response.intent,
        followUps: response.followUps,
      };
    } catch (error) {
      setApiAvailable(false);
      // Fallback to client-side responses if API is unavailable
      const q = userMessage.toLowerCase();
      if (q.includes("status") || q.includes("my clearance")) {
        return { reply: "I can help you check your clearance status. Please visit your Student Dashboard for the most up-to-date information.", followUps: ["Show my dashboard", "Submit clearance"] };
      }
      if (q.includes("hello") || q.includes("hi")) {
        return { reply: "Hello! I'm your ClearPath AI assistant. How can I help you today?", followUps: ["What is clearance?", "How do I submit?"] };
      }
      return {
        reply: "I'm having trouble connecting to the server. Here's what I can tell you:\n\n" +
          "📋 **Clearance** – 6-stage approval process (Finance → Library → Lab → Sports → Department → Registrar)\n" +
          "📄 **Certificate** – Auto-generated with QR code when fully cleared\n" +
          "✅ **Exam Eligibility** – Auto-granted when clearance is approved\n\n" +
          "For real-time information, please visit your dashboard directly.",
        followUps: ["Tell me about clearance", "What is the workflow?", "How do certificates work?"],
      };
    }
  }, [isOnline, messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { reply, followUps } = await getResponse(messageText);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        suggestions: followUps,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong while processing your request. Please try again or check your connection.",
        timestamp: new Date(),
        suggestions: ["Try again", "Check my clearance status", "How do I submit a clearance?"],
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed z-50 flex flex-col glass shadow-2xl border border-glass-border transition-all duration-300",
        isFullscreen
          ? "inset-2 sm:inset-6 rounded-2xl"
          : "bottom-4 right-4 w-[380px] h-[600px] max-h-[calc(100vh-32px)] rounded-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isOnline ? "bg-green-500" : "bg-amber-500"
              )} />
              <p className="text-[10px] text-foreground-muted">
                {isOnline ? (apiAvailable ? "Connected" : "Offline Mode") : "Offline"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-glass-bg rounded-lg transition-colors"
            title={isFullscreen ? "Minimize" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-glass-bg rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {!isOnline && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs mb-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>You're offline. Limited responses available.</span>
          </div>
        )}

        {!apiAvailable && isOnline && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs mb-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>AI server unavailable. Using local responses.</span>
          </div>
        )}

        {/* Welcome suggestions */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs text-foreground-muted mb-3">Try asking about:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full glass hover:bg-glass-bg transition-colors text-foreground-secondary hover:text-foreground"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === "assistant" ? "gradient-primary" : "glass"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "gradient-primary text-white rounded-tr-md"
                    : "glass rounded-tl-md"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.suggestions && msg.suggestions.length > 0 && msg.role === "assistant" && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-glass-border">
                    {msg.suggestions.slice(0, 3).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        className="text-xs px-2 py-1 rounded-lg bg-glass-bg hover:bg-primary/10 transition-colors text-foreground-secondary hover:text-primary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-md p-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-foreground-muted animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.label)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all hover:scale-105",
                action.bg, action.color
              )}
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 pt-2 border-t border-glass-border">
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about clearance, workflow, etc..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-muted"
            disabled={isTyping}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              input.trim() && !isTyping
                ? "gradient-primary text-white shadow-sm shadow-primary/30"
                : "glass text-foreground-muted cursor-not-allowed"
            )}
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
