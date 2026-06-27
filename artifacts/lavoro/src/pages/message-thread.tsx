import { Layout } from "@/components/layout";
import { useListMessages, useSendMessage, useListConversations, getListMessagesQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function MessageThread() {
  const { conversationId } = useParams();
  const id = parseInt(conversationId || "0", 10);
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Poll for messages
  const { data: messages, isLoading } = useListMessages(id, {
    query: {
      enabled: !!id,
      refetchInterval: 3000,
    }
  });

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(id) });
      }
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage.mutate({ id, data: { content } });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl h-[calc(100vh-8rem)] flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Conversation</h1>
        
        <div className="flex-1 bg-background border rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-10">Loading messages...</p>
            ) : messages?.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No messages yet. Say hello!</p>
            ) : (
              messages?.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t bg-muted/20">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-background"
              />
              <Button type="submit" disabled={sendMessage.isPending || !content.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
