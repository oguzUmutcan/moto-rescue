import * as ImagePicker from "expo-image-picker";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { userApi } from "../api/users";
import { auth, storage } from "../config/firebase";

type ProfilePhotoProps = {
  fallbackEmoji: string;
  storagePath: string | null;
  onStoragePathChange: (path: string | null) => void;
  dark?: boolean;
};

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export default function ProfilePhoto({ fallbackEmoji, storagePath, onStoragePathChange, dark = false }: ProfilePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!storagePath) {
      setPhotoUrl(null);
      return;
    }
    getDownloadURL(ref(storage, storagePath))
      .then((url) => { if (active) setPhotoUrl(url); })
      .catch((error) => {
        console.error("Could not load profile photo", error);
        if (active) setPhotoUrl(null);
      });
    return () => { active = false; };
  }, [storagePath]);

  const choosePhoto = async (source: "camera" | "library") => {
    if (busy || !auth.currentUser) return;
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          source === "camera" ? "Camera access required" : "Photo access required",
          `Allow ${source === "camera" ? "camera" : "photo"} access to choose a profile picture.`,
        );
        return;
      }
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_PROFILE_PHOTO_BYTES) {
        Alert.alert("Photo too large", "Choose an image smaller than 5 MB.");
        return;
      }
      const contentType = asset.mimeType ?? "image/jpeg";
      if (!/^image\/(jpeg|png|webp)$/.test(contentType)) {
        Alert.alert("Unsupported photo", "Choose a JPEG, PNG, or WebP image.");
        return;
      }

      setBusy(true);
      const path = `profilePhotos/${auth.currentUser.uid}/avatar`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      if (blob.size > MAX_PROFILE_PHOTO_BYTES) throw new Error("The selected photo is larger than 5 MB.");
      const photoRef = ref(storage, path);
      await uploadBytes(photoRef, blob, { contentType });
      const url = await getDownloadURL(photoRef);
      await userApi.setProfilePhoto(path);
      setPhotoUrl(url);
      onStoragePathChange(path);
    } catch (error) {
      Alert.alert("Could not update photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!storagePath || busy) return;
    setBusy(true);
    try {
      await deleteObject(ref(storage, storagePath)).catch((error: { code?: string }) => {
        if (error.code !== "storage/object-not-found") throw error;
      });
      await userApi.clearProfilePhoto();
      setPhotoUrl(null);
      onStoragePathChange(null);
    } catch (error) {
      Alert.alert("Could not remove photo", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const showActions = () => {
    Alert.alert("Profile photo", undefined, [
      { text: "Take photo", onPress: () => void choosePhoto("camera") },
      { text: "Choose from gallery", onPress: () => void choosePhoto("library") },
      ...(photoUrl ? [{ text: "Remove photo", style: "destructive" as const, onPress: () => void removePhoto() }] : []),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity onPress={showActions} disabled={busy} accessibilityRole="button" accessibilityLabel="Change profile photo">
      <View style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: dark ? "#0d2318" : "#EEF4FF" }}>
        {photoUrl ? <Image source={{ uri: photoUrl }} style={{ width: 72, height: 72 }} /> : <Text style={{ fontSize: 32 }}>{fallbackEmoji}</Text>}
        {busy && <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="white" /></View>}
      </View>
    </TouchableOpacity>
  );
}
