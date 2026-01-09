import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Minus, Navigation, Layers, AlignLeft, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
    onMyLocation: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onAddSpot: () => void;
    onToggleMapType: () => void;
    isSatellite: boolean;
}

export default function MapControls({ onMyLocation, onZoomIn, onZoomOut, onAddSpot, onToggleMapType, isSatellite }: MapControlsProps) {
    const { t } = useTranslation();

    // 1. Initialize state from localStorage (default to false/right-handed)
    const [isLeftHanded, setIsLeftHanded] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('leftHandedMode') === 'true';
        }
        return false;
    });

    // 2. Save preference otan allazei
    useEffect(() => {
        localStorage.setItem('leftHandedMode', String(isLeftHanded));
    }, [isLeftHanded]);

    // 3. Dynamic positioning class
    // If left-handed, use 'left-4', otherwise 'right-4'
    const sideClass = isLeftHanded ? 'left-4' : 'right-4';

    return (
        <>
            {/* Upper Controls Zoom + Left/Right Handed Mode Toggle */}
            <div className={`absolute ${sideClass} top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 transition-all duration-300`}>

                {/* Toggle Side Button */}
                <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => setIsLeftHanded(!isLeftHanded)}
                    className="h-14 w-14 rounded-xl shadow-lg bg-card hover:bg-accent mb-2"
                    aria-label="Toggle Left Handed Mode"
                    title={isLeftHanded ? "Switch to Right side" : "Switch to Left side"}
                >
                    {isLeftHanded ? <AlignRight className="h-6 w-6" /> : <AlignLeft className="h-6 w-6" />}
                </Button>

                <Button
                    size="icon"
                    variant="secondary"
                    onClick={onZoomIn}
                    className="h-14 w-14 rounded-xl shadow-lg bg-card hover:bg-accent"
                    aria-label={t('zoomIn')}
                >
                    <Plus className="h-6 w-6" />
                </Button>
                <Button
                    size="icon"
                    variant="secondary"
                    onClick={onZoomOut}
                    className="h-14 w-14 rounded-xl shadow-lg bg-card hover:bg-accent"
                    aria-label={t('zoomOut')}
                >
                    <Minus className="h-6 w-6" />
                </Button>
            </div>

            {/* GROUP 2: Bottom Controls (Layers + Location) */}

            {/* Map Type Toggle */}
            <Button
                size="icon"
                variant="secondary"
                onClick={onToggleMapType}
                className={`absolute ${sideClass} bottom-24 z-10 h-14 w-14 rounded-xl shadow-lg bg-card hover:bg-accent transition-all duration-300`}
                aria-label={t("toggleMapType")}
            >
                <Layers className={`h-6 w-6 ${isSatellite ? "text-primary" : ""}`} />
            </Button>

            {/* My Location Button */}
            <Button
                size="icon"
                variant="secondary"
                onClick={onMyLocation}
                className={`absolute ${sideClass} bottom-5 z-10 h-14 w-14 rounded-xl shadow-lg bg-card hover:bg-accent transition-all duration-300`}
                aria-label={t('myLocation')}
            >
                <Navigation className="h-6 w-6" />
            </Button>

            {/* GROUP 3: Center Add Spot Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <Button
                    onClick={onAddSpot}
                    className="h-16 px-8 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg gap-3"
                    aria-label={t('addSpot')}
                >
                    <MapPin className="h-6 w-6" />
                    <span>{t('addSpot')}</span>
                </Button>
            </div>
        </>
    );
}