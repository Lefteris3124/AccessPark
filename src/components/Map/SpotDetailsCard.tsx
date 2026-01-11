import { useTranslation } from 'react-i18next';
import { X, Navigation, Sun, Accessibility, Car, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParkingSpot } from '@/types/parking';
import { useState } from 'react';

interface SpotDetailsCardProps {
    spot: ParkingSpot;
    onClose: () => void;
}

const surfaceIcons: Record<string, { icon: string; color: string }> = {
    asphalt: { icon: '🛣️', color: 'bg-green-500/20 text-green-700' },
    cobblestone: { icon: '🧱', color: 'bg-yellow-500/20 text-yellow-700' },
    gravel: { icon: '⚪', color: 'bg-orange-500/20 text-orange-700' },
    dirt: { icon: '🟤', color: 'bg-red-500/20 text-red-700' },
};

export default function SpotDetailsCard({ spot, onClose }: SpotDetailsCardProps) {
    const { t } = useTranslation();

    const handleNavigate = () => {
        const url = `http://maps.google.com/?q=${spot.latitude},${spot.longitude}`;
        window.open(url, '_blank');
    };

    const surfaceInfo = surfaceIcons[spot.surface_type] || surfaceIcons.asphalt;
    const needsWarning = ['cobblestone', 'gravel', 'dirt'].includes(spot.surface_type);
    const [isPhotoOpen, setIsPhotoOpen] = useState(false);

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-in slide-in-from-bottom duration-300">
            <div className="bg-card rounded-t-3xl shadow-2xl border-t border-border safe-area-inset relative max-h-[85vh] overflow-y-auto">

                {/* Close button */}
                <Button
                    size="icon"
                    variant="secondary"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm border border-border hover:bg-background"
                    aria-label={t('cancel')}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Handle bar */}
                <div className="flex justify-center py-3 sticky top-0 bg-card z-10">
                    <div className="w-12 h-1.5 bg-muted rounded-full" />
                </div>

                <div className="px-6 pb-8 space-y-4">
                    {/* Photo  */}
                    {/* Photo preview */}
                    {spot.photo_url ? (
                        <button
                            onClick={() => setIsPhotoOpen(true)}
                            className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden bg-muted shadow-sm focus:outline-none"
                        >
                            <img
                                src={spot.photo_url}
                                alt={t('accessibleParking')}
                                className="w-full h-full object-cover"
                            />

                            {/* Tap hint */}
                            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition flex items-center justify-center">
      <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
        Tap to enlarge
      </span>
                            </div>
                        </button>
                    ) : (
                        <div className="h-32 sm:h-40 rounded-xl bg-muted flex items-center justify-center">
                            <Accessibility className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                    )}

                    {/* Address */}
                    <div>
                        <h2 className="text-xl font-bold text-foreground pr-10">
                            {spot.address || t('accessibleParking')}
                        </h2>
                        <p className="text-muted-foreground">{spot.city}</p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {/* Surface Type */}
                        <Badge
                            variant="secondary"
                            className={`${surfaceInfo.color} text-sm py-1.5 px-3 gap-2`}
                        >
                            <span>{surfaceInfo.icon}</span>
                            {t(spot.surface_type)}
                            {needsWarning && <AlertTriangle className="h-4 w-4" />}
                        </Badge>

                        {/* Shade */}
                        {spot.has_shade && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 text-sm py-1.5 px-3 gap-2">
                                <Sun className="h-4 w-4" />
                                {t('shade')}
                            </Badge>
                        )}

                        {/* Ramp Access */}
                        {spot.has_ramp_access && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-sm py-1.5 px-3 gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {t('rampAccess')}
                            </Badge>
                        )}

                        {/* Free/Paid */}
                        <Badge
                            variant="secondary"
                            className={`text-sm py-1.5 px-3 gap-2 ${spot.is_free ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'}`}
                        >
                            <DollarSign className="h-4 w-4" />
                            {spot.is_free ? t('freeParking') : t('paidParking')}
                        </Badge>

                        {/* Van Accessible */}
                        {spot.is_van_accessible && (
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 text-sm py-1.5 px-3 gap-2">
                                <Car className="h-4 w-4" />
                                {t('vanAccessible')}
                            </Badge>
                        )}
                    </div>

                    {/* Surface Warning */}
                    {needsWarning && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-medium">
                                {t(`${spot.surface_type}Warning`)}
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    {spot.notes && (
                        <div className="bg-muted/50 p-4 rounded-xl">
                            <p className="text-muted-foreground text-sm leading-relaxed">{spot.notes}</p>
                        </div>
                    )}

                    {/* Navigate Button */}
                    <Button
                        onClick={handleNavigate}
                        className="w-full h-14 text-lg font-semibold gap-3 rounded-xl shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        <Navigation className="h-5 w-5" />
                        {t('navigate')}
                    </Button>
                </div>
            </div>

            {isPhotoOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-in fade-in"
                    onClick={() => setIsPhotoOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsPhotoOpen(false)}
                        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center"
                        aria-label={t('close')}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <img
                        src={spot.photo_url}
                        alt={t('accessibleParking')}
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </div>
    );
}