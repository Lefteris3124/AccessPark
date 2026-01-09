import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, signIn, signUp, loading: authLoading } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

    // Redirect if already logged in
    useEffect(() => {
        if (user && !authLoading) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        try {
            emailSchema.parse(email);
        } catch (e) {
            newErrors.email = 'Please enter a valid email address';
        }

        try {
            passwordSchema.parse(password);
        } catch (e) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin && password !== confirmPassword) {
            newErrors.confirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        toast.error('Invalid email or password');
                    } else {
                        toast.error(error.message);
                    }
                } else {
                    navigate('/');
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    if (error.message.includes('already registered')) {
                        toast.error('This email is already registered. Please sign in.');
                    } else {
                        toast.error(error.message);
                    }
                } else {
                    toast.success('Account created successfully!');
                    navigate('/');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
                        <MapPin className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isLogin ? t('loginTitle') : t('signupTitle')}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {isLogin ? t('loginSubtitle') : t('signupSubtitle')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="email" className="text-base font-semibold">
                            {t('email')}
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={`h-14 text-base rounded-xl ${errors.email ? 'border-destructive' : ''}`}
                            required
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="password" className="text-base font-semibold">
                            {t('password')}
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`h-14 text-base rounded-xl ${errors.password ? 'border-destructive' : ''}`}
                            required
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="space-y-3">
                            <Label htmlFor="confirm-password" className="text-base font-semibold">
                                {t('confirmPassword')}
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`h-14 text-base rounded-xl ${errors.confirm ? 'border-destructive' : ''}`}
                                required
                                autoComplete="new-password"
                            />
                            {errors.confirm && (
                                <p className="text-sm text-destructive">{errors.confirm}</p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 text-lg font-semibold rounded-xl"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                {isLogin ? t('login') : t('signup')}...
                            </>
                        ) : (
                            isLogin ? t('login') : t('signup')
                        )}
                    </Button>
                </form>

                {/* Toggle */}
                <div className="text-center">
                    <Button
                        variant="link"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrors({});
                        }}
                        className="text-base"
                    >
                        {isLogin ? t('noAccount') : t('hasAccount')}{' '}
                        <span className="font-semibold ml-1">
              {isLogin ? t('signup') : t('login')}
            </span>
                    </Button>
                </div>

                {/* Back to home */}
                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-muted-foreground"
                    >
                        ← {t('continueAsGuest')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
