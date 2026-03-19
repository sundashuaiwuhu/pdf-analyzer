import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const { GET, POST } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/", // 使用自定义登录页面
  },
  callbacks: {
    async session({ session, token }) {
      return session;
    },
  },
});
