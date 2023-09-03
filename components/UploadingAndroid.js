import { Image, Text, StyleSheet, View, TouchableOpacity } from "react-native";
import ProgressBar from "./ProgressBar";

export function UploadingAndroid({ image, progress }) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        },
      ]}
    >
      <View
        style={{
          width: "70%",
          // Alguns estilos podem nao funcionar no android.
        }}
      >
        <View style={styles.caixa}>
          {image && (
            <Image
              source={{ uri: image }}
              style={{
                width: "40%",
                height: "40%",
                resizeMode: "contain",
                borderRadius: 6,
              }}
            />
          )}
          <Text style={{ fontSize: 12 }}>ENVIANDO PARA O BANCO</Text>
          <ProgressBar progress={progress} />
          <View
            style={{
              height: 1,
              borderWidth: StyleSheet.hairlineWidth,
              width: "100%",
              borderColor: "#000",
            }}
          />
          <TouchableOpacity>
            <Text style={{ fontWeight: "500", color: "#f4a100", fontSize: 17 }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    alignItems: "center",
    paddingVertical: 10,
    rowGap: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000", // Cor da sombra
    shadowOffset: {
      width: 0, // Offset horizontal da sombra
      height: 2, // Offset vertical da sombra
    },
    shadowOpacity: 0.2, // Opacidade da sombra
    shadowRadius: 4, // Raio da sombra
    elevation: 5, // Apenas para Android (elevation é igual à sombra no Android)
  },
});
