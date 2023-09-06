import { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Platform,
  SafeAreaView,
  TextInput,
  Modal,
  View,
} from "react-native";
import { Uploading } from "../components/Uploading";
import Icon from "react-native-vector-icons/FontAwesome";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { UploadingAndroid } from "../components/UploadingAndroid";

export default function Home() {
  const [texto, setTexto] = useState("");
  const [texto2, setTexto2] = useState("");
  const [modalVisible, setModalVisible] = useState(true);

  const [image, setImage] = useState("");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "imagens"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("NOVO ARQUIVO", change.doc.data());
          setFiles((prevFiles) => [...prevFiles, change.doc.data()]);
        }
      });
    });
    return () => unsubscribe();
  }, []);

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // manda a imagem
      await uploadImage(result.assets[0].uri, "image");
    }
  }

  async function uploadImage(uri, fileType) {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `${texto}/${texto2}/`);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Evento
    uploadTask.on(
      "mudança de estado",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("upload esta " + progress + "% feito");
        setProgress(progress.toFixed());
      },
      (error) => {
        // pega o erro
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("disponivel em: ", downloadURL);
          // save record
          await saveRecord(fileType, downloadURL, new Date().toISOString());
          setImage("");
        });
      }
    );
  }

  async function saveRecord(fileType, url, createdAt) {
    try {
      const docRef = await addDoc(collection(db, "imagens"), {
        fileType,
        url,
        createdAt,
      });
      console.log("Documento salvo com sucesso", docRef.id);
    } catch (e) {
      console.log(e);
    }
  }

  const handleInputChange = (text) => {
    setTexto(text);
  };

  const handleInputChange2 = (text) => {
    setTexto2(text);
  };

  const abrirModal = () => {
    setModalVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
  };

  const Confirmar = () => {
    console.log("Usuário clicou em Feito");
    setModalVisible(false);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        margin: 0,
        marginTop: "8%",
      }}
    >
      <Text style={styles.titulo}>FOTOS NO BANCO</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => {
          return (
            <Image
              source={{ uri: item.url }}
              style={{ width: "34%", height: 130 }}
            />
          );
        }}
        numColumns={3}
        contentContainerStyle={{ gap: 2 }}
        columnWrapperStyle={{ gap: 2 }}
      />
      {image &&
        (Platform.OS === "ios" ? (
          <Uploading image={image} progress={progress} />
        ) : (
          <UploadingAndroid image={image} progress={progress} />
        ))}
      <TouchableOpacity
        onPress={abrirModal}
        style={{
          position: "absolute",
          bottom: 170,
          right: 30,
          width: 55,
          height: 55,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 25,
        }}
      >
        <Icon name="pencil" size={30} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={pickImage}
        style={{
          position: "absolute",
          bottom: 90,
          right: 30,
          width: 55,
          height: 55,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 25,
        }}
      >
        <Icon name="image" size={30} color="white" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Digite o nome da Categoria</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleInputChange}
              value={texto}
            />
            <Text style={styles.modalText}>Digite o nome do produto</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleInputChange2}
              value={texto2}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={Confirmar}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={{ fontSize: 16 }}>Feito</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  titulo: {
    alignSelf: "center",
    fontSize: 15,
    margin: 10,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: "80%",
    padding: 1,
    marginBottom: 20,
    backgroundColor: "rgba(0, 0, 102, 0.3)",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 1)",
    shadowOffset: { width: -9, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 15,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "45%",
  },
  confirmButton: {
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "transparent", // Defina o fundo como transparente
    borderWidth: 2, // Adicione uma borda com largura 2
    borderColor: "green", // Cor da borda verde
    margin: 9,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "green", // Adicione uma sombra verde
    shadowOffset: { width: -5, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 6, // Elevação para sombra no Android
  },
});
