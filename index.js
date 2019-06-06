//external
import React, { Component } from "react";
import compareVersions from "compare-versions";
import { Alert, AppState } from "react-native";
import { Updates } from "expo";

//internal
import EnforceUpdateScreen from "./version.updates.enforce.screen";
import updates from "./version.updates.util";

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
   * When true, users can't use the app with this version. This can be used when a new native version must be enforced. All users will directly be directed to the app store.
   */
  enforceStoreNow?: boolean,

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
  whatsNew?: string
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
 * - Keep skippedVersion state in here so you don't need all these props. Use `aSyncStorage`.
 * - Create function that returns true if there is a newer version available for download that can be used anywhere in the app. Also a function to perform the update. Expose them in index as non-default exports.
 * - Provide simple UI for a component that uses the above two and is shown or not based on that. Style editable, but a copy is just as easy. kiss.
 *
 *
 * #toRemember - I'm getting more and more into feature separation. It's pretty cool. Dyme may never need to do this because they are creating a monolith but I think it's actually useful for any codebase. To have truly everything about one feature in one file. That's REALLY feature separation. That's why you need no default exports, but just exports. I think there is much much ground to win here. I will print out my codebase and go over it very thoroughly in the park.
 *
 * #toRemember - This wrapper can block the children and show the EnforceUpdateScreen instead. This is okay because you can't navigate away from this screen, so there is no navigational transition necessary.
 *
 *
 * More cool additions
 * - Repeated check (every minute)
 * - Also check while app is in background
 * - Possibility to provide function to notify user in background (e.g. push notification or an endpoint to send email)
 * - Make it easier to provide user with details of new app features when the user installs an update (compare differences between app versions)
 *
 * 100% CODEBASE FIRST DEVELOPMENT + FLOW STATE OPTIMIZATION = EPIC GROWTH
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
    const { isTesting } = this.props;

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
    const { latestNativeVersion, whatsNew } = this.state;

    return enforceStoreNow ? (
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

export default VersionUpdatesWrapper;
