import { PtuneSyncUriClient } from "./PtuneSyncUriClient";

type AuthData = {
  auth: {
    authenticated: boolean;
    email: string | null;
    expires_at?: string;
  };
};

export class PtuneSyncUriAuthService {
  constructor(private readonly client: PtuneSyncUriClient) {}

  async status(): Promise<{ authenticated: boolean; email: string | null }> {
    const envelope = await this.client.authStatus<AuthData>();

    if (!envelope.data?.auth) {
      throw new Error("Invalid auth status response");
    }

    return {
      authenticated: envelope.data.auth.authenticated,
      email: envelope.data.auth.email ?? null,
    };
  }

  async login(): Promise<void> {
    const envelope = await this.client.authLogin<AuthData>();

    if (!envelope.data?.auth?.authenticated) {
      throw new Error(
        envelope.error?.message ?? "Login did not complete successfully",
      );
    }
  }
}
