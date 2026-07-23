import {
  formatDate,
  setActiveLanguage,
  translate,
  translateError,
} from "@/localization/i18n";

afterEach(() => setActiveLanguage("en"));

describe("localization", () => {
  test("keeps English source text unchanged", () => {
    setActiveLanguage("en");
    expect(translate("Get Started")).toBe("Get Started");
  });

  test("translates static, multiline, and dynamic Turkish text", () => {
    setActiveLanguage("tr");
    expect(translate("Get Started")).toBe("Başlayın");
    expect(translate("  Enter your registered email address to receive a password reset\nlink.  "))
      .toContain("Şifre sıfırlama bağlantısı");
    expect(translate("12 reviews · 34 rescues")).toBe("12 değerlendirme · 34 yardım");
  });

  test("localizes known Firebase errors and hides unknown English errors in Turkish", () => {
    setActiveLanguage("tr");
    expect(translateError("FirebaseError: Firebase: Error (auth/email-already-in-use)."))
      .toBe("Bu e-posta adresi zaten kullanımda.");
    expect(translateError("An unexpected SDK implementation detail"))
      .toBe("Bir sorun oluştu. Lütfen tekrar deneyin.");
  });

  test("formats dates using the active locale", () => {
    setActiveLanguage("tr");
    expect(formatDate(new Date(2026, 6, 23), { month: "long" })).toBe("Temmuz");
  });
});
