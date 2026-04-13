import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: {
        id: string;
        name: string;
      };
      permissions: string[];
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    sessionToken?: string;
  }
}
