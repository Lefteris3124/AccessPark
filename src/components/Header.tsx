import { useTranslation } from 'react-i18next';
import { Globe, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const { t, i18n } = useTranslation();
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'el' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('accesspark-language', newLang);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="flex items-center justify-end p-4 pt-safe">


                {/* Actions */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Language Toggle */}
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={toggleLanguage}
                        className="h-12 w-12 rounded-xl bg-card shadow-lg"
                        aria-label={t('language')}
                    >
                        <Globe className="h-5 w-5" />
                    </Button>

                    {/* User Menu */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-12 w-12 rounded-xl bg-card shadow-lg"
                                    aria-label={t('profile')}
                                >
                                    <User className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-3 py-2">
                                    <p className="text-sm font-medium">{user.email}</p>
                                </div>
                                <DropdownMenuSeparator />
                                {isAdmin && (
                                    <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2">
                                        <Settings className="h-4 w-4" />
                                        {t('admin')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                                    <LogOut className="h-4 w-4" />
                                    {t('logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/auth')}
                            className="h-12 px-4 rounded-xl bg-card shadow-lg font-medium"
                        >
                            {t('login')}
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
