import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsProvider";
import '@/i18n';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import SpotDetails from './pages/SpotDetails';

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <GoogleMapsProvider>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter
                        future={{
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }}
                    >
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/admin/spot/:id" element={<SpotDetails />} />
                            {/* Ola ta custom routes Pano apo edo*/}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </TooltipProvider>
            </GoogleMapsProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;