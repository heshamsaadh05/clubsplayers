import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlayers from "./pages/admin/AdminPlayers";
import AdminClubs from "./pages/admin/AdminClubs";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import PlayerRegistration from "./pages/PlayerRegistration";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClubRegistration from "./pages/ClubRegistration";
import ClubDashboard from "./pages/ClubDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/player-registration" element={<PlayerRegistration />} />
            <Route path="/player-dashboard" element={<PlayerDashboard />} />
            <Route path="/club-registration" element={<ClubRegistration />} />
            <Route path="/club-dashboard" element={<ClubDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/players" element={<AdminPlayers />} />
            <Route path="/admin/clubs" element={<AdminClubs />} />
            <Route path="/admin/plans" element={<AdminPlans />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
