// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

const PHP_PROXY_URL = '/api/supabase';

class SupabaseProxyClient {
    private token: string | null = null;

    async request(action: string, data: any = {}) {
        console.log('🔄 Proxying request:', action, 'to', PHP_PROXY_URL);

        const response = await fetch(PHP_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                token: this.token,
                ...data
            }),
        });

        const result = await response.json();
        console.log('✅ Response from proxy:', action, result);

        if (result.status >= 400) {
            throw new Error(result.data?.message || 'Request failed');
        }

        return result.data;
    }

    auth = {
        signUp: async (credentials: { email: string; password: string }) => {
            const data = await this.request('signUp', credentials);
            if (data.access_token) {
                this.token = data.access_token;
            }
            return { data, error: null };
        },

        signInWithPassword: async (credentials: { email: string; password: string }) => {
            const data = await this.request('signInWithPassword', credentials);
            if (data.access_token) {
                this.token = data.access_token;
            }
            return { data, error: null };
        },

        signOut: async () => {
            const data = await this.request('signOut');
            this.token = null;
            return { error: null };
        },

        getUser: async () => {
            const data = await this.request('getUser');
            return { data: { user: data }, error: null };
        },

        getSession: async () => {
            const data = await this.request('getUser');
            return {
                data: {
                    session: data ? { user: data, access_token: this.token } : null
                },
                error: null
            };
        },

        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            return { data: { subscription: { unsubscribe: () => {} } } };
        }
    };

    from(table: string) {
        return {
            select: async (columns: string = '*') => {
                const data = await this.request('select', {
                    table,
                    query: `select=${columns}`
                });
                return { data, error: null };
            },

            insert: async (values: any) => {
                const data = await this.request('insert', {
                    table,
                    data: values
                });
                return { data, error: null };
            },

            update: async (values: any) => {
                return {
                    eq: async (column: string, value: any) => {
                        const data = await this.request('update', {
                            table,
                            data: values,
                            query: `${column}=eq.${value}`
                        });
                        return { data, error: null };
                    }
                };
            },

            delete: () => {
                return {
                    eq: async (column: string, value: any) => {
                        const data = await this.request('delete', {
                            table,
                            query: `${column}=eq.${value}`
                        });
                        return { data, error: null };
                    }
                };
            }
        };
    }

    storage = {
        from: (bucket: string) => {
            return {
                getPublicUrl: (path: string) => {
                    return {
                        data: {
                            publicUrl: `${PHP_PROXY_URL}?action=storage&bucket=${bucket}&path=${path}`
                        }
                    };
                },

                upload: async (path: string, file: File) => {
                    const formData = new FormData();
                    formData.append('action', 'upload');
                    formData.append('bucket', bucket);
                    formData.append('path', path);
                    formData.append('file', file);

                    const response = await fetch(PHP_PROXY_URL, {
                        method: 'POST',
                        body: formData,
                    });

                    const result = await response.json();
                    return { data: result.data, error: null };
                }
            };
        }
    };
}

// Export the appropriate client based on environment
export const supabase = isDevelopment
    ? createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    )
    : new SupabaseProxyClient();

// Log which mode we're in
if (isDevelopment) {
    console.log('🔧 Development mode: Using direct Supabase client');
} else {
    console.log('🚀 Production mode: Using Cloudflare proxy');
}