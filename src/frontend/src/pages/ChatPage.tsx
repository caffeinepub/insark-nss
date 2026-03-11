import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthSession } from "../App";
import type { ChatMessage } from "../backend.d";
import { useGetChatMessages, useSendMessage } from "../hooks/useQueries";

interface Props {
  session: AuthSession;
}

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const d = new Date(ms);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: string }) {
  const isCoordinator = role === "coordinator";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold tracking-wide uppercase"
      style={
        isCoordinator
          ? {
              background: "oklch(0.88 0.08 60 / 0.25)",
              color: "oklch(0.45 0.12 55)",
            }
          : {
              background: "oklch(0.32 0.09 152 / 0.12)",
              color: "oklch(0.32 0.09 152)",
            }
      }
    >
      {isCoordinator ? "Coordinator" : "Volunteer"}
    </span>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <div
      className={`flex gap-3 mb-4 ${isMine ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold flex-shrink-0 self-end"
        style={
          isMine
            ? {
                background: "oklch(0.32 0.09 152)",
                color: "white",
              }
            : message.senderRole === "coordinator"
              ? {
                  background: "oklch(0.78 0.14 85 / 0.25)",
                  color: "oklch(0.45 0.12 55)",
                }
              : {
                  background: "oklch(0.32 0.09 152 / 0.15)",
                  color: "oklch(0.32 0.09 152)",
                }
        }
      >
        {message.senderName.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col gap-1 max-w-[72%] ${isMine ? "items-end" : "items-start"}`}
      >
        {/* Sender info */}
        <div
          className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
        >
          <span className="text-xs font-display font-semibold text-foreground">
            {isMine ? "You" : message.senderName}
          </span>
          <RoleBadge role={message.senderRole} />
        </div>

        {/* Message text */}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed shadow-sm"
          style={
            isMine
              ? {
                  background: "oklch(0.32 0.09 152)",
                  color: "white",
                  borderBottomRightRadius: "6px",
                }
              : {
                  background: "oklch(0.97 0.008 140)",
                  color: "oklch(0.2 0.04 140)",
                  border: "1px solid oklch(0.88 0.03 140)",
                  borderBottomLeftRadius: "6px",
                }
          }
        >
          {message.message}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] font-body text-muted-foreground px-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

export default function ChatPage({ session }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useGetChatMessages();
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom when messages arrive
  const messagesCount = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new message count
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesCount]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await sendMessage.mutateAsync(text);
    } catch {
      toast.error("Failed to send message. Please try again.");
      setInput(text);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: "oklch(var(--border))" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.32 0.09 152 / 0.12)",
            }}
          >
            <MessageCircle
              className="w-5 h-5"
              style={{ color: "oklch(0.32 0.09 152)" }}
            />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Community Chat
            </h2>
            <p className="text-sm text-muted-foreground font-body">
              Open channel for volunteers and coordinators
            </p>
          </div>

          {/* Live indicator */}
          <div className="ml-auto flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "oklch(0.55 0.18 145)" }}
            />
            <span className="text-xs font-body text-muted-foreground">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div
            data-ocid="chat.loading_state"
            className="flex items-center justify-center h-full gap-3 text-muted-foreground"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body text-sm">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full gap-4"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.32 0.09 152 / 0.08)" }}
            >
              <MessageCircle
                className="w-8 h-8"
                style={{ color: "oklch(0.32 0.09 152 / 0.5)" }}
              />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-foreground text-lg">
                No messages yet
              </p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div
              ref={scrollRef}
              className="px-6 py-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={
                    msg.senderId === session.id ||
                    msg.senderName === session.name
                  }
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input area */}
      <div
        className="px-6 py-4 border-t flex-shrink-0"
        style={{
          borderColor: "oklch(var(--border))",
          background: "oklch(var(--background))",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all focus-within:shadow-md"
          style={{
            borderColor: "oklch(0.32 0.09 152 / 0.25)",
            background: "oklch(0.98 0.004 90)",
          }}
        >
          <input
            ref={inputRef}
            data-ocid="chat.input"
            type="text"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Button
            data-ocid="chat.submit_button"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="h-8 w-8 p-0 rounded-xl flex-shrink-0 transition-all"
            style={{
              background: input.trim()
                ? "oklch(0.32 0.09 152)"
                : "oklch(0.88 0.02 140)",
              color: input.trim() ? "white" : "oklch(0.65 0.04 140)",
            }}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] font-body text-muted-foreground text-center mt-2">
          Messages are visible to all volunteers and coordinators
        </p>
      </div>
    </div>
  );
}
