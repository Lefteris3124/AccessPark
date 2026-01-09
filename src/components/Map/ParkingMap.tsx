import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useTranslation } from 'react-i18next';
import { useParkingSpots } from '@/hooks/useParkingSpots';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ParkingSpot } from '@/types/parking';
import SpotDetailsCard from './SpotDetailsCard';
import MapControls from './MapControls';
import SearchBar from './SearchBar';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


interface ParkingMapProps {
    onAddSpotClick: () => void;
}

// Greece center coordinates
const GREECE_CENTER = { lat: 37.9838, lng: 23.7275 };
const DEFAULT_ZOOM = 6;

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,

    minZoom: 3,

    styles: [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
        },
    ],
};


export default function ParkingMap({ onAddSpotClick }: ParkingMapProps) {
    const { t } = useTranslation();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [isSatellite, setIsSatellite] = useState(false);

    const { data: spots = [], isLoading: spotsLoading } = useParkingSpots();
    const { latitude, longitude, error: geoError } = useGeolocation();

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const handleToggleMapType = () => {
        setIsSatellite((prev) => !prev);
    };

    const onUnmount = useCallback(() => {
        // Clean up clusterer kai markers
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setMap(null);
    }, []);

    // Create clustered markers when spots or map change
    useEffect(() => {
        if (!map || !isLoaded || spotsLoading) return;

        // Clear existing markers kai clusterer
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Create markers for each spot
        const markers = spots.map((spot) => {
            const marker = new google.maps.Marker({
                position: { lat: spot.latitude, lng: spot.longitude },
                icon: {
                    url: "/parking-marker-wheelchair.svg",
                    scaledSize: new google.maps.Size(40, 48),
                    anchor: new google.maps.Point(20, 48),
                },
            });

            marker.addListener("click", () => setSelectedSpot(spot));
            return marker;
        });

        markersRef.current = markers;

        // Create clusterer with custom renderer
        clustererRef.current = new MarkerClusterer({
            map,
            markers,
            renderer: {
                render: ({ count, position }) => {
                    return new google.maps.Marker({
                        position,
                        icon: {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="25" fill="#1e3a5f"/>
                  <circle cx="25" cy="25" r="20" fill="#ffd700"/>
                  <text x="25" y="30" text-anchor="middle" fill="#1e3a5f" font-size="16" font-weight="bold" font-family="Arial">${count}</text>
                </svg>
              `)}`,
                            scaledSize: new google.maps.Size(50, 50),
                            anchor: new google.maps.Point(25, 25),
                        },
                        label: '',
                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                    });
                },
            },
        });

        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
            }
        };
    }, [map, spots, isLoaded, spotsLoading]);

    const handleSearch = (query: string) => {
        if (!map) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location;
                map.panTo(location);
                map.setZoom(13);
            } else {
                toast.error(t('locationNotFound'));
            }
        });
    };

    const handleMyLocation = () => {
        if (latitude && longitude && map) {
            map.panTo({ lat: latitude, lng: longitude });
            map.setZoom(15);
        } else if (geoError) {
            toast.error(t('locationError'));
        }
    };

    const handleZoomIn = () => {
        if (map) {
            map.setZoom((map.getZoom() || DEFAULT_ZOOM) + 1);
        }
    };

    const handleZoomOut = () => {
        if (map) {
            map.setZoom((map.getZoom() || DEFAULT_ZOOM) - 1);
        }
    };

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-destructive">{t('mapLoadError')}</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-muted-foreground">{t('loadingMap')}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={GREECE_CENTER}
                zoom={DEFAULT_ZOOM}
                options={{
                    ...mapOptions,
                    mapTypeId: isSatellite ? "hybrid" : "roadmap",
                }}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* User location marker */}
                {latitude && longitude && (
                    <Marker
                        position={{ lat: latitude, lng: longitude }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        zIndex={1000}
                    />
                )}

            </GoogleMap>

            {/* Search Bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-xl">
                <SearchBar onSearch={handleSearch} isLoaded={isLoaded} />
            </div>

            {/* Map Controls */}
            <MapControls
                onMyLocation={handleMyLocation}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onAddSpot={onAddSpotClick}
                onToggleMapType={handleToggleMapType}
                isSatellite={isSatellite}
            />

            {/* Selected Spot Details */}
            {selectedSpot && (
                <SpotDetailsCard
                    spot={selectedSpot}
                    onClose={() => setSelectedSpot(null)}
                />
            )}
        </div>
    );
}
