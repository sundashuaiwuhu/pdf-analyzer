// 简化的 Google 登录 - 不依赖 next-auth
// 使用 Google Identity Services 客户端方式

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');

  if (mode === 'login') {
    // 构建 Google 登录 URL
    const redirectUri = `${url.origin}/api/auth/callback/google`;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', 'login');

    return Response.redirect(authUrl.toString());
  }

  return new Response('Auth endpoint', { status: 200 });
}

export async function POST(request: Request) {
  return GET(request);
}
