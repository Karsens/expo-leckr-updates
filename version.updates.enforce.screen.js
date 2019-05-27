// @flow
import React, { PureComponent } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import updates from "./version.updates.util";

/* communify:

  renderNewVersionAvailable() {
    const { serverInfo } = this.props.data;

    return (
      <ScrollView
        style={{ flex: 1, paddingVertical: 50 }}
        contentContainerStyle={styles.container}
      >
        <Text style={{ fontWeight: "bold" }}>
          v{serverInfo.version} is available!
        </Text>
        <Text style={{ fontSize: 100 }}> 🙌 </Text>
        <Button title="Download now" onPress={() => Util.reload()} />

        {serverInfo.whatsnew ? <Text>{serverInfo.whatsnew}</Text> : null}
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }*
*/
type Props = {
  latestNativeVersion: string,
  whatsNew?: string,
  t: any
};

class EnforceUpdateScreen extends PureComponent<Props> {

  renderButton() {
    const { latestNativeVersion, t } = this.props;

    return (
      <Button
        // color={colors.primary.medium}
        title={t("appUpdate.update")}
        onPress={() => updates.performUpdate(latestNativeVersion)}
      />
    );
  }

  render() {
    const { whatsNew, enforceStoreNow } = this.props;

    return (
      <View>
        {enforceStoreNow && <Text>Your version is out of date</Text>}
        <Text>{whatsNew}</Text>
      </View>
    );
    // (
    //   <Card title={t("appUpdate.title")} footer={this.renderButton()}>
    //     <T k="appUpdate.versionTooOld" style={styles.text} />
    //     {whatsNew && <Text style={styles.whatsNew}>{whatsNew}</Text>}
    //   </Card>
    // );
  }

}

const styles = StyleSheet.create({
  text: {
    marginVertical: 32
  },
  whatsNew: {
    marginBottom: 32
  }
});

export default EnforceUpdateScreen;
