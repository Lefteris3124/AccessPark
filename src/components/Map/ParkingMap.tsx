import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, Libraries } from "@react-google-maps/api";
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider';
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { useTranslation } from "react-i18next";
import { useParkingSpots } from "@/hooks/useParkingSpots";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ParkingSpot } from "@/types/parking";
import SpotDetailsCard from "./SpotDetailsCard";
import MapControls from "./MapControls";
import SearchBar from "./SearchBar";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID;

interface ParkingMapProps {
    onAddSpotClick: () => void;
}

// Greece center coordinates
const GREECE_CENTER = { lat: 37.9838, lng: 23.7275 };
const DEFAULT_ZOOM = 6;

const LIBRARIES: Libraries = ["places", "marker"];

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    minZoom: 3,
};


function createSpotMarkerContent() {
    const img = document.createElement("img");
    img.src = "/parking-marker-wheelchair.svg";
    img.width = 40;
    img.height = 48;
    img.style.display = "block";
    img.style.cursor = "pointer";

    return img;
}

function createClusterContent(count: number) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "50");
    svg.setAttribute("height", "50");
    svg.setAttribute("viewBox", "0 0 50 50");
    svg.style.cursor = "pointer";

    svg.innerHTML = `
      <circle cx="25" cy="25" r="25" fill="#1e3a5f"/>
      <circle cx="25" cy="25" r="20" fill="#ffd700"/>
      <text x="25" y="30" text-anchor="middle" fill="#1e3a5f" font-size="16" font-weight="bold" font-family="Arial">${count}</text>
    `;

    return svg;
}

function createUserDotContent() {
    const dot = document.createElement("div");
    dot.style.width = "20px";
    dot.style.height = "20px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#3b82f6";
    dot.style.border = "3px solid #ffffff";
    dot.style.boxSizing = "border-box";

    return dot;
}

export default function ParkingMap({ onAddSpotClick }: ParkingMapProps) {
    const { t } = useTranslation();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const [isSatellite, setIsSatellite] = useState(false);
    const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    const { data: spots = [], isLoading: spotsLoading } = useParkingSpots();
    const { latitude, longitude, error: geoError } = useGeolocation();

    const { isLoaded, loadError } = useGoogleMaps();

    const onLoad = useCallback((m: google.maps.Map) => {
        setMap(m);
    }, []);

    const handleToggleMapType = () => {
        setIsSatellite((prev) => !prev);
    };

    const onUnmount = useCallback(() => {
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current = null;
        }
        markersRef.current.forEach((m) => (m.map = null));
        markersRef.current = [];

        if (userMarkerRef.current) {
            userMarkerRef.current.map = null;
            userMarkerRef.current = null;
        }

        setMap(null);
    }, []);


    useEffect(() => {
        if (!map || !isLoaded || spotsLoading) return;

        // Clear existing markers and clusterer
        markersRef.current.forEach((m) => (m.map = null));
        markersRef.current = [];
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current = null;
        }

        const markers = spots.map((spot) => {
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: { lat: spot.latitude, lng: spot.longitude },
                content: createSpotMarkerContent(),
                title: "Accessible parking",
                gmpDraggable: false,
            });

            marker.addListener("click", () => setSelectedSpot(spot));
            return marker;
        });

        markersRef.current = markers;

        clustererRef.current = new MarkerClusterer({
            map,
            markers,


            algorithm: new SuperClusterAlgorithm({
                radius: 50,
                maxZoom: 17,
            }),

            renderer: {
                render: ({ count, position }) => {
                    return new google.maps.marker.AdvancedMarkerElement({
                        position,
                        content: createClusterContent(count),
                        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
                        gmpDraggable: false,
                    });
                },
            },
        });

        return () => {
            markersRef.current.forEach((m) => (m.map = null));
            if (clustererRef.current) {
                clustererRef.current.clearMarkers();
                clustererRef.current = null;
            }
        };
    }, [map, spots, isLoaded, spotsLoading]);


    useEffect(() => {
        if (!map) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.map = null;
            userMarkerRef.current = null;
        }

        if (!latitude || !longitude) return;

        userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: latitude, lng: longitude },
            content: createUserDotContent(),
            zIndex: 1000,
            gmpDraggable: false,
        });

        return () => {
            if (userMarkerRef.current) {
                userMarkerRef.current.map = null;
                userMarkerRef.current = null;
            }
        };
    }, [map, latitude, longitude]);

    const handleSearch = (query: string) => {
        if (!map) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                map.panTo(location);
                map.setZoom(13);
            } else {
                toast.error(t("locationNotFound"));
            }
        });
    };

    const handleMyLocation = () => {
        if (latitude && longitude && map) {
            map.panTo({ lat: latitude, lng: longitude });
            map.setZoom(15);
        } else if (geoError) {
            toast.error(t("locationError"));
        }
    };

    const handleZoomIn = () => {
        if (map) map.setZoom((map.getZoom() || DEFAULT_ZOOM) + 1);
    };

    const handleZoomOut = () => {
        if (map) map.setZoom((map.getZoom() || DEFAULT_ZOOM) - 1);
    };

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-destructive">{t("mapLoadError")}</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-muted-foreground">{t("loadingMap")}</p>
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
                    mapId: GOOGLE_MAP_ID,
                }}
                onLoad={onLoad}
                onUnmount={onUnmount}
            />

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
            {selectedSpot && <SpotDetailsCard spot={selectedSpot} onClose={() => setSelectedSpot(null)} />}
        </div>
    );
}