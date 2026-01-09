import { useEffect, useState } from "react"


type ParkingSpot = {
    id: number
    created_at: string

}

export default function ParkingSpots() {
    const [spots, setSpots] = useState<ParkingSpot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        //Call sto PHP API
        const fetchData = async () => {
            try {
                const response = await fetch("http://localhost:8000/parking-spots.php")

                if (!response.ok) {
                    throw new Error("Network response was not ok")
                }

                const data = await response.json()
                setSpots(data)
            } catch (err) {
                setError("Failed to load parking spots")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Parking Spots</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {spots.map((spot) => (
                    <div key={spot.id} className="border p-4 rounded shadow">
                        <h2 className="font-bold">Spot #{spot.id}</h2>
                        <p className="text-gray-500">Created: {new Date(spot.created_at).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}