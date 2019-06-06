/**
 * NB:
 *
 * This is a leftover of what I made for Mypo, Dyme, Bencompare...
 * It's not really useful in Expo projects as you can do without, just close old versions and do everything OTA.
 *
 * However, If I ever need it again, this is a great file to start off with.
 *
 * Separation of Expo OTA update enforcement and backend update enforcement is quite useful though since most of the times you won't need a backend update enforcement.
 */

//external
import React, { Component } from "react";
import compareVersions from "compare-versions";
import { Alert, AppState } from "react-native";
// import { connect } from "react-redux";
import { Constants, Updates } from "expo";

//internal
import EnforceUpdateScreen from "./version.updates.enforce.screen";
import updates from "./version.updates.util";

type VersionInfo = {
  required_version: string,
  lastest_native_version: string,
  whats_new: string
};

type TextObject = {
  "appUpdate.skip": string,
  "appUpdate.update": string,
  "appUpdate.title": string,
  "appUpdate.newVersion": string,
  "appUpdate.performUpdate": string
};

export type Props = {
  /**
   * text object with copy (optional)
   */
  text?: TextObject,

  /**
   * allowskip. Defaults to false.
   */
  allowSkip?: boolean,

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

class StoreUpdatesWrapper extends Component<Props, State> {

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
    const { storeUpdates } = this.props;

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
    const { children, enforceStoreNow, enforceWhatsNew, text } = this.props;
    const { enforceUpdate, latestNativeVersion, whatsNew } = this.state;

    return enforceUpdate ? (
      <EnforceUpdateScreen
        text={text}
        enforceStoreNow={enforceStoreNow}
        latestNativeVersion={latestNativeVersion}
        whatsNew={enforceWhatsNew || whatsNew}
      />
    ) : (
      children
    );
  }

}

export default StoreUpdatesWrapper;
