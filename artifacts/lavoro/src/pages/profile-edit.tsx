import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  useUpsertFreelancerProfile, 
  useGetMyFreelancerProfile,
  useUpsertClientProfile,
  useGetMyClientProfile
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const freelancerSchema = z.object({
  bio: z.string().optional(),
  location: z.string().min(2, "Location is required"),
  skills: z.string().min(2, "At least one skill is required"),
  hourlyRate: z.coerce.number().optional(),
  experience: z.string().optional(),
});

const clientSchema = z.object({
  businessName: z.string().optional(),
  description: z.string().optional(),
  location: z.string().min(2, "Location is required"),
});

export default function ProfileEdit() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: freelancerProfile, isLoading: profileLoading } = useGetMyFreelancerProfile({
    query: {
      enabled: user?.role === 'freelancer',
      retry: false
    }
  });

  const { data: clientProfile, isLoading: clientLoading } = useGetMyClientProfile({
    query: {
      enabled: user?.role === 'client',
      retry: false
    }
  });

  const upsertFreelancer = useUpsertFreelancerProfile({
    mutation: {
      onSuccess: () => toast({ title: "Profile updated successfully." }),
      onError: (err) => toast({ variant: "destructive", title: "Update failed", description: err.error })
    }
  });

  const upsertClient = useUpsertClientProfile({
    mutation: {
      onSuccess: () => toast({ title: "Profile updated successfully." }),
      onError: (err) => toast({ variant: "destructive", title: "Update failed", description: err.error })
    }
  });

  const freelancerForm = useForm<z.infer<typeof freelancerSchema>>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: { bio: "", location: "", skills: "", hourlyRate: 0, experience: "" },
  });

  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { businessName: "", description: "", location: "" },
  });

  useEffect(() => {
    if (freelancerProfile) {
      freelancerForm.reset({
        bio: freelancerProfile.bio || "",
        location: freelancerProfile.location || "",
        skills: freelancerProfile.skills?.join(", ") || "",
        hourlyRate: freelancerProfile.hourlyRate || 0,
        experience: freelancerProfile.experience || "",
      });
    }
  }, [freelancerProfile, freelancerForm]);

  useEffect(() => {
    if (clientProfile) {
      clientForm.reset({
        businessName: clientProfile.businessName || "",
        description: clientProfile.description || "",
        location: clientProfile.location || "",
      });
    }
  }, [clientProfile, clientForm]);

  function onSubmitFreelancer(values: z.infer<typeof freelancerSchema>) {
    upsertFreelancer.mutate({
      data: {
        ...values,
        skills: values.skills.split(",").map(s => s.trim()).filter(Boolean),
        hourlyRate: values.hourlyRate || undefined,
      }
    });
  }

  function onSubmitClient(values: z.infer<typeof clientSchema>) {
    upsertClient.mutate({ data: values });
  }

  if (authLoading || profileLoading || clientLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        
        {user.role === 'freelancer' && (
          <Card>
            <CardHeader>
              <CardTitle>Freelancer Details</CardTitle>
              <CardDescription>Complete your profile to attract clients.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...freelancerForm}>
                <form onSubmit={freelancerForm.handleSubmit(onSubmitFreelancer)} className="space-y-6">
                  <FormField control={freelancerForm.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Accra, Ghana" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={freelancerForm.control} name="bio" render={({ field }) => (
                    <FormItem><FormLabel>Professional Bio</FormLabel><FormControl><Textarea placeholder="Tell clients about yourself..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={freelancerForm.control} name="skills" render={({ field }) => (
                    <FormItem><FormLabel>Skills (comma separated)</FormLabel><FormControl><Input placeholder="React, Node.js, Graphic Design" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={freelancerForm.control} name="hourlyRate" render={({ field }) => (
                    <FormItem><FormLabel>Hourly Rate (₵)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={upsertFreelancer.isPending}>
                    {upsertFreelancer.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {user.role === 'client' && (
           <Card>
             <CardHeader>
               <CardTitle>Client Details</CardTitle>
               <CardDescription>Tell freelancers about your business.</CardDescription>
             </CardHeader>
             <CardContent>
               <Form {...clientForm}>
                 <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-6">
                   <FormField control={clientForm.control} name="businessName" render={({ field }) => (
                     <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company Ltd" {...field} /></FormControl><FormMessage /></FormItem>
                   )} />
                   <FormField control={clientForm.control} name="location" render={({ field }) => (
                     <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Accra, Ghana" {...field} /></FormControl><FormMessage /></FormItem>
                   )} />
                   <FormField control={clientForm.control} name="description" render={({ field }) => (
                     <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="About your business..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
                   )} />
                   <Button type="submit" disabled={upsertClient.isPending}>
                     {upsertClient.isPending ? "Saving..." : "Save Profile"}
                   </Button>
                 </form>
               </Form>
             </CardContent>
           </Card>
        )}

        {user.role === 'seller' && (
           <Card>
             <CardHeader>
               <CardTitle>Seller Profile</CardTitle>
               <CardDescription>Sellers manage their items in the products page. Update basic info below.</CardDescription>
             </CardHeader>
             <CardContent>
               <p className="text-muted-foreground">You can manage your name and email in your account settings. Start listing products in the marketplace!</p>
             </CardContent>
           </Card>
        )}
      </div>
    </Layout>
  );
}
