import { Layout } from "@/components/layout";
import { useListFreelancers } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Star, MapPin, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Freelancers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListFreelancers({
    query: {
      queryKey: ["freelancers", search],
    }
  });

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Hire Top Talent</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl font-light">
            Discover verified professionals ready to bring your ideas to life.
          </p>
          <div className="max-w-xl">
            <Input 
              type="search" 
              placeholder="Search by skill or keyword..." 
              className="h-12 text-base bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="gap-4 flex-row items-center">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.freelancers.map((freelancer) => (
              <Card key={freelancer.id} className="hover-elevate overflow-hidden border-border/50 flex flex-col group">
                <CardHeader className="flex-row gap-4 items-start pb-4">
                  <Avatar className="w-16 h-16 border-2 border-background ring-2 ring-primary/10">
                    <AvatarImage src={freelancer.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {freelancer.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {freelancer.user.name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span className="truncate">{freelancer.location}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {freelancer.trustLabel && freelancer.trustLabel.includes("Low") ? (
                       <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
                         <AlertTriangle className="w-3 h-3 mr-1" />
                         {freelancer.trustLabel}
                       </Badge>
                    ) : freelancer.trustLabel ? (
                       <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                         <ShieldCheck className="w-3 h-3 mr-1" />
                         {freelancer.trustLabel}
                       </Badge>
                    ) : null}
                    
                    {freelancer.user.averageRating ? (
                      <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary/30">
                        <Star className="w-3 h-3 mr-1 fill-current text-secondary" />
                        {freelancer.user.averageRating} ({freelancer.user.reviewCount})
                      </Badge>
                    ) : null}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {freelancer.bio || "No bio provided."}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {freelancer.skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="outline" className="font-normal text-xs bg-accent/50">
                        {skill}
                      </Badge>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <Badge variant="outline" className="font-normal text-xs bg-accent/50">
                        +{freelancer.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 pb-4 border-t bg-muted/20 flex items-center justify-between">
                  <div className="font-semibold text-foreground">
                    {freelancer.hourlyRate ? `₵${freelancer.hourlyRate}/hr` : 'Negotiable'}
                  </div>
                  <Link href={`/freelancers/${freelancer.userId}`} className="text-sm font-medium text-primary hover:underline">
                    View Profile
                  </Link>
                </CardFooter>
              </Card>
            ))}
            
            {data?.freelancers.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No freelancers found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { User as UserIcon } from "lucide-react";
