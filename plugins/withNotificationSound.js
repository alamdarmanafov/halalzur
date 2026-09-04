const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// A push notification's sound is played by the OS itself, not by app JS —
// unlike assets/sounds/success.wav's in-app use (expo-audio's
// useAudioPlayer in PremiumSuccessOverlay), the OS can only find it if the
// file is bundled as a native resource with this exact name, which
// `require()`/Metro asset bundling never does. FCM payloads then reference
// it by name (apns.payload.aps.sound on iOS, notification.sound on
// Android — see admin-panel/lib/firebaseAdmin.js's NOTIFICATION_SOUND).
const SOUND_FILE = 'appsound.wav';
const SOUND_SRC = path.join(__dirname, '..', 'assets', 'sounds', SOUND_FILE);

function withNotificationSoundIOS(config) {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosDir = path.join(config.modRequest.platformProjectRoot, config.modRequest.projectName);
      fs.mkdirSync(iosDir, { recursive: true });
      fs.copyFileSync(SOUND_SRC, path.join(iosDir, SOUND_FILE));
      return config;
    },
  ]);

  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    const filePath = `${projectName}/${SOUND_FILE}`;
    // The `xcode` library's addResourceFile() unconditionally looks up a
    // group literally named "Resources" to decide whether to rewrite the
    // file's path — Expo's generated project has no such group (it nests
    // resources directly under the project-name group instead), so that
    // lookup returns null and the library crashes reading `.path` off it.
    // A harmless empty placeholder group satisfies the lookup without
    // otherwise appearing anywhere in the project.
    if (!project.pbxGroupByName('Resources')) {
      project.addPbxGroup([], 'Resources');
    }
    if (!project.hasFile(filePath)) {
      project.addResourceFile(filePath, { target: project.getFirstTarget().uuid });
    }
    return config;
  });
}

function withNotificationSoundAndroid(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      // Android notification sounds are referenced by raw-resource name
      // (no extension, lowercase/underscore only) — "success.wav" here
      // becomes resource name "success", matched in
      // admin-panel/lib/broadcast.js's Android payload.
      const rawDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(SOUND_SRC, path.join(rawDir, SOUND_FILE));
      return config;
    },
  ]);
}

module.exports = function withNotificationSound(config) {
  config = withNotificationSoundIOS(config);
  config = withNotificationSoundAndroid(config);
  return config;
};
