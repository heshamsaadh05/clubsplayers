import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import DynamicThemeProvider from "@/components/DynamicThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlayers from "./pages/admin/AdminPlayers";
import AdminClubs from "./pages/admin/AdminClubs";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPages from "./pages/admin/AdminPages";
import AdminLanguages from "./pages/admin/AdminLanguages";
import AdminMenus from "./pages/admin/AdminMenus";
import AdminDesign from "./pages/admin/AdminDesign";
import AdminFooter from "./pages/admin/AdminFooter";
import AdminSections from "./pages/admin/AdminSections";
import PlayerRegistration from "./pages/PlayerRegistration";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClubRegistration from "./pages/ClubRegistration";
import ClubDashboard from "./pages/ClubDashboard";
import BrowsePlayers from "./pages/BrowsePlayers";
import PlayerProfile from "./pages/PlayerProfile";
import Subscription from "./pages/Subscription";
import PlansComparison from "./pages/PlansComparison";
import Messages from "./pages/Messages";
import AccountSettings from "./pages/AccountSettings";
import PageView from "./pages/PageView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <DynamicThemeProvider>
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
                <Route path="/browse-players" element={<BrowsePlayers />} />
                <Route path="/player/:id" element={<PlayerProfile />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/plans" element={<PlansComparison />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/account-settings" element={<AccountSettings />} />
                <Route path="/page/:slug" element={<PageView />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/players" element={<AdminPlayers />} />
                <Route path="/admin/clubs" element={<AdminClubs />} />
                <Route path="/admin/plans" element={<AdminPlans />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/languages" element={<AdminLanguages />} />
                <Route path="/admin/menus" element={<AdminMenus />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/design" element={<AdminDesign />} />
                <Route path="/admin/footer" element={<AdminFooter />} />
                <Route path="/admin/sections" element={<AdminSections />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DynamicThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
