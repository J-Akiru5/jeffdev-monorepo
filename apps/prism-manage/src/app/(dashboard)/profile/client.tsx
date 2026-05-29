"use client";

/**
 * ProfilePageClient
 * -----------------
 * Client component that bridges the server-fetched profile data with the shared
 * ProfileEditor component. Provides the app-specific save/upload/delete callbacks.
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ProfileEditor,
  type ProfileEditorData,
} from "@syntaxure/ui";
import { createClient } from "@/lib/supabase/browser";
import { updateProfile, changePassword, updateAvatarUrl } from "@/app/actions/profile";

interface ProfilePageClientProps {
  initialData: ProfileEditorData;
}

export function ProfilePageClient({ initialData }: ProfilePageClientProps) {
  const router = useRouter();

  const handleSave = useCallback(
    async (data: {
      fullName: string;
      bio: string;
      companyName: string;
      phone: string;
      timezone: string;
    }) => {
      const result = await updateProfile(data);
      return { success: result.success ?? false, error: result.error };
    },
    [],
  );

  const handleChangePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const result = await changePassword(currentPassword, newPassword);
      return { success: result.success ?? false, error: result.error };
    },
    [],
  );

  const handleUploadAvatar = useCallback(async (file: File) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { url: "", error: "Not authenticated" };

      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        const msg = uploadError.message?.toLowerCase() || "";
        if (msg.includes("bucket") && msg.includes("not found")) {
          return {
            url: "",
            error:
              "Avatar storage is not configured. Please ask your admin to create an 'avatars' bucket in Supabase Storage.",
          };
        }
        return { url: "", error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const result = await updateAvatarUrl(publicUrl);
      if (result.error) return { url: "", error: result.error };

      router.refresh();
      return { url: publicUrl };
    } catch (err) {
      return {
        url: "",
        error: err instanceof Error ? err.message : "Failed to upload avatar",
      };
    }
  }, [router]);

  const handleRemoveAvatar = useCallback(async () => {
    const result = await updateAvatarUrl(null);
    router.refresh();
    return { success: result.success ?? false, error: result.error };
  }, [router]);

  return (
    <ProfileEditor
      initialData={initialData}
      onSave={handleSave}
      onChangePassword={handleChangePassword}
      onUploadAvatar={handleUploadAvatar}
      onRemoveAvatar={handleRemoveAvatar}
    />
  );
}
