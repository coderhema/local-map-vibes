import { useChat } from "@ai-sdk/react";
import { ChatCircleDots, Compass, X } from "@phosphor-icons/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "backyard-location-chat";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function LocationAssistant() {
  const [open, setOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: "backyard-location-guide",
    messages: [],
    transport,
    onError: (chatError) => toast.error("Yard Guide couldn’t respond", { description: chatError.message }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    setMessages(loadMessages());
    setStorageReady(true);
  }, [setMessages]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, storageReady]);

  useEffect(() => {
    if (open && !busy) textareaRef.current?.focus();
  }, [open, busy]);

  return (
    <>
      <Button className="absolute right-4 top-[13rem] z-30 size-11 rounded-full bg-background/95 shadow-sm backdrop-blur-xl md:right-6 md:top-[9.8rem]" variant="secondary" size="icon" onClick={() => setOpen(true)} aria-label="Open Yard Guide">
        <ChatCircleDots className="size-5" weight="duotone" />
      </Button>

      {open && (
        <section className="absolute bottom-4 right-4 top-[5.2rem] z-50 flex w-[calc(100%-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm backdrop-blur-xl md:bottom-6 md:right-6" aria-label="Yard Guide location assistant">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground"><Compass className="size-4" weight="fill" /></span><div><p className="font-display text-lg leading-none">Yard Guide</p><p className="mt-1 text-[10px] text-muted-foreground">AI location assistant</p></div></div>
            <div className="flex items-center gap-1">{messages.length > 0 && <Button variant="ghost" size="sm" onClick={() => setMessages([])}>Clear</Button>}<Button variant="ghost" size="icon-sm" aria-label="Close Yard Guide" onClick={() => setOpen(false)}><X className="size-4" /></Button></div>
          </div>

          <Conversation className="min-h-0">
            <ConversationContent className="gap-5 px-4 py-5">
              {messages.length === 0 ? (
                <ConversationEmptyState icon={<Compass className="size-7" weight="duotone" />} title="Where do you want to go?" description="Ask for a neighborhood, city, event area, or job hub." />
              ) : messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={`${message.id}-${index}`}>{part.text}</MessageResponse> : null)}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && <Shimmer className="text-sm">Looking around...</Shimmer>}
              {error && <p className="text-sm text-destructive">{error.message}</p>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 border-t border-border bg-background/80 p-3">
            <PromptInput onSubmit={async ({ text }) => { const value = text.trim(); if (!value || busy) return; await sendMessage({ text: value }); }}>
              <PromptInputTextarea ref={textareaRef} placeholder="Find me a creative neighborhood in Lagos…" className="min-h-20" />
              <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} onStop={stop} /></PromptInputFooter>
            </PromptInput>
          </div>
        </section>
      )}
    </>
  );
}