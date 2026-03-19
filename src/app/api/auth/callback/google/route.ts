// Google OAuth 回调处理
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`Auth error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/callback/google`;

  // 用 code 换取 access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId || '',
      client_secret: clientSecret || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return new Response('Failed to get access token', { status: 400 });
  }

  // 获取用户信息
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const userData = await userResponse.json();

  // 生成简单的 session token (实际生产应该用 JWT)
  const sessionToken = btoa(JSON.stringify({
    email: userData.email,
    name: userData.name,
    picture: userData.picture,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24小时
  }));

  // 使用 NextResponse 重定向并设置 cookie
  const response = NextResponse.redirect(url.origin);
  response.cookies.set('auth_token', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24小时
    path: '/',
  });

  return response;
}
