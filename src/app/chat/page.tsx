"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatWelcome from "@/components/ChatWelcome";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import EmotionIndicator from "@/components/EmotionIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface EmotionData {
  emotion: string;
  intensity: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [latestEmotion, setLatestEmotion] = useState<EmotionData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Demo defaults — in production these come from auth
  const counselorName = "김지수 상담사";
  const userName = "사용자";
  const userId = "demo-user";

  // Create session on mount, injecting survey context if available
  useEffect(() => {
    async function initSession() {
      try {
        // Read survey AI context from sessionStorage
        let aiContextJson = null;
        try {
          const stored = sessionStorage.getItem("survey_ai_context");
          if (stored) {
            aiContextJson = JSON.parse(stored);
            // Clear after use so next session doesn't reuse stale context
            sessionStorage.removeItem("survey_ai_context");
          }
        } catch {
          // sessionStorage not available
        }

        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, ...(aiContextJson ? { aiContextJson } : {}) }),
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id);
      } catch {
        // session creation failed
      }
    }
    initSession();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text.trim() }),
        });

        // Check for non-streaming (crisis) response
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "-reply",
              role: "assistant",
              content: data.content,
              timestamp: new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
          setIsLoading(false);
          return;
        }

        // Handle SSE stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        const assistantId = Date.now().toString() + "-reply";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    assistantContent += parsed.text;
                    // Remove emotion metadata from display
                    const displayContent = assistantContent
                      .replace(/<!-- EMOTION:.*? -->/g, "")
                      .trim();

                    setMessages((prev) => {
                      const existing = prev.find((m) => m.id === assistantId);
                      if (existing) {
                        return prev.map((m) =>
                          m.id === assistantId
                            ? { ...m, content: displayContent }
                            : m
                        );
                      }
                      return [
                        ...prev,
                        {
                          id: assistantId,
                          role: "assistant" as const,
                          content: displayContent,
                          timestamp: new Date().toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                      ];
                    });
                  }
                } catch {
                  // parse error, skip
                }
              }
            }
          }

          // Extract emotion from full response
          const emotionMatch = assistantContent.match(
            /<!-- EMOTION:({.*?}) -->/
          );
          if (emotionMatch) {
            try {
              const emotionData = JSON.parse(emotionMatch[1]);
              setLatestEmotion({
                emotion: emotionData.emotion,
                intensity: emotionData.intensity,
              });
            } catch {
              // parse failed
            }
          }
        }
      } catch {
        // network error
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [sessionId, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-screen">
      <ChatHeader counselorName={counselorName} />

      {latestEmotion && (
        <EmotionIndicator
          emotion={latestEmotion.emotion}
          intensity={latestEmotion.intensity}
        />
      )}

      <main className="chat-messages">
        {messages.length === 0 ? (
          <ChatWelcome
            counselorName={counselorName}
            userName={userName}
            onQuickPrompt={sendMessage}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                counselorName={counselorName}
                timestamp={msg.timestamp}
              />
            ))}
            {isLoading && <TypingIndicator counselorName={counselorName} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="이야기를 나눠보세요..."
            rows={1}
            className="chat-input"
            disabled={isLoading || !sessionId}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || !sessionId}
            className="chat-send-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
