import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, TrendingUp, Users, ShoppingBag } from "lucide-react";
import { useGetAdminStats } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats } = useGetAdminStats({ query: { retry: false } });

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Ghana's Trusted Digital Marketplace
          </h1>
          <p className="text-xl md:text-2xl mb-10 opacity-90 font-light">
            Connect with top freelancers, hire for your next project, or buy and sell digital goods in one secure platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-8 shadow-lg shadow-black/10">
              Find Work
            </Link>
            <Link href="/freelancers" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors bg-white text-primary hover:bg-white/90 h-12 px-8 shadow-lg shadow-black/10">
              Hire Talent
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-background shadow-sm border">
              <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trusted & Verified</h3>
              <p className="text-muted-foreground">Every user is reviewed and rated. Work with confidence knowing reputation is our currency.</p>
            </div>
            <div className="p-8 rounded-2xl bg-background shadow-sm border">
              <div className="w-16 h-16 mx-auto bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Top Ghanaian Talent</h3>
              <p className="text-muted-foreground">Access a diverse pool of skilled professionals ready to bring your ideas to life.</p>
            </div>
            <div className="p-8 rounded-2xl bg-background shadow-sm border">
              <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Digital Marketplace</h3>
              <p className="text-muted-foreground">Buy and sell digital assets, templates, and ready-made solutions seamlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="py-16 border-t bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-primary-foreground/20">
              <div>
                <div className="text-4xl font-bold mb-2">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-primary-foreground/80 font-medium">Registered Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">{stats.activeJobs?.toLocaleString() || stats.totalJobs.toLocaleString()}</div>
                <div className="text-primary-foreground/80 font-medium">Active Jobs</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">{stats.totalProducts.toLocaleString()}</div>
                <div className="text-primary-foreground/80 font-medium">Products</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">{stats.usersByRole.freelancers?.toLocaleString() || 0}</div>
                <div className="text-primary-foreground/80 font-medium">Freelancers</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
