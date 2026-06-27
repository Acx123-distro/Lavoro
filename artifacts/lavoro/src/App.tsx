import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Freelancers from "@/pages/freelancers";
import FreelancerDetail from "@/pages/freelancer-detail";
import Jobs from "@/pages/jobs";
import JobNew from "@/pages/job-new";
import JobDetail from "@/pages/job-detail";
import Products from "@/pages/products";
import ProductNew from "@/pages/product-new";
import ProductDetail from "@/pages/product-detail";
import ProfileEdit from "@/pages/profile-edit";
import Messages from "@/pages/messages";
import MessageThread from "@/pages/message-thread";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/freelancers" component={Freelancers} />
      <Route path="/freelancers/:userId" component={FreelancerDetail} />
      <Route path="/jobs" component={Jobs} />
      <Route path="/jobs/new" component={JobNew} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/products" component={Products} />
      <Route path="/products/new" component={ProductNew} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:conversationId" component={MessageThread} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
