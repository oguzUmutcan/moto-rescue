import {
  createRegistrationAccount,
  registrationErrorMessage,
} from "@/utils/registration-workflow";

describe("registration workflow", () => {
  test("removes the Firebase user when backend profile creation fails", async () => {
    const user = { uid: "new-user" };
    const deleteAuthUser = jest.fn().mockResolvedValue(undefined);

    await expect(createRegistrationAccount(
      { email: "new@example.com", password: "password", name: " New User ", phone: "+90555" },
      {
        createAuthUser: jest.fn().mockResolvedValue(user),
        updateAuthProfile: jest.fn().mockResolvedValue(undefined),
        createBackendProfile: jest.fn().mockRejectedValue(new Error("Backend unavailable")),
        deleteAuthUser,
      },
    )).rejects.toThrow("Backend unavailable");

    expect(deleteAuthUser).toHaveBeenCalledWith(user);
  });

  test("does not delete an existing account when Firebase rejects duplicate email", async () => {
    const duplicateError = { code: "auth/email-already-in-use" };
    const deleteAuthUser = jest.fn();

    await expect(createRegistrationAccount(
      { email: "used@example.com", password: "password", name: "User", phone: "+90555" },
      {
        createAuthUser: jest.fn().mockRejectedValue(duplicateError),
        updateAuthProfile: jest.fn(),
        createBackendProfile: jest.fn(),
        deleteAuthUser,
      },
    )).rejects.toBe(duplicateError);

    expect(deleteAuthUser).not.toHaveBeenCalled();
    expect(registrationErrorMessage(duplicateError))
      .toBe("An account already exists for this email. Sign in or reset your password.");
  });
});
