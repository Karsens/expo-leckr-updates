// @flow
import { Constants, Updates } from "expo";
import compareVersions from "compare-versions";
import { Linking, Platform } from "react-native";

export default {
  performUpdate(latestNativeVersion: string) {
    const { manifest } = Constants;

    const needAppStore =
      compareVersions(manifest.version, latestNativeVersion) === -1;

    if (needAppStore) {
      const storeLink =
        Platform.OS === "ios"
          ? manifest.ios.appStoreUrl
          : manifest.android.playStoreUrl;

      Linking.canOpenURL(storeLink).then(supported => {
        if (supported) {
          Linking.openURL(storeLink);
        }
      });
    } else {
      Updates.reload();
    }
  }
};
