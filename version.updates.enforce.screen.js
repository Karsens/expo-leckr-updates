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

  renderButton() {
    const { latestNativeVersion, text } = this.props;

    return (
      <Button
        style={{ margin: 20 }}
        title={text?.["appUpdate.performUpdate"] || "Perform update"}
        onPress={() => updates.performUpdate(latestNativeVersion)}
      />
    );
  }

  render() {
    const { whatsNew, enforceStoreNow, text } = this.props;

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {enforceStoreNow && (
          <Text>
            {text?.["appUpdate.outOfDate"] || "Your version is out of date"}
          </Text>
        )}
        <Text>{whatsNew}</Text>
        {this.renderButton()}
      </View>
    );
  }

}

export default EnforceUpdateScreen;
