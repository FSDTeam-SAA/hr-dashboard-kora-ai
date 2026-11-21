import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isHrLead, isHrRole, normalizeRole } from "@/lib/roles";

class DashboardCredentialsError extends CredentialsSignin {
  constructor(code = "invalid_credentials") {
    super();
    this.code = code;
  }
}

function mapAuthErrorCode(message?: string) {
  switch (message) {
    case "User not found":
      return "user_not_found";
    case "Wrong password":
      return "wrong_password";
    case "Email not verified":
      return "email_not_verified";
    case "Account is blocked":
      return "account_blocked";
    case "Valid fresh second factor required":
    case "Second factor already used":
      return "mfa_required";
    default:
      return "invalid_credentials";
  }
}

const API = process.env.NEXT_PUBLIC_BASE_URL;
const secureCookies = (
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  ""
).startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  cookies: {
    sessionToken: {
      name: `${secureCookies ? "__Secure-" : ""}novya-hr.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
    csrfToken: {
      name: `${secureCookies ? "__Host-" : ""}novya-hr.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
    callbackUrl: {
      name: `${secureCookies ? "__Secure-" : ""}novya-hr.callback-url`,
      options: { sameSite: "lax", path: "/", secure: secureCookies },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "Authenticator code", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password)
          throw new DashboardCredentialsError("missing_credentials");

        try {
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": request.headers.get("user-agent") || "NOVYA HR web",
            },
            body: JSON.stringify({
              email,
              password,
              mfaCode: credentials?.mfaCode || undefined,
            }),
            signal: AbortSignal.timeout(15_000),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok || !data?.success || !data?.data)
            throw new DashboardCredentialsError(
              mapAuthErrorCode(data?.message),
            );

          // The HR workspace is only for active HR / Head of People memberships.
          const contextResponse = await fetch(`${API}/hr-experience/context`, {
            headers: { Authorization: `Bearer ${data.data.accessToken}` },
            cache: "no-store",
          });
          const context = await contextResponse.json().catch(() => null);
          const role = normalizeRole(context?.data?.role);
          if (!contextResponse.ok || !isHrRole(role))
            throw new DashboardCredentialsError("role_not_allowed");

          return {
            id: data.data._id,
            _id: data.data._id,
            email: data.data.email,
            role,
            isLead: isHrLead(role) && context?.data?.teamLead === true,
            name: data.data.name,
            profileImage: data.data.profileImage,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          throw new DashboardCredentialsError("auth_service_unavailable");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token._id = user.id as string;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.isLead = user.isLead;
        token.profileImage = user.profileImage;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      if (trigger === "update" && typeof token.accessToken === "string") {
        try {
          const response = await fetch(`${API}/hr-experience/account`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
            cache: "no-store",
          });
          const result = await response.json();
          if (response.ok && result.success && result.data) {
            token.name = result.data.name;
            token.profileImage = result.data.profileImage;
          }
        } catch {
          // Keep the current display profile when the backend is unavailable.
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user._id = token._id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.role = token.role as string;
      session.user.isLead = Boolean(token.isLead);
      session.user.profileImage = token.profileImage as {
        public_id?: string;
        url?: string;
      };
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token?.accessToken : undefined;
      if (token)
        try {
          await fetch(API + "/auth/logout", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          /* Local sign-out still completes if the API is offline. */
        }
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
