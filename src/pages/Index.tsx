import { useState } from 'react';
import Header from '@/components/Header';
import ParkingMap from '@/components/Map/ParkingMap';
import AddSpotModal from '@/components/AddSpotModal';

export default function Index() {
    const [isAddSpotOpen, setIsAddSpotOpen] = useState(false);

    return (

        <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-background overscroll-none">
            <Header />
            <main className="h-full w-full relative">
                <ParkingMap onAddSpotClick={() => setIsAddSpotOpen(true)} />
            </main>
            <AddSpotModal
                isOpen={isAddSpotOpen}
                onClose={() => setIsAddSpotOpen(false)}
            />
        </div>
    );
}