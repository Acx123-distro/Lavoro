import { Layout } from "@/components/layout";
import { useGetJob, useListJobApplications, useApplyToJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Briefcase, Building } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const applySchema = z.object({
  bidAmount: z.coerce.number().positive("Bid amount must be positive"),
  proposal: z.string().min(20, "Proposal must be at least 20 characters"),
});

export default function JobDetail() {
  const { id: jobIdParam } = useParams();
  const id = parseInt(jobIdParam || "0", 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { data: job, isLoading } = useGetJob(id, {
    query: {
      enabled: !!id,
    }
  });

  const { data: applicationsData } = useListJobApplications(id, {
    query: {
      enabled: !!id && user?.id === job?.clientId,
    }
  });

  const applyMutation = useApplyToJob({
    mutation: {
      onSuccess: () => {
        setIsApplyOpen(false);
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        toast({
          title: "Application Submitted",
          description: "Your proposal has been sent to the client.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to submit application.",
        });
      }
    }
  });

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      bidAmount: job?.budget || 0,
      proposal: "",
    },
  });

  function onSubmit(values: z.infer<typeof applySchema>) {
    applyMutation.mutate({ jobId: id, data: values });
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground">The job post you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-border/50 pt-12 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="bg-background">{job.category}</Badge>
                {job.status === 'open' ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Open</Badge>
                ) : (
                  <Badge variant="outline">{job.status.replace('_', ' ')}</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  {job.client?.name || "Client"}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Due: {new Date(job.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  {job.applicationCount} Proposals
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-auto p-6 bg-background rounded-xl shadow-sm border md:min-w-[280px]">
              <div>
                <div className="text-sm text-muted-foreground font-medium mb-1">Fixed Budget</div>
                <div className="text-3xl font-bold text-foreground">₵{job.budget.toLocaleString()}</div>
              </div>
              
              {user?.id !== job.clientId && user?.role !== 'client' && (
                <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full mt-2" disabled={job.status !== 'open'}>
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Proposal</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="bidAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Bid (₵)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="proposal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cover Letter</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Why are you the best fit for this job?" 
                                  className="min-h-[150px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                          {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </CardContent>
            </Card>

            {user?.id === job.clientId && applicationsData && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Applications ({applicationsData.length})</h3>
                {applicationsData.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No applications yet.
                    </CardContent>
                  </Card>
                ) : (
                  applicationsData.map(app => (
                    <Card key={app.id}>
                      <CardHeader className="flex-row items-center justify-between pb-2">
                        <div>
                          <CardTitle className="text-lg">{app.freelancer?.name}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            Applied {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-lg font-bold">
                          ₵{app.bidAmount?.toLocaleString()}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{app.proposal}</p>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pt-4 flex gap-2">
                        <Button variant="outline" size="sm">View Profile</Button>
                        <Button size="sm">Message</Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
