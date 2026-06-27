import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Briefcase, User as UserIcon, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/freelancers", label: "Freelancers" },
    { href: "/jobs", label: "Jobs" },
    { href: "/products", label: "Marketplace" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                L
              </div>
              Lavoro
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith(link.href) ? "text-primary" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <div className="w-px h-6 bg-border mx-2" />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{user.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => logout()}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary">
                  Log in
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Join Lavoro
                </Link>
              </>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href}
                className="text-base font-medium px-2 py-2 hover:bg-muted rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-base font-medium px-2 py-2 hover:bg-muted rounded-md flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <Button variant="ghost" className="justify-start px-2" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Join Lavoro
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="border-t py-12 bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl text-primary mb-4">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                L
              </div>
              Lavoro
            </div>
            <p className="text-sm text-muted-foreground">
              Ghana's first trusted digital marketplace connecting top talent with great opportunities.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Clients</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/freelancers" className="hover:text-primary">Find Freelancers</Link></li>
              <li><Link href="/jobs/new" className="hover:text-primary">Post a Job</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Freelancers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-primary">Find Work</Link></li>
              <li><Link href="/register" className="hover:text-primary">Create Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary">Browse Products</Link></li>
              <li><Link href="/products/new" className="hover:text-primary">Start Selling</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} Lavoro Ghana. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
