export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const body = await context.request.json();
        const { action, token, ...params } = body;

        const SUPABASE_URL = context.env.SUPABASE_URL;
        const SUPABASE_KEY = context.env.SUPABASE_KEY;

        let url, method, data, headers;

        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token || SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'signUp':
                url = `${SUPABASE_URL}/auth/v1/signup`;
                method = 'POST';
                data = { email: params.email, password: params.password };
                break;

            case 'signIn':
            case 'signInWithPassword':
                url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
                method = 'POST';
                data = { email: params.email, password: params.password };
                break;

            case 'signOut':
                url = `${SUPABASE_URL}/auth/v1/logout`;
                method = 'POST';
                break;

            case 'getUser':
                url = `${SUPABASE_URL}/auth/v1/user`;
                method = 'GET';
                break;

            case 'select':
                url = `${SUPABASE_URL}/rest/v1/${params.table}${params.query ? '?' + params.query : ''}`;
                method = 'GET';
                break;

            case 'insert':
                url = `${SUPABASE_URL}/rest/v1/${params.table}`;
                method = 'POST';
                data = params.data;
                headers['Prefer'] = 'return=representation';
                break;

            case 'update':
                url = `${SUPABASE_URL}/rest/v1/${params.table}${params.query ? '?' + params.query : ''}`;
                method = 'PATCH';
                data = params.data;
                headers['Prefer'] = 'return=representation';
                break;

            case 'delete':
                url = `${SUPABASE_URL}/rest/v1/${params.table}${params.query ? '?' + params.query : ''}`;
                method = 'DELETE';
                break;

            case 'storage':
                url = `${SUPABASE_URL}/storage/v1/object/${params.bucket}/${params.path}`;
                method = 'GET';
                break;

            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: corsHeaders
                });
        }

        const supabaseResponse = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        });

        const responseData = await supabaseResponse.json();

        return new Response(JSON.stringify({
            status: supabaseResponse.status,
            data: responseData
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}