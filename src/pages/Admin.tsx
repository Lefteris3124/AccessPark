import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2, MapPin, AlertTriangle, Trash2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';
import { usePendingSpots, useParkingSpots, useApproveSpot, useRejectSpot, useDeleteSpot } from '@/hooks/useParkingSpots';
import { ParkingSpot } from '@/types/parking';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

export default function Admin() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAdmin, loading: authLoading } = useAuth();

    // Hooks for data
    const { data: pendingSpots = [], isLoading: isPendingLoading } = usePendingSpots();
    const { data: activeSpots = [], isLoading: isActiveLoading } = useParkingSpots();

    const approveSpot = useApproveSpot();
    const rejectSpot = useRejectSpot();
    const deleteSpot = useDeleteSpot();

    // Check auth status
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">{t('noPermission')}</h1>
                <Button onClick={() => navigate('/')} className="mt-4">
                    {t('home')}
                </Button>
            </div>
        );
    }

    const handleApprove = async (spotId: string) => {
        try {
            await approveSpot.mutateAsync(spotId);
            toast.success(t('approved'));
        } catch (error) {
            toast.error(t('error'));
        }
    };

    const handleReject = async (spotId: string) => {
        try {
            await rejectSpot.mutateAsync(spotId);
            toast.success(t('rejected'));
        } catch (error) {
            toast.error(t('error'));
        }
    };

    const handleDelete = async (spotId: string) => {
        try {
            await deleteSpot.mutateAsync(spotId);
            toast.success('Spot deleted successfully');
        } catch (error) {
            toast.error('Failed to delete spot');
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border z-10">
                <div className="flex items-center gap-4 p-4">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="h-10 w-10 rounded-xl"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">{t('admin')}</h1>
                    </div>
                </div>
            </header>

            <main className="p-4">

                <Tabs defaultValue="active" className="w-full space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active Spots</TabsTrigger>
                        <TabsTrigger value="pending" className="relative">
                            {t('pending')}
                            {pendingSpots.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
                                    {pendingSpots.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>


                    {/* ACTIVE TAB CONTENT */}
                    <TabsContent value="active" className="space-y-4">
                        {isActiveLoading ? (
                            <LoadingSpinner />
                        ) : activeSpots.length === 0 ? (
                            <EmptyState message="No active spots found" />
                        ) : (
                            // CHANGED: Added Grid Wrapper here
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeSpots.map((spot) => (
                                    <ActiveSpotCard
                                        key={spot.id}
                                        spot={spot}
                                        onDelete={() => handleDelete(spot.id)}
                                        isDeleting={deleteSpot.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* PENDING TAB CONTENT */}
                    <TabsContent value="pending" className="space-y-4">
                        {isPendingLoading ? (
                            <LoadingSpinner />
                        ) : pendingSpots.length === 0 ? (
                            <EmptyState message="No pending spots to review" />
                        ) : (
                            pendingSpots.map((spot) => (
                                <PendingSpotCard
                                    key={spot.id}
                                    spot={spot}
                                    onApprove={() => handleApprove(spot.id)}
                                    onReject={() => handleReject(spot.id)}
                                    isApproving={approveSpot.isPending}
                                    isRejecting={rejectSpot.isPending}
                                />
                            ))
                        )}
                    </TabsContent>

                </Tabs>
            </main>
        </div>
    );
}

// --- Helper Components ---

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <MapPin className="h-16 w-16 opacity-20 mb-4" />
            <p>{message}</p>
        </div>
    );
}

// 1. Pending Spot Card (With Approve/Reject)
interface PendingSpotCardProps {
    spot: ParkingSpot;
    onApprove: () => void;
    onReject: () => void;
    isApproving: boolean;
    isRejecting: boolean;
}

function PendingSpotCard({ spot, onApprove, onReject, isApproving, isRejecting }: PendingSpotCardProps) {
    const { t } = useTranslation();

    return (
        <SpotBase spot={spot}>
            <div className="flex gap-3 pt-2">
                <Button
                    onClick={onApprove}
                    disabled={isApproving || isRejecting}
                    className="flex-1 h-11 gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t('approve')}
                </Button>
                <Button
                    variant="destructive"
                    onClick={onReject}
                    disabled={isApproving || isRejecting}
                    className="flex-1 h-11 gap-2"
                >
                    {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    {t('reject')}
                </Button>
            </div>
        </SpotBase>
    );
}

// 2. Active Spot Card (With Delete only)
interface ActiveSpotCardProps {
    spot: ParkingSpot;
    onDelete: () => void;
    isDeleting: boolean;
}

function ActiveSpotCard({ spot, onDelete, isDeleting }: ActiveSpotCardProps) {
    return (
        <SpotBase spot={spot}>
            <div className="pt-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Spot
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this parking spot from the map. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </SpotBase>
    );
}

// 3. Base Card UI (Shared Design)
function SpotBase({ spot, children }: { spot: ParkingSpot; children: React.ReactNode }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Photo / Map Placeholder */}
            <div className="h-48 bg-muted relative">
                {spot.photo_url ? (
                    <img
                        src={spot.photo_url}
                        alt="Parking spot"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-muted/50">
                        <MapPin className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-mono">
                    ID: {spot.id.slice(0, 8)}
                </div>

                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-20 right-2 h-8 w-8 rounded-lg shadow-sm opacity-90 hover:opacity-100 bg-background"
                    onClick={() => navigate(`/admin/spot/${spot.id}`)}
                    title="View Details"
                >
                    <Eye className="h-4 w-4" />
                </Button>

            </div>

            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg leading-none mb-1">{spot.city || 'Unknown Location'}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                            {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
                        </p>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {spot.surface_type && <Badge variant="outline" className="text-xs">{t(spot.surface_type)}</Badge>}
                    {spot.is_free && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Free</Badge>}
                    {spot.has_ramp_access && <Badge variant="secondary" className="text-xs">Ramp</Badge>}
                </div>

                {spot.notes && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                        {spot.notes}
                    </div>
                )}

                {/* Action Buttons Area */}
                {children}
            </div>
        </div>
    );
}