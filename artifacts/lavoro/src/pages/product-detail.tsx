import { Layout } from "@/components/layout";
import { useGetProduct, useStartConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ShoppingBag, Store, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetail() {
  const { id: productIdParam } = useParams();
  const id = parseInt(productIdParam || "0", 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, {
    query: {
      enabled: !!id,
    }
  });

  const startConversation = useStartConversation({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setLocation(`/messages/${data.id}`);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to start conversation.",
        });
      }
    }
  });

  const handleContact = () => {
    if (!user) {
      setLocation("/login");
      return;
    }
    if (!product) return;
    startConversation.mutate({
      data: {
        recipientId: product.sellerId,
        initialMessage: `Hi, I'm interested in your product: ${product.name}`
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[400px] rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-muted rounded-2xl overflow-hidden border aspect-square lg:aspect-[4/3] flex items-center justify-center relative">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag className="w-24 h-24 text-muted-foreground opacity-30" />
            )}
            {product.negotiable && (
              <Badge className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur-sm border-none text-sm py-1 px-3">
                Price Negotiable
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-accent/50">{product.category}</Badge>
              {product.status !== 'available' && (
                <Badge variant="destructive">{product.status.replace('_', ' ')}</Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="text-4xl font-bold text-primary mb-6">
              ₵{product.price.toLocaleString()}
            </div>

            <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap mb-8 flex-1">
              {product.description}
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-y mb-8">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Available Quantity</div>
                <div className="font-semibold text-lg">{product.quantity}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                <div className="font-semibold text-lg flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                  {product.location}
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-xl border flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sold by</div>
                  <div className="font-bold text-foreground">{product.seller?.name}</div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full text-lg h-14 gap-2"
              onClick={handleContact}
              disabled={startConversation.isPending || user?.id === product.sellerId || product.status !== 'available'}
            >
              <MessageSquare className="w-5 h-5" />
              Contact Seller to Buy
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
