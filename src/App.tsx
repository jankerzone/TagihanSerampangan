import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@clerk/clerk-react";
import { ApiProvider } from "@/components/ApiProvider";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Settings from "./pages/Settings";
import SavingsGoals from "./pages/SavingsGoals";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useAuth();

  // Wait for Clerk to load before making redirect decisions
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="tagihan-theme">
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <ApiProvider>
            <Routes>
              {/* Auth routes */}
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />
              {/* Protected routes */}
              <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
              <Route path="/savings-goals" element={<PrivateRoute><SavingsGoals /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ApiProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
