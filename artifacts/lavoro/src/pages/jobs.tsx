import { Layout } from "@/components/layout";
import { useListJobs } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MapPin, Briefcase, Clock, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListJobs({
    query: {
      queryKey: ["jobs", search],
    }
  });

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">Find Opportunities</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl font-light">
            Browse the latest projects and long-term roles from trusted clients.
          </p>
          <div className="max-w-xl flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search jobs by title or category..." 
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
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.jobs.map((job) => (
              <Card key={job.id} className="hover-elevate overflow-hidden border-border/50 group transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-xl text-foreground hover:text-primary transition-colors truncate block">
                        {job.title}
                      </Link>
                      {job.status === 'open' ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 shrink-0">Open</Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0">{job.status.replace('_', ' ')}</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center text-foreground font-medium">
                        <Briefcase className="w-4 h-4 mr-1.5 text-muted-foreground" />
                        ₵{job.budget.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        Due {new Date(job.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-accent/50 font-normal">{job.category}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 md:text-right mt-4 md:mt-0 md:pl-6 md:border-l border-border">
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">{job.applicationCount}</span> proposals
                    </div>
                    <Link href={`/jobs/${job.id}`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full md:w-auto">
                      View Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {data?.jobs.length === 0 && (
              <div className="py-20 text-center border rounded-xl bg-muted/20">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
