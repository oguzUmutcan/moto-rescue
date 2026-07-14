import React, { createContext, useContext, useState } from "react";

export type RegistrationDraft = {
  name: string;
  email: string;
  password: string;
  phone: string;
  dialCode: string;
};

type RegistrationContextValue = {
  draft: RegistrationDraft | null;
  setDraft: (draft: RegistrationDraft) => void;
  clearDraft: () => void;
};

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function RegistrationProvider({ children }: React.PropsWithChildren) {
  const [draft, setDraftState] = useState<RegistrationDraft | null>(null);

  return (
    <RegistrationContext.Provider
      value={{ draft, setDraft: setDraftState, clearDraft: () => setDraftState(null) }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const value = useContext(RegistrationContext);
  if (!value) {
    throw new Error("useRegistration must be used inside RegistrationProvider");
  }
  return value;
}
