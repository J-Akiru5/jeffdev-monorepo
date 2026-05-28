"use server";

import { revalidatePath } from "next/cache";
import { getCollection } from "@syntaxure-labs/db/cosmos";

export async function overrideUserTier(
  userId: string,
  tier: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const usersCollection = await getCollection("users");
    const { ObjectId } = await import("mongodb");

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { tier, updatedAt: new Date().toISOString() } },
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[users] overrideUserTier error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to override tier",
    };
  }
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const usersCollection = await getCollection("users");
    const { ObjectId } = await import("mongodb");

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status: newStatus, updatedAt: new Date().toISOString() } },
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("[users] toggleUserStatus error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

export async function clearAppCache(): Promise<{ success: boolean; message: string }> {
  revalidatePath("/");
  return { success: true, message: "Cache cleared successfully. All pages will be revalidated on next request." };
}
