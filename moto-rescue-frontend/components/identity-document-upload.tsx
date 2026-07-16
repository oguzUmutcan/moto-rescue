import * as ImagePicker from "expo-image-picker";
import { getMetadata, ref, uploadBytes } from "firebase/storage";
import { CheckCircle, UploadCloud } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { userApi, UserProfile } from "../api/users";
import { auth, storage } from "../config/firebase";

type Side = "front" | "back";
type DocumentStatus = UserProfile["identityDocumentStatus"];

type Props = {
  initialStatus: DocumentStatus;
  onSubmitted: (profile: UserProfile) => void;
};

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export default function IdentityDocumentUpload({ initialStatus, onSubmitted }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [uploaded, setUploaded] = useState<Record<Side, boolean>>({ front: false, back: false });
  const [busySide, setBusySide] = useState<Side | null>(null);

  useEffect(() => setStatus(initialStatus), [initialStatus]);

  useEffect(() => {
    if (status !== "pending") return;
    let active = true;
    const refreshStatus = async () => {
      try {
        const profile = await userApi.get();
        if (!active) return;
        setStatus(profile.identityDocumentStatus);
        onSubmitted(profile);
      } catch (error) {
        console.error("Could not refresh document status", error);
      }
    };
    const timer = setInterval(refreshStatus, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status, onSubmitted]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let active = true;
    Promise.all((["front", "back"] as const).map(async (side) => {
      try {
        await getMetadata(ref(storage, `identityDocuments/${uid}/${side}`));
        return [side, true] as const;
      } catch {
        return [side, false] as const;
      }
    })).then((entries) => {
      if (active) setUploaded(Object.fromEntries(entries) as Record<Side, boolean>);
    });
    return () => { active = false; };
  }, [initialStatus]);

  const uploadSide = async (side: Side, source: "camera" | "library") => {
    const uid = auth.currentUser?.uid;
    if (!uid || busySide || status === "verified" || status === "pending") return;
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          source === "camera" ? "Camera access required" : "Photo access required",
          `Allow ${source === "camera" ? "camera" : "photo"} access to upload your driver's license.`,
        );
        return;
      }
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: source === "library",
        quality: 0.9,
      };
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled) return;
      const asset = result.assets[0];
      const contentType = asset.mimeType ?? "image/jpeg";
      if (!/^image\/(jpeg|png|webp)$/.test(contentType)) {
        Alert.alert("Unsupported image", "Choose a JPEG, PNG, or WebP image.");
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_DOCUMENT_BYTES) {
        Alert.alert("Image too large", "Each document image must be smaller than 10 MB.");
        return;
      }

      setBusySide(side);
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      if (blob.size > MAX_DOCUMENT_BYTES) throw new Error("The selected image is larger than 10 MB.");
      const path = `identityDocuments/${uid}/${side}`;
      await uploadBytes(ref(storage, path), blob, { contentType });

      const next = { ...uploaded, [side]: true };
      setUploaded(next);
      if (next.front && next.back) {
        const profile = await userApi.submitIdentityDocument(
          `identityDocuments/${uid}/front`,
          `identityDocuments/${uid}/back`,
        );
        setStatus(profile.identityDocumentStatus);
        onSubmitted(profile);
        Alert.alert("Submitted for review", "Your document is private and its status is now pending.");
      }
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusySide(null);
    }
  };

  const chooseSource = (side: Side) => {
    if (locked || busySide !== null) return;
    Alert.alert("Add license photo", side === "front" ? "Select the front side source." : "Select the back side source.", [
      { text: "Take photo", onPress: () => void uploadSide(side, "camera") },
      { text: "Choose from gallery", onPress: () => void uploadSide(side, "library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const locked = status === "pending" || status === "verified";
  const statusLabel = status === "verified" ? "Verified" : status === "pending" ? "Pending review" : status === "rejected" ? "Rejected — upload again" : "Not submitted";
  const statusColor = status === "verified" ? "#34C759" : status === "pending" ? "#FF9500" : status === "rejected" ? "#FF3B30" : "#8E8E93";

  return (
    <View>
      <Text style={{ color: statusColor, fontSize: 13, fontWeight: "800", marginBottom: 10 }}>{statusLabel}</Text>
      {(["front", "back"] as const).map((side) => (
        <TouchableOpacity
          key={side}
          onPress={() => chooseSource(side)}
          disabled={locked || busySide !== null}
          style={{ minHeight: 58, borderWidth: 2, borderStyle: "dashed", borderColor: uploaded[side] ? "#34C759" : "#C7C7CC", borderRadius: 14, paddingHorizontal: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", backgroundColor: uploaded[side] ? "#EDFAF3" : "#FAFAFA" }}
        >
          {busySide === side ? <ActivityIndicator color="#34C759" /> : uploaded[side] ? <CheckCircle size={21} color="#34C759" /> : <UploadCloud size={21} color="#8E8E93" />}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: uploaded[side] ? "#248A3D" : "#1C1C1E" }}>{side === "front" ? "License front" : "License back"}</Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>{uploaded[side] ? "Uploaded securely" : "Use camera or choose from gallery"}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 12, lineHeight: 17, color: "#8E8E93" }}>Both sides are required. Images are private and limited to 10 MB each.</Text>
    </View>
  );
}
