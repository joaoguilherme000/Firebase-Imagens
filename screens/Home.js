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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { UploadingAndroid } from "../components/UploadingAndroid";

export default function Home() {
  const [texto, setTexto] = useState("");
  const [texto2, setTexto2] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

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
    console.log("Usuário clicou em Sim");
    setModalVisible(false);
  };
  const Negar = () => {
    console.log("Usuário clicou em Nao");
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
        <Ionicons name="image" size={24} color="white" />
      </TouchableOpacity>
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
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Digite o nome da Categoria:</Text>
            <TextInput
              style={styles.input}
              onChangeText={handleInputChange}
              value={texto}
            />
            <Text style={styles.modalText}>Digite o nome do produto:</Text>
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
                <Text style={styles.buttonText}>Sim</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={Negar}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.buttonText}>Não</Text>
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
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  digitado: {
    color: "#f44",
    fontSize: 15,
    marginBottom: 15,
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
  buttonText: {
    fontSize: 16,
    color: "white",
  },
  confirmButton: {
    backgroundColor: "green",
    margin: 15,
  },
  cancelButton: {
    backgroundColor: "red",
    margin: 15,
  },
});
