//external
import React, { Component } from "react";
import compareVersions from "compare-versions";
import { Alert, AppState } from "react-native";
// import { connect } from "react-redux";
import { Constants, Updates } from "expo";

//internal
import EnforceUpdateScreen from "./version.updates.enforce.screen";
import updates from "./version.updates.util";

type TextObject = {
  "appUpdate.skip": string,
  "appUpdate.update": string,
  "appUpdate.title": string,
  "appUpdate.newVersion": string
};

type VersionInfo = {
  required_version: string,
  lastest_native_version: string,
  whats_new: string
};

type Props = {
  /**
   * text object with copy (optional)
   */
  text?: TextObject,

  /**
   * allowskip. Defaults to false.
   */
  allowSkip?: boolean,

  /**
   * optional, skipVersion reducer taking a string of new version that has been skipped
   */
  skipVersion?: string => void,

  /**
   * optional,skippedVersion is the last skipped version the user skipped
   */
  skippedVersion?: string,

  /**
   * when true, also do store updates by checking an endpoint to see if there's a new version in the app store
   */
  storeUpdates?: boolean,

  /**
   * When true, users can't use the app with this version. This can be used when a new native version must be enforced. All users will directly be directed to the app store.
   */
  enforceStoreNow?: boolean,
  /**
   * fetch method to get verison info. only needed when storeUpdates=true.
   */
  getVersionInfo?: () => Promise<{ data: VersionInfo }>,

  /**
   * isTesting true for testing / debugging purposes is non-dev environments.
   */
  isTesting?: boolean
};

type State = {
  /**
   * appState (background, active, etc.) is automatically updated
   */
  appState: string,

  /**
   * gotten from backend when coming from background or new appstart (if store pudates is turned on)
   */
  latestNativeVersion?: string,
  whatsNew?: string,
  enforceUpdate: boolean
};

/**
 * This wrapper works out of the box without any props with expo. Props provide possibility to skipping versions and to enforce updates of store versions.
 *
 * NB: In addition to setting the right props, you must define expo.version to compare it against your backend or enable version skipping.
 *
 * NB: When you don't have a backend, or you don't want to keep this endpoint up to date, it's still easy to enforce app updates of a new native version. Just put the new native version on a new publish-channel and add the enforceStoreNow prop to the wrapper.
 *
 * Todo:
 * - Separation between expo-checking and backend-checking (better naming)
 * - Repeated check (every minute)
 * - Also check while app is in background
 * - Possibility to provide function to notify user in background (e.g. push notification or an endpoint to send email)
 * - Make it easier to provide user with details of new app features when the user installs an update (compare differences between app versions)
 *
 *
 */

class VersionUpdatesWrapper extends Component<Props, State> {

  state = {
    lastestNativeVersion: undefined,
    whatsNew: undefined,
    appState: AppState.currentState,
    enforceUpdate: false
  };

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);

    this.checkForUpdates();
  }

  handleAppStateChange = (nextAppState: string): void => {
    if (this.state.appState != "active" && nextAppState === "active") {
      this.checkForUpdates();
    }

    this.setState({ appState: nextAppState });
  };

  async checkForUpdates() {
    const { isTesting, storeUpdates } = this.props;

    if (storeUpdates) {
      // API Endpoint.
      const versionInfo = await this.getVersionInfo();

      if (
        versionInfo &&
        compareVersions(
          Constants.manifest.version,
          versionInfo.required_version
        ) === -1
      ) {
        this.setState({
          latestNativeVersion: versionInfo.latest_native_version,
          whatsNew: versionInfo.whats_new,
          enforceUpdate: true
        });

        return;
      }
    }

    // Expo updates. Only if not in dev mode.

    if (!__DEV__) {
      const latestIsNewer = await this.latestIsNewer();

      if (latestIsNewer) {
        Updates.fetchUpdateAsync().then(({ isNew, manifest }) => {
          if (isNew) {
            this.showVersionUpdateAlert(manifest.latest_version);
          } else {
            if (isTesting) {
              Alert.alert(
                "Strange",
                "Hmm strange. We thought there was a newer, later version, but it proved not to be the case"
              );
            }
          }
        });
      }
    }
  }

  async getVersionInfo() {
    return (await this.props.getVersionInfo()).data;
  }

  async latestIsNewer() {
    const { skippedVersion, allowSkip } = this.props;

    const { isAvailable, manifest } = await Updates.checkForUpdateAsync();

    if (isAvailable) {
      const latestOTA = manifest?.latest_version;
      return !allowSkip || compareVersions(skippedVersion, latestOTA) === -1;
    }

    return false;
  }

  showVersionUpdateAlert(latestVersion: string, latestNativeVersion: string) {
    const { text, skipVersion, allowSkip } = this.props;

    const buttons = [];

    if (allowSkip) {
      buttons.push({
        text: text?.["appUpdate.skip"] || "Skip",
        onPress: () => latestVersion && skipVersion(latestVersion),
        style: "cancel"
      });
    }

    buttons.push({
      text: text?.["appUpdate.update"] || "OK",
      onPress: () => updates.performUpdate(latestNativeVersion)
    });

    Alert.alert(
      text?.["appUpdate.title"] || "App update downloaded",
      text?.["appUpdate.newVersion"] ||
        "A new version of the app has just been downloaded. Your app will refresh now.",
      buttons,
      {
        cancelable: false
      }
    );
  }

  render() {
    const { children, enforceStoreNow, enforceWhatsNew } = this.props;
    const { enforceUpdate, latestNativeVersion, whatsNew } = this.state;

    return enforceUpdate || enforceStoreNow ? (
      <EnforceUpdateScreen
        enforceStoreNow={enforceStoreNow}
        latestNativeVersion={latestNativeVersion}
        whatsNew={enforceWhatsNew || whatsNew}
      />
    ) : (
      children
    );
  }

}

export default VersionUpdatesWrapper;
