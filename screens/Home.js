import { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Platform,
  SafeAreaView,
} from "react-native";
import { Uploading } from "../components/Uploading";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { UploadingAndroid } from "../components/UploadingAndroid";

export default function Home() {
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

    const storageRef = ref(storage, "Imagens/");
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
});
