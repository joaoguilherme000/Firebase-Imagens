import { View, Text } from "react-native";
export default function EmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>NENHUMA FOTO AQUI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titulo: {
    height: "50%",
    width: "50%",
  },
});
