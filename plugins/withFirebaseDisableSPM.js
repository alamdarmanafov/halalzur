const { withPodfile } = require('@expo/config-plugins');

/**
 * react-native-firebase resolves the Firebase iOS SDK through Swift
 * Package Manager by default AND CocoaPods also links it — both copies
 * end up in the same Xcode project, producing hundreds of duplicate
 * linker symbols ("326 duplicate symbols"). Setting this Ruby global
 * before any target block (the fix react-native-firebase itself
 * documents) makes CocoaPods the only source, so `expo prebuild` needs
 * to keep re-adding this on every regenerate rather than relying on a
 * hand-edited ios/Podfile that gets wiped each time.
 */
module.exports = function withFirebaseDisableSPM(config) {
  return withPodfile(config, (config) => {
    const marker = '$RNFirebaseDisableSPM = true';
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = `${marker}\n${config.modResults.contents}`;
    }
    return config;
  });
};
