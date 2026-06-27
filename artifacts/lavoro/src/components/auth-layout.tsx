import { Link } from "wouter";

export function AuthLayout({ children, title, description }: { children: React.ReactNode, title: string, description: string }) {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-sm">
                L
              </div>
              Lavoro
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative flex-1 bg-primary">
        <div className="absolute inset-0 flex items-center justify-center p-12 text-primary-foreground flex-col text-center">
          <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center mb-8 backdrop-blur-sm border border-white/20 shadow-2xl shadow-black/20">
            <div className="w-12 h-12 bg-secondary rounded-full" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Empowering Ghana's Workforce</h2>
          <p className="text-xl text-primary-foreground/80 max-w-lg font-light">
            Join thousands of freelancers, clients, and sellers building the future of work.
          </p>
        </div>
      </div>
    </div>
  );
}
