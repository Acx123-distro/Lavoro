import { Layout } from "@/components/layout";
import { useListConversations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useListConversations();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>
        
        <div className="space-y-4">
          {isLoading ? (
            <p>Loading conversations...</p>
          ) : conversations?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                You have no active conversations.
              </CardContent>
            </Card>
          ) : (
            conversations?.map((conv) => {
              const otherUser = conv.participants.find(p => p.id !== user?.id) || conv.participants[0];
              
              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer mb-2">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {otherUser?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">{otherUser?.name}</h3>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                          {conv.unreadCount}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
