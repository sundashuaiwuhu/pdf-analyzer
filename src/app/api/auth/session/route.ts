// Session 检查 API
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  if (!authToken) {
    return Response.json({ user: null });
  }

  try {
    const sessionData = JSON.parse(atob(authToken));
    
    // 检查是否过期
    if (sessionData.exp < Date.now()) {
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        email: sessionData.email,
        name: sessionData.name,
        picture: sessionData.picture,
      }
    });
  } catch (e) {
    return Response.json({ user: null });
  }
}
