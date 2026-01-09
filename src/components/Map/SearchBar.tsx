import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoaded: boolean;
}

export default function SearchBar({ onSearch, isLoaded }: SearchBarProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoaded && !autocompleteService.current) {
            autocompleteService.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);

        if (value.trim().length < 2 || !autocompleteService.current) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        autocompleteService.current.getPlacePredictions(
            {
                input: value,
                types: ['(cities)'],
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }
        );
    };

    const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
        setQuery(suggestion.structured_formatting.main_text);
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch(suggestion.description);
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
                        placeholder={t('searchPlaceholder')}
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="pl-10 md:pl-12 pr-4 h-10 md:h-14 text-sm md:text-lg bg-card border-2 border-border shadow-lg rounded-xl focus:border-primary"
                        aria-label={t('searchPlaceholder')}
                        autoComplete="off"
                    />
                </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-xl shadow-lg overflow-hidden z-50">
                    {suggestions.map((suggestion) => (
                        <li key={suggestion.place_id}>
                            <button
                                type="button"
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                            >
                                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                        {suggestion.structured_formatting.main_text}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {suggestion.structured_formatting.secondary_text}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
