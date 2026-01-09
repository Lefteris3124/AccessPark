import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Calendar, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useSpot } from '@/hooks/useParkingSpots';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function SpotDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data: spot, isLoading } = useSpot(id || '');

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
    );

    if (!spot) return <div className="p-10 text-center">Spot not found</div>;

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-card/80 backdrop-blur border-b z-10 p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{t('spotDetails')}</h1>
                    <p className="text-xs text-muted-foreground font-mono">{spot.id.split('-')[0]}</p>
                </div>
            </header>

            <main className="p-4 max-w-4xl mx-auto space-y-6">

                {/* Map */}
                <div className="h-[400px] w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
                    <MapContainer
                        center={[spot.latitude, spot.longitude]}
                        zoom={17}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[spot.latitude, spot.longitude]}>
                            <Popup>
                                {spot.city}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                {/* Main Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="bg-card p-6 rounded-xl border shadow-sm space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                                    <MapPin className="h-6 w-6 text-primary" />
                                    {spot.city || 'Unknown Location'}
                                </h2>
                                <p className="text-muted-foreground font-mono text-sm ml-8">
                                    {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="text-base px-3 py-1">
                                    {t(spot.surface_type)}
                                </Badge>
                                {spot.is_free && (
                                    <Badge className="bg-green-600 text-white hover:bg-green-700 text-base px-3 py-1">
                                        {t('freeParking')}
                                    </Badge>
                                )}
                                {spot.has_ramp_access && (
                                    <Badge variant="outline" className="text-base px-3 py-1 border-primary text-primary">
                                        ♿ {t('rampAccess')}
                                    </Badge>
                                )}
                            </div>

                            {/* Features List */}
                            <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Shade:</span>
                                    <span className="font-medium">{spot.has_shade ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Van Accessible:</span>
                                    <span className="font-medium">{spot.is_van_accessible ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Card */}
                        {spot.notes && (
                            <div className="bg-card p-6 rounded-xl border shadow-sm">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    {t('notes')}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {spot.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Photo & Metadata */}
                    <div className="space-y-4">
                        {spot.photo_url ? (
                            <div className="rounded-xl overflow-hidden border shadow-sm bg-muted h-64 md:h-72">
                                <img
                                    src={spot.photo_url}
                                    alt="Parking Spot"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-64 bg-muted/30 rounded-xl flex items-center justify-center border border-dashed">
                                <span className="text-muted-foreground flex flex-col items-center gap-2">
                                    <MapPin className="h-8 w-8 opacity-20" />
                                    No Photo Available
                                </span>
                            </div>
                        )}

                        {/* Info Panel with Approved by and approved Dates */}
                        <div className="bg-card p-4 rounded-xl border shadow-sm text-sm space-y-0 divide-y">

                            {/* Date Row */}
                            <div className="flex justify-between py-3">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4"/>
                                    {spot.approved_at ? 'Approved Date' : 'Created Date'}
                                </span>
                                <span className="font-medium">
                                    {spot.approved_at
                                        ? new Date(spot.approved_at).toLocaleDateString()
                                        : spot.created_at
                                            ? new Date(spot.created_at).toLocaleDateString()
                                            : 'Pending'}
                                </span>
                            </div>

                            {/* Submitted By */}
                            <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1">
                                <span className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                                    <User className="h-4 w-4"/>
                                    Submitted By
                                </span>
                                <span className="font-medium text-right break-all sm:break-normal text-sm sm:text-base">
                                    {/* @ts-ignore */}
                                    {spot.submitter?.email || 'Anonymous'}
                                </span>
                            </div>

                            {/* Approved By */}
                            <div className="flex flex-col sm:flex-row sm:justify-between py-3 gap-1">
                                <span className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                                    <User className="h-4 w-4"/>
                                    Approved By
                                </span>
                                <span className="font-medium text-primary text-right break-all sm:break-normal text-sm sm:text-base">
                                    {/* @ts-ignore */}
                                    {spot.approver?.email || 'System'}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}