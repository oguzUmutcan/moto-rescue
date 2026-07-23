import { getDownloadURL, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { Image, Text, View } from "@/components/localized-native";
import { storage } from "../config/firebase";

type ProfileAvatarProps = {
  storagePath: string | null;
  size?: number;
  fallbackEmoji?: string;
};

export default function ProfileAvatar({ storagePath, size = 48, fallbackEmoji = "🏍️" }: ProfileAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPhotoUrl(null);
    if (!storagePath) return () => { active = false; };
    getDownloadURL(ref(storage, storagePath))
      .then((url) => { if (active) setPhotoUrl(url); })
      .catch((error: { code?: string }) => {
        if (error.code !== "storage/object-not-found") {
          console.warn("Could not load profile photo", error);
        }
      });
    return () => { active = false; };
  }, [storagePath]);

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#EEF4FF" }}>
      {photoUrl
        ? <Image source={{ uri: photoUrl }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.5 }}>{fallbackEmoji}</Text>}
    </View>
  );
}
