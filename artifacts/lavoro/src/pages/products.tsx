import { Layout } from "@/components/layout";
import { useListProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MapPin, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListProducts({
    query: {
      queryKey: ["products", search],
    }
  });

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Digital Marketplace</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl font-light">
            Buy and sell templates, assets, and tools from top creators.
          </p>
          <div className="max-w-xl flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search products..." 
                className="h-12 pl-10 text-base bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="h-12 px-6">Search</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="block group">
                <Card className="hover-elevate overflow-hidden border-border/50 h-full flex flex-col">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-accent/50 text-muted-foreground">
                        <ShoppingBag className="w-12 h-12 opacity-50" />
                      </div>
                    )}
                    {product.negotiable && (
                      <Badge className="absolute top-2 right-2 bg-background/90 text-foreground backdrop-blur-sm border-none hover:bg-background/90">
                        Negotiable
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <Badge variant="outline" className="w-fit mb-2 text-xs bg-muted/50">{product.category}</Badge>
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="font-bold text-lg text-primary">
                        ₵{product.price.toLocaleString()}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[100px]">{product.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {data?.products.length === 0 && (
              <div className="col-span-full py-20 text-center border rounded-xl bg-muted/20">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
