"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatHeader from "@/components/ChatHeader";
import ChatWelcome from "@/components/ChatWelcome";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import EmotionIndicator from "@/components/EmotionIndicator";
import { formatKoreanTimestamp } from "@/lib/utils";

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

/** Strip all metadata comment tags from message content */
function stripMetadata(text: string): string {
  let cleaned = text
    .replace(/<!-- EMOTION:\{[\s\S]*?\} -->/g, "")
    .replace(/<!-- SUGGESTIONS:\[[\s\S]*?\] -->/g, "")
    .replace(/<!-- STAGE:\d+ -->/g, "")
    .replace(/<!-- SESSION_COMPLETE:[\s\S]*? -->/g, "")
    .replace(/<!-- ASSIGNMENT:\{[\s\S]*?\} -->/g, "");
  // Strip incomplete metadata tags still being streamed (e.g. "<!-- EMOTION:{..." without closing "-->")
  cleaned = cleaned.replace(/<!--\s*(EMOTION|SUGGESTIONS|STAGE|SESSION_COMPLETE|ASSIGNMENT)[\s\S]*$/g, "");
  return cleaned.trim();
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="chat-screen" />}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const existingSessionId = searchParams.get("sessionId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [latestEmotion, setLatestEmotion] = useState<EmotionData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const canEndSession = sessionComplete || userMessageCount >= 10;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingMessageRef = useRef<string | null>(null);

  // Demo defaults — in production these come from auth
  const counselorName = "상담사";
  const [userName, setUserName] = useState("회원");
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user?.name) setUserName(d.user.name);
      if (d?.user?.id) setAuthUserId(d.user.id);
    }).catch(() => {});
  }, []);

  const [sessionError, setSessionError] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Create session, injecting survey context if available
  const initSession = useCallback(async () => {
    if (!authUserId) return;
    setSessionLoading(true);
    setSessionError(false);
    try {
      // If navigated with an existing sessionId, load it instead of creating a new one
      if (existingSessionId) {
        setSessionId(existingSessionId);
        try {
          const msgRes = await fetch(`/api/chat?sessionId=${existingSessionId}`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            if (Array.isArray(msgData.messages)) {
              setMessages(msgData.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: stripMetadata(m.content),
                timestamp: m.createdAt,
              })));
            }
          }
        } catch { /* ignore */ }
        setSessionLoading(false);
        return;
      }

      // Read survey AI context from sessionStorage
      let aiContextJson = null;
      let surveySessionId: string | null = null;
      try {
        const stored = sessionStorage.getItem("survey_ai_context");
        if (stored) {
          aiContextJson = JSON.parse(stored);
          sessionStorage.removeItem("survey_ai_context");
        }
        surveySessionId = sessionStorage.getItem("survey_session_id");
        if (surveySessionId) {
          sessionStorage.removeItem("survey_session_id");
        }
      } catch {
        // sessionStorage not available
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUserId,
          counselingMode: "chat",
          ...(aiContextJson ? { aiContextJson } : {}),
          ...(surveySessionId ? { surveySessionId } : {}),
        }),
      });
      const data = await res.json();
      if (data.id) {
        setSessionId(data.id);
        setSessionError(false);
      } else {
        setSessionError(true);
      }
    } catch {
      setSessionError(true);
    } finally {
      setSessionLoading(false);
    }
  }, [authUserId, existingSessionId]);

  // Create session once authUserId is available
  useEffect(() => {
    if (!authUserId) return;
    initSession();
  }, [initSession, authUserId]);

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
        timestamp: formatKoreanTimestamp(),
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
              content: stripMetadata(data.content),
              timestamp: formatKoreanTimestamp(),
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
                    // Remove all metadata from display
                    const displayContent = stripMetadata(assistantContent);

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
                          timestamp: formatKoreanTimestamp(),
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
            /<!-- EMOTION:(\{[\s\S]*?\}) -->/
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

          // Extract suggestions
          const suggestionsMatch = assistantContent.match(
            /<!-- SUGGESTIONS:(\[[\s\S]*?\]) -->/
          );
          if (suggestionsMatch) {
            try {
              const parsed = JSON.parse(suggestionsMatch[1]);
              if (Array.isArray(parsed)) setSuggestions(parsed);
            } catch { /* parse failed */ }
          }

          // Extract stage
          const stageMatch = assistantContent.match(/<!-- STAGE:(\d+) -->/);
          if (stageMatch) {
            setCurrentStage(parseInt(stageMatch[1], 10));
          }

          // Extract session complete
          if (assistantContent.includes("<!-- SESSION_COMPLETE:true -->")) {
            setSessionComplete(true);
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

  // Send pending message once session is ready
  useEffect(() => {
    if (sessionId && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      sendMessage(msg);
    }
  }, [sessionId, sendMessage]);

  const handleQuickPrompt = useCallback(
    (text: string) => {
      if (sessionId) {
        sendMessage(text);
      } else {
        pendingMessageRef.current = text;
        setInput(text);
      }
    },
    [sessionId, sendMessage]
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
            onQuickPrompt={handleQuickPrompt}
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
        {sessionError ? (
          <div className="chat-error-container">
            <p className="chat-error-text">
              상담 연결에 문제가 생겼어요.
            </p>
            <button
              type="button"
              onClick={() => void initSession()}
              disabled={sessionLoading}
              className="chat-retry-btn"
            >
              {sessionLoading ? "연결 중..." : "다시 시도하기"}
            </button>
          </div>
        ) : (
          <div className="chat-footer-inner">
            {/* Suggestion toggle + buttons above input */}
            {!isLoading && suggestions.length > 0 && (
              <div className="chat-suggestions-wrapper">
                <button
                  type="button"
                  className="chat-suggestions-toggle"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                >
                  {showSuggestions ? "답변 예시 숨기기 ▲" : "답변 예시 보기 ▼"}
                </button>
                {showSuggestions && (
                  <div className="chat-suggestions">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSuggestions([]);
                          setShowSuggestions(false);
                          sendMessage(s);
                        }}
                        className="chat-quick-prompt"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={sessionLoading ? "상담사와 연결 중..." : "편하게 이야기해 주세요..."}
                rows={1}
                className="chat-input"
                disabled={isLoading || sessionLoading || !sessionId}
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

            <p className="chat-freeform-hint">
              하고 싶은 말을 구체적으로, 편안하게 자유롭게 해주세요
            </p>

            {/* Save/End session below input */}
            {messages.length > 0 && (
              <div className="chat-session-actions">
                <button
                  onClick={async () => {
                    if (window.confirm("상담 내용을 저장하고 나중에 이어하시겠어요?")) {
                      router.push("/dashboard");
                    }
                  }}
                  className="chat-save-link"
                >
                  상담 저장하기
                </button>
                {canEndSession ? (
                  <button
                    onClick={async () => {
                      if (window.confirm("이번 상담을 종료하시겠어요? 상담 결과가 생성됩니다.")) {
                        try {
                          await fetch(`/api/sessions`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, status: "completed" }),
                          });
                        } catch { /* ignore */ }
                        router.push("/dashboard");
                      }
                    }}
                    className="chat-end-link"
                  >
                    상담 종료하기
                  </button>
                ) : (
                  <span className="chat-hint">
                    10회 이상 대화 후 상담 종료가 가능해요
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
