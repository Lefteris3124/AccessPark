export type SurfaceType = 'asphalt' | 'cobblestone' | 'gravel' | 'dirt';
export type SpotStatus = 'pending' | 'approved' | 'rejected';

export interface ParkingSpot {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    city: string;
    surface_type: SurfaceType;
    has_shade: boolean;
    has_ramp_access: boolean;
    is_free: boolean;
    is_van_accessible: boolean;
    photo_url: string | null;
    notes: string | null;
    status: SpotStatus;
    submitted_by: string | null;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NewParkingSpot {
    latitude: number;
    longitude: number;
    address?: string;
    city: string;
    surface_type: SurfaceType;
    has_shade: boolean;
    has_ramp_access: boolean;
    is_free: boolean;
    is_van_accessible: boolean;
    photo_url?: string;
    notes?: string;
}
