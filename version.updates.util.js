// @flow
import { Constants, Updates } from "expo";
import compareVersions from "compare-versions";
import { Linking, Platform } from "react-native";

export default {
  performUpdate(latestNativeVersion: string) {
    const { manifest } = Constants;

    const needAppStore =
      !latestNativeVersion ||
      compareVersions(manifest.version, latestNativeVersion) === -1;

    if (needAppStore) {
      const storeLink =
        Platform.OS === "ios"
          ? "https://itunes.apple.com/us/app/dunbar/id1457448974?l=nl&ls=1&mt=8"
          : "https://play.google.com/store/apps/details?id=com.progenworks.dunbar1&hl=en";

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
