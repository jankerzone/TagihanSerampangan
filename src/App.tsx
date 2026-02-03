import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ApiProvider } from "@/components/ApiProvider";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import SavingsGoals from "./pages/SavingsGoals";
import Expenses from "./pages/Expenses";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="tagihan-theme">
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <ApiProvider>
            <Routes>
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />
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
