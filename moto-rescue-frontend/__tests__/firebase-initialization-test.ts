describe("Firebase initialization", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-key";
  });

  test("initializes native auth with AsyncStorage persistence for a new app", () => {
    const app = { name: "app" };
    const persistence = { type: "async-storage" };
    const initializeAuth = jest.fn(() => ({ currentUser: null }));
    const getAuth = jest.fn();
    const getReactNativePersistence = jest.fn(() => persistence);

    jest.doMock("react-native", () => ({ Platform: { OS: "android" } }));
    jest.doMock("@react-native-async-storage/async-storage", () => ({ storage: true }));
    jest.doMock("firebase/app", () => ({
      getApps: () => [],
      initializeApp: () => app,
      getApp: jest.fn(),
    }));
    jest.doMock("firebase/auth", () => ({
      getAuth,
      initializeAuth,
      getReactNativePersistence,
    }));
    jest.doMock("firebase/storage", () => ({ getStorage: () => ({}) }));

    jest.isolateModules(() => {
      require("@/config/firebase");
    });

    expect(getReactNativePersistence).toHaveBeenCalledTimes(1);
    expect(initializeAuth).toHaveBeenCalledWith(app, { persistence });
    expect(getAuth).not.toHaveBeenCalled();
  });

  test("uses browser auth initialization on web", () => {
    const app = { name: "app" };
    const getAuth = jest.fn(() => ({ currentUser: null }));
    const initializeAuth = jest.fn();

    jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
    jest.doMock("@react-native-async-storage/async-storage", () => ({}));
    jest.doMock("firebase/app", () => ({
      getApps: () => [],
      initializeApp: () => app,
      getApp: jest.fn(),
    }));
    jest.doMock("firebase/auth", () => ({
      getAuth,
      initializeAuth,
      getReactNativePersistence: jest.fn(),
    }));
    jest.doMock("firebase/storage", () => ({ getStorage: () => ({}) }));

    jest.isolateModules(() => {
      require("@/config/firebase");
    });

    expect(getAuth).toHaveBeenCalledWith(app);
    expect(initializeAuth).not.toHaveBeenCalled();
  });
});
