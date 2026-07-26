const { withAppBuildGradle } = require("expo/config-plugins");

const CMAKE_OBJECT_PATH_ARGUMENT = "-DCMAKE_OBJECT_PATH_MAX=240";
const DEFAULT_CONFIG_ANCHOR = "    defaultConfig {\n";
const CMAKE_CONFIG = [
  "        // Keep generated New Architecture object paths below Windows MAX_PATH.",
  "        externalNativeBuild {",
  "            cmake {",
  `                arguments "${CMAKE_OBJECT_PATH_ARGUMENT}"`,
  "            }",
  "        }",
  "",
].join("\n");

module.exports = function withCmakeObjectPathLimit(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      throw new Error("MotoRescue's CMake path-limit plugin requires a Groovy app build file.");
    }

    const contents = modConfig.modResults.contents;
    if (contents.includes(CMAKE_OBJECT_PATH_ARGUMENT)) {
      return modConfig;
    }
    if (!contents.includes(DEFAULT_CONFIG_ANCHOR)) {
      throw new Error("Could not locate android.defaultConfig in app/build.gradle.");
    }

    modConfig.modResults.contents = contents.replace(
      DEFAULT_CONFIG_ANCHOR,
      DEFAULT_CONFIG_ANCHOR + CMAKE_CONFIG,
    );
    return modConfig;
  });
};
