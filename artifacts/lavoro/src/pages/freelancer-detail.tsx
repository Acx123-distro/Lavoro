import { Layout } from "@/components/layout";
import { useGetFreelancerProfile, useStartConversation, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, ShieldCheck, AlertTriangle, MessageSquare, Clock, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function FreelancerDetail() {
  const { userId } = useParams();
  const id = parseInt(userId || "0", 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetFreelancerProfile(id, {
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
    startConversation.mutate({
      data: {
        recipientId: id,
        initialMessage: "Hi, I'm interested in working with you."
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Freelancer Not Found</h2>
          <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-primary/5 border-b border-border/50 pt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="w-24 h-24 border-4 border-background ring-4 ring-primary/10">
              <AvatarImage src={profile.user.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                {profile.user.name}
                {profile.trustLabel && profile.trustLabel.includes("Low") ? (
                   <Badge variant="destructive" className="bg-destructive/10 text-destructive border-none">
                     <AlertTriangle className="w-3 h-3 mr-1" />
                     {profile.trustLabel}
                   </Badge>
                ) : profile.trustLabel ? (
                   <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                     <ShieldCheck className="w-3 h-3 mr-1" />
                     {profile.trustLabel}
                   </Badge>
                ) : null}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profile.location}
                </div>
                {profile.user.averageRating ? (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-secondary text-secondary" />
                    <span className="font-medium text-foreground">{profile.user.averageRating}</span>
                    <span className="ml-1">({profile.user.reviewCount} reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-muted-foreground" />
                    No reviews yet
                  </div>
                )}
                <div className="flex items-center text-foreground font-medium">
                  <Briefcase className="w-4 h-4 mr-1 text-muted-foreground" />
                  {profile.completedJobs || 0} jobs completed
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className="text-2xl font-bold text-foreground md:text-right">
                {profile.hourlyRate ? `₵${profile.hourlyRate}/hr` : 'Negotiable'}
              </div>
              <Button 
                size="lg" 
                className="w-full md:w-auto gap-2"
                onClick={handleContact}
                disabled={startConversation.isPending || user?.id === profile.userId}
              >
                <MessageSquare className="w-4 h-4" />
                Contact {profile.user.name.split(' ')[0]}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none text-muted-foreground">
                <p className="whitespace-pre-wrap">{profile.bio || "No biography provided."}</p>
              </CardContent>
            </Card>

            {profile.portfolioItems && profile.portfolioItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.portfolioItems.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden group">
                        {item.imageUrl ? (
                          <div className="aspect-video bg-muted overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-muted-foreground opacity-50" />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                          {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>}
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                              View Project
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.experience && (
              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{profile.experience}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.length > 0 ? (
                    profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-accent text-accent-foreground font-medium">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No skills listed.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Response Time</div>
                    <div className="text-sm text-muted-foreground">Usually within 24 hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Project Rate</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.projectRate ? `Starting at ₵${profile.projectRate}` : 'Contact for quotes'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
