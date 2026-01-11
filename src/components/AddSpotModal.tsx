import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Camera, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitSpot, useUploadPhoto } from '@/hooks/useParkingSpots';
import { useGeolocation } from '@/hooks/useGeolocation';
import { SurfaceType, NewParkingSpot } from '@/types/parking';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider';

interface AddSpotModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const surfaceOptions: { value: SurfaceType; labelKey: string; icon: string }[] = [
    { value: 'asphalt', labelKey: 'asphalt', icon: '🛣️' },
];

export default function AddSpotModal({ isOpen, onClose }: AddSpotModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { latitude, longitude, refresh: refreshLocation } = useGeolocation();
    const submitSpot = useSubmitSpot();
    const uploadPhoto = useUploadPhoto();

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [surfaceType, setSurfaceType] = useState<SurfaceType>('asphalt');
    const [hasShade, setHasShade] = useState(false);
    const [hasRampAccess, setHasRampAccess] = useState(false);
    const [isFree, setIsFree] = useState(true);
    const [isVanAccessible, setIsVanAccessible] = useState(false);
    const [notes, setNotes] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const myLocation =
        latitude && longitude ? { lat: latitude, lng: longitude } : null;

    const { isLoaded } = useGoogleMaps();

    if (!isOpen) return null;

    const handleUseCurrentLocation = () => {
        if (latitude && longitude) {
            setSelectedLocation({ lat: latitude, lng: longitude });
            toast.success(t('myLocation'));
        } else {
            refreshLocation();
        }
    };

    const handleUsePinLocation = () => {
        setShowMapPicker(true);
        // Set initial map center to current location or selected location
        if (latitude && longitude) {
            setMapCenter({ lat: latitude, lng: longitude });
        } else if (selectedLocation) {
            setMapCenter(selectedLocation);
        }
    };

    const handleGoToMyLocation = () => {
        if (latitude && longitude) {
            setMapCenter({ lat: latitude, lng: longitude });
            toast.success(t('myLocation'));
        } else {
            toast.error(t('locationUnavailable'));
            refreshLocation();
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setSelectedLocation({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            });
        }
    };

    const handleConfirmPin = () => {
        if (selectedLocation) {
            setShowMapPicker(false);
            toast.success(t('locationSelected'));
        } else {
            toast.error(t('pleaseSelectLocation'));
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error(t('loginRequired'));
            navigate('/auth');
            return;
        }

        if (!selectedLocation) {
            toast.error(t('locationRequired'));
            return;
        }

        try {
            let photoUrl: string | undefined;

            if (photoFile) {
                photoUrl = await uploadPhoto.mutateAsync(photoFile);
            }

            const cityName = await getCityFromCoordinates(selectedLocation.lat, selectedLocation.lng);

            const newSpot: NewParkingSpot = {
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
                city: cityName,
                surface_type: surfaceType,
                has_shade: hasShade,
                has_ramp_access: hasRampAccess,
                is_free: isFree,
                is_van_accessible: isVanAccessible,
                notes: notes || undefined,
                photo_url: photoUrl,
            };

            await submitSpot.mutateAsync(newSpot);
            toast.success(t('spotSubmitted'));
            onClose();

            // Reset form
            setSelectedLocation(null);
            setSurfaceType('asphalt');
            setHasShade(false);
            setHasRampAccess(false);
            setIsFree(true);
            setIsVanAccessible(false);
            setNotes('');
            setPhotoFile(null);
            setPhotoPreview(null);
            setShowMapPicker(false);
            setMapCenter(null);
        } catch (error) {
            console.error('Error submitting spot:', error);
            toast.error(t('spotSubmitError'));
        }
    };

    const getCityFromCoordinates = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown Location';
        } catch (error) {
            console.error('Error fetching city:', error);
            return 'Unknown Location';
        }
    };

    const isSubmitting = submitSpot.isPending || uploadPhoto.isPending;

    // Map Picker Modal
    if (showMapPicker) {
        return (
            <div className="fixed inset-0 z-50 bg-background">
                <div className="h-full flex flex-col">
                    {/* Map Header */}
                    <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowMapPicker(false)}
                            className="h-10 w-10 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <h3 className="text-lg font-semibold text-foreground">{t('selectLocation')}</h3>
                        <div className="w-10" />
                    </div>

                    {/* Map */}
                    <div className="flex-1 relative">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter || selectedLocation || { lat: latitude || 40.7128, lng: longitude || -74.0060 }}
                                zoom={15}
                                onClick={handleMapClick}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                }}
                            >

                                {myLocation && (
                                    <Marker
                                        position={myLocation}
                                        title={t('myLocation')}
                                        icon={{
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: '#1e90ff',   // 🔵 blue fill
                                            fillOpacity: 1,
                                            strokeColor: '#ffffff', // ⚪ white border
                                            strokeWeight: 2,
                                        }}
                                        zIndex={999}
                                    />
                                )}

                                {selectedLocation && (
                                    <Marker
                                        position={selectedLocation}
                                        animation={google.maps.Animation.DROP}
                                    />
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* Instructions overlay */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-border">
                            <p className="text-sm font-medium text-foreground">📍 {t('tapToDropPin')}</p>
                        </div>

                        {/* My Location Button */}
                        <div className="absolute top-4 right-4">
                            <Button
                                size="icon"
                                onClick={handleGoToMyLocation}
                                className="h-12 w-12 rounded-full shadow-lg"
                                variant="secondary"
                            >
                                <MapPin className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Selected coordinates display */}
                        {selectedLocation && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-success/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-white text-xs font-medium">
                                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </div>
                        )}
                    </div>

                    {/* Confirm Button */}
                    <div className="bg-background border-t border-border p-4 shadow-lg">
                        <Button
                            onClick={handleConfirmPin}
                            disabled={!selectedLocation}
                            className="w-full h-14 text-base font-semibold rounded-xl"
                        >
                            <Target className="h-5 w-5 mr-2" />
                            {t('confirmLocation')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-0 overflow-y-auto">
                <div className="min-h-full flex items-end justify-center">
                    <div className="w-full max-w-lg bg-card rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="sticky top-0 bg-card rounded-t-3xl border-b border-border z-10">
                            <div className="flex justify-center py-3">
                                <div className="w-12 h-1.5 bg-muted rounded-full" />
                            </div>
                            <div className="flex items-center justify-between px-6 pb-4">
                                <h2 className="text-2xl font-bold">{t('addNewSpot')}</h2>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={onClose}
                                    className="h-12 w-12 rounded-full"
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Location */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">{t('dropPin')}</Label>

                                <Button
                                    variant="outline"
                                    onClick={handleUseCurrentLocation}
                                    className="w-full h-14 text-base gap-3 rounded-xl"
                                >
                                    <MapPin className="h-5 w-5" />
                                    {t('useCurrentLocation')}
                                </Button>

                                {/* Divider */}
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">or</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={handleUsePinLocation}
                                    className="w-full h-14 text-base gap-3 rounded-xl"
                                >
                                    <Target className="h-5 w-5" />
                                    {t('usePin')}
                                </Button>

                                {selectedLocation && (
                                    <div className="p-3 bg-success/10 rounded-xl text-success text-sm">
                                        📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                                    </div>
                                )}
                            </div>

                            {/* Surface Type */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">{t('selectSurface')}</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {surfaceOptions.map((option) => (
                                        <Button
                                            key={option.value}
                                            variant={surfaceType === option.value ? 'default' : 'outline'}
                                            onClick={() => setSurfaceType(option.value)}
                                            className="h-14 text-base gap-2 rounded-xl"
                                        >
                                            <span className="text-xl">{option.icon}</span>
                                            {t(option.labelKey)}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <Label htmlFor="shade" className="text-base font-medium cursor-pointer">
                                        ☀️ {t('hasShade')}
                                    </Label>
                                    <Switch
                                        id="shade"
                                        checked={hasShade}
                                        onCheckedChange={setHasShade}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <Label htmlFor="ramp" className="text-base font-medium cursor-pointer">
                                        ♿ {t('hasRampAccess')}
                                    </Label>
                                    <Switch
                                        id="ramp"
                                        checked={hasRampAccess}
                                        onCheckedChange={setHasRampAccess}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <Label htmlFor="free" className="text-base font-medium cursor-pointer">
                                        💰 {t('isFree')}
                                    </Label>
                                    <Switch
                                        id="free"
                                        checked={isFree}
                                        onCheckedChange={setIsFree}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <Label htmlFor="van" className="text-base font-medium cursor-pointer">
                                        🚐 {t('isVanAccessible')}
                                    </Label>
                                    <Switch
                                        id="van"
                                        checked={isVanAccessible}
                                        onCheckedChange={setIsVanAccessible}
                                    />
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">{t('uploadPhoto')}</Label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        id="photo-upload"
                                    />
                                    {photoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={photoPreview}
                                                alt="Preview"
                                                className="w-full h-48 object-cover rounded-xl"
                                            />
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                onClick={() => {
                                                    setPhotoFile(null);
                                                    setPhotoPreview(null);
                                                }}
                                                className="absolute top-2 right-2 h-10 w-10 rounded-full"
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="photo-upload"
                                            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                                        >
                                            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-muted-foreground">{t('uploadPhoto')}</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <Label htmlFor="notes" className="text-base font-semibold">{t('addNotes')}</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('notesPlaceholder')}
                                    className="min-h-[100px] text-base rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-card border-t border-border p-6 space-y-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedLocation || isSubmitting}
                                className="w-full h-16 text-lg font-semibold rounded-xl"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        {t('submitting')}
                                    </>
                                ) : (
                                    t('submit')
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full h-14 text-base rounded-xl"
                            >
                                {t('cancel')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}