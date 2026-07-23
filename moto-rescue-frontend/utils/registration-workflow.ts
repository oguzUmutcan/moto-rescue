type RegistrationInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

type RegistrationDependencies<TUser> = {
  createAuthUser: (email: string, password: string) => Promise<TUser>;
  updateAuthProfile: (user: TUser, name: string) => Promise<void>;
  createBackendProfile: (name: string, phone: string) => Promise<unknown>;
  deleteAuthUser: (user: TUser) => Promise<void>;
};

export async function createRegistrationAccount<TUser>(
  input: RegistrationInput,
  dependencies: RegistrationDependencies<TUser>,
) {
  let user: TUser | null = null;
  try {
    user = await dependencies.createAuthUser(input.email, input.password);
    await dependencies.updateAuthProfile(user, input.name.trim());
    await dependencies.createBackendProfile(input.name.trim(), input.phone);
  } catch (error) {
    if (user) {
      await dependencies.deleteAuthUser(user).catch(() => undefined);
    }
    throw error;
  }
}

export function registrationErrorMessage(error: unknown) {
  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "auth/email-already-in-use"
  ) {
    return "An account already exists for this email. Sign in or reset your password.";
  }
  return error instanceof Error ? error.message : "Please try again.";
}
