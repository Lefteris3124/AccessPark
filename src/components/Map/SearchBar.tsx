import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoaded: boolean;
}

type Suggestion = google.maps.places.AutocompleteSuggestion;

function buildDisplayText(s: Suggestion) {
    const pp = s.placePrediction;

    const main =
        pp?.mainText?.text ??
        pp?.text?.text ??
        "";

    const secondary =
        pp?.secondaryText?.text ??
        ""; // optional

    const full = [main, secondary].filter(Boolean).join(", ");

    return { main, secondary, full: full || main };
}

export default function SearchBar({ onSearch, isLoaded }: SearchBarProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = async (value: string) => {
        setQuery(value);

        if (!isLoaded || value.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const { AutocompleteSuggestion } =
                (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;

            const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: value,
                // Helps keep results relevant; tweak to your needs
                region: "GR",
                // language: "el",
                // Optional: if you have user location, you can bias results:
                // locationBias: { center: { lat: 37.9838, lng: 23.7275 }, radius: 50000 },
            });

            // Optional: "city-ish" filtering.
            // Google doesn't give the exact '(cities)' type filter here, so we approximate.
            const filtered = res.suggestions.filter((s) => {
                const types = s.placePrediction?.types ?? [];
                // These are common types for city/locality results
                return (
                    types.includes("locality") ||
                    types.includes("administrative_area_level_3") ||
                    types.includes("administrative_area_level_2") ||
                    types.includes("administrative_area_level_1") ||
                    types.includes("postal_town")
                );
            });

            // If filtering removes everything, fall back to original results.
            const finalList = filtered.length > 0 ? filtered : res.suggestions;

            setSuggestions(finalList);
            setShowSuggestions(finalList.length > 0);
        } catch (err) {
            console.error("Autocomplete suggestions error:", err);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const { main, full } = buildDisplayText(suggestion);
        setQuery(main || full);
        setSuggestions([]);
        setShowSuggestions(false);

        // Use the "full" string for your existing onSearch flow
        onSearch(full);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowSuggestions(false);
            onSearch(query.trim());
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <form onSubmit={handleSubmit}>
                <div className="relative w-[50vw] md:w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={t("searchPlaceholder")}
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="pl-10 md:pl-12 pr-4 h-10 md:h-14 text-sm md:text-lg bg-card border-2 border-border shadow-lg rounded-xl focus:border-primary"
                        aria-label={t("searchPlaceholder")}
                        autoComplete="off"
                    />
                </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-lg overflow-hidden z-50">
                    {suggestions.map((s, idx) => {
                        const { main, secondary, full } = buildDisplayText(s);
                        // Some suggestion objects might not have a stable id; use idx as fallback
                        const key = s.placePrediction?.placeId || `${full}-${idx}`;

                        return (
                            <li key={key}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                                >
                                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-foreground truncate">{main || full}</p>
                                        {secondary ? (
                                            <p className="text-sm text-muted-foreground truncate">{secondary}</p>
                                        ) : null}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
