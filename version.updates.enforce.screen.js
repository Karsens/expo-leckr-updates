// @flow
import React, { PureComponent } from "react";
import { View, Text, Button } from "react-native";
import updates from "./version.updates.util";

type Props = {
  enforceStoreNow?: boolean,
  latestNativeVersion: string,
  whatsNew?: string,
  text: Object
};

class EnforceUpdateScreen extends PureComponent<Props> {

  render() {
    const { latestNativeVersion, whatsNew, enforceStoreNow, text } = this.props;

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {enforceStoreNow && (
          <Text>
            {text?.["appUpdate.outOfDate"] ||
              "This version is outdated. A new version can be downloaded from the app store."}
          </Text>
        )}
        <Text>{whatsNew}</Text>

        <Button
          style={{ margin: 20 }}
          title={text?.["appUpdate.performUpdate"] || "Perform update"}
          onPress={() => updates.performUpdate(latestNativeVersion)}
        />
      </View>
    );
  }

}

export default EnforceUpdateScreen;
