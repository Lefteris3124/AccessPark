import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingSpot, NewParkingSpot, SurfaceType, SpotStatus } from '@/types/parking';
import {toast} from "sonner";

// Helper to convert database row to ParkingSpot
const mapRowToParkingSpot = (row: any): ParkingSpot => ({
    ...row,
    surface_type: row.surface_type as SurfaceType,
    status: row.status as SpotStatus,
});

export function useParkingSpots() {
    return useQuery({
        queryKey: ['parkingSpots'],
        queryFn: async (): Promise<ParkingSpot[]> => {
            const { data, error } = await supabase
                .from('parking_spots')
                .select('*')
                .eq('status', 'approved');

            if (error) throw error;
            return (data || []).map(mapRowToParkingSpot);
        },
    });
}

export function usePendingSpots() {
    return useQuery({
        queryKey: ['pendingSpots'],
        queryFn: async (): Promise<ParkingSpot[]> => {
            const { data, error } = await supabase
                .from('parking_spots')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapRowToParkingSpot);
        },
    });
}

export function useSubmitSpot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (spot: NewParkingSpot) => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Must be logged in to submit a spot');

            const { data, error } = await supabase
                .from('parking_spots')
                .insert({
                    ...spot,
                    submitted_by: user.id,
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;
            return mapRowToParkingSpot(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
            queryClient.invalidateQueries({ queryKey: ['pendingSpots'] });
        },
    });
}

export function useApproveSpot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (spotId: string) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('parking_spots')
                .update({
                    status: 'approved',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString(),
                })
                .eq('id', spotId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
            queryClient.invalidateQueries({ queryKey: ['pendingSpots'] });
        },
    });
}

export function useRejectSpot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (spotId: string) => {
            const { error } = await supabase
                .from('parking_spots')
                .update({ status: 'rejected' })
                .eq('id', spotId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
            queryClient.invalidateQueries({ queryKey: ['pendingSpots'] });
        },
    });
}

export function useDeleteSpot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (spotId: string) => {
            const { error } = await supabase
                .from('parking_spots')
                .delete()
                .eq('id', spotId);

            if (error) throw error;
        },
        onSuccess: () => {
            // Refresh both lists so the UI stays in sync
            queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
            queryClient.invalidateQueries({ queryKey: ['parkingSpots'] });
        },
        onError: (error) => {
            console.error('Error deleting spot:', error);
            toast.error('Failed to delete parking spot');
        }
    });
}

export function useSpot(id: string) {
    return useQuery({
        queryKey: ['spot', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('parking_spots')
                .select(`
                    *,
                    approver:admins!fk_approver ( email ),
                    submitter:profiles!fk_submitter ( email ) 
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as ParkingSpot;
        },
        enabled: !!id,
    });
}

export function useUploadPhoto() {
    return useMutation({
        mutationFn: async (file: File): Promise<string> => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `spots/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('spot-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('spot-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        },
    });
}
