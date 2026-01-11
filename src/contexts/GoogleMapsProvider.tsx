// src/contexts/GoogleMapsProvider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
    isLoaded: false,
    loadError: undefined,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
    children: ReactNode;
}

const libraries: Libraries = ['places', 'marker'];

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
}