import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Bell, CheckCheck, ChevronLeft } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityNotification, notificationApi } from "@/api/notifications";
import { notificationRoute } from "@/utils/app-routing";
import { formatDateTime } from "@/localization/i18n";

export default function PassengerNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ActivityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setItems(await notificationApi.list());
    } catch (error) {
      console.error("Could not load activity", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const openItem = async (item: ActivityNotification) => {
    if (!item.readAt) {
      setItems((current) => current.map((entry) =>
        entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry
      ));
      void notificationApi.markRead(item.id).catch((error) => {
        console.error("Could not mark activity as read", error);
      });
    }
    const destination = notificationRoute(item);
    if (destination) router.navigate(destination);
  };

  const markAllRead = async () => {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    try {
      await notificationApi.markAllRead();
    } catch (error) {
      console.error("Could not mark all activity as read", error);
      void load();
    }
  };

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <View className="flex-1 bg-[#F2F2F7]" style={{ paddingTop: insets.top }}>
      <View className="bg-white px-4 h-16 flex-row items-center border-b border-[#E5E5EA]">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Back"
          className="w-10 h-10 rounded-full bg-[#F2F2F7] items-center justify-center"
        >
          <ChevronLeft size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-[20px] font-black text-[#1C1C1E]">Activity</Text>
          <Text className="text-[12px] text-[#8E8E93]">
            {unreadCount ? `${unreadCount} unread` : "You are all caught up"}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllRead}
            accessibilityLabel="Mark all as read"
            className="flex-row items-center px-3 py-2 rounded-xl bg-[#EEF4FF]"
          >
            <CheckCheck size={16} color="#007AFF" />
            <Text className="text-[12px] font-bold text-[#007AFF] ml-1.5">Read all</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16),
            flexGrow: items.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-16 h-16 rounded-full bg-[#EEF4FF] items-center justify-center mb-4">
                <Bell size={28} color="#007AFF" />
              </View>
              <Text className="text-[18px] font-black text-[#1C1C1E]">No activity yet</Text>
              <Text className="text-[13px] text-[#8E8E93] text-center mt-2">
                Rescue updates will stay here even after you dismiss a push notification.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => void openItem(item)}
              activeOpacity={0.75}
              className={`rounded-2xl p-4 mb-3 border ${
                item.readAt
                  ? "bg-white border-[#E5E5EA]"
                  : "bg-[#EEF4FF] border-[#B9D7FF]"
              }`}
            >
              <View className="flex-row items-start">
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${
                  item.readAt ? "bg-[#F2F2F7]" : "bg-[#007AFF]"
                }`}>
                  <Bell size={18} color={item.readAt ? "#8E8E93" : "white"} />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="flex-1 text-[15px] font-black text-[#1C1C1E]">
                      {item.title}
                    </Text>
                    {!item.readAt && <View className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] ml-2" />}
                  </View>
                  <Text className="text-[13px] text-[#636366] mt-1">{item.body}</Text>
                  {item.createdAt && (
                    <Text className="text-[11px] text-[#8E8E93] mt-2">
                      {formatDateTime(item.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
