/**
 * Test Mux Integration
 *
 * Quick script to verify Mux credentials work
 *
 * Usage:
 *   npx tsx scripts/test-mux.ts
 */

import Mux from "@mux/mux-node";

async function testMux() {
  console.log("🧪 Testing Mux Integration...\n");

  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.error("❌ Mux credentials not found!");
    console.error("\nPlease add to .env.local:");
    console.error("  MUX_TOKEN_ID=your-token-id");
    console.error("  MUX_TOKEN_SECRET=your-token-secret");
    process.exit(1);
  }

  try {
    const mux = new Mux({ tokenId, tokenSecret });

    console.log("📡 Fetching Mux assets...\n");
    const response = await mux.video.assets.list({ limit: 5 });
    const assets = response.data; // The actual assets array is in .data

    console.log("✅ SUCCESS! Mux API is accessible\n");
    console.log("📊 Results:");
    console.log("  - Total assets:", assets.length);

    if (assets.length > 0) {
      console.log("\n📹 Recent videos:\n");
      assets.forEach((asset: (typeof assets)[number], index: number) => {
        console.log(`${index + 1}. ${asset.id}`);
        console.log(`   Status: ${asset.status}`);
        console.log(
          `   Duration: ${asset.duration ? Math.round(asset.duration) + "s" : "N/A"}`,
        );
        console.log(`   Created: ${asset.created_at}`);

        const hasTranscript = asset.tracks?.some(
          (t: { type?: string }) => t.type === "text",
        );
        console.log(
          `   Transcript: ${hasTranscript ? "✅ Available" : "❌ Not generated"}`,
        );
        console.log("");
      });
    } else {
      console.log(
        "\n📭 No videos found. Upload a video to test transcript processing.",
      );
    }

    console.log("✅ Mux is configured correctly!");
    console.log("🎉 Ready to receive webhook events.\n");
  } catch (error) {
    console.error("❌ Test FAILED\n");

    if (error instanceof Error) {
      console.error("Error:", error.message);

      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("401")
      ) {
        console.error("\n🔧 Invalid Mux credentials!");
        console.error("Please check MUX_TOKEN_ID and MUX_TOKEN_SECRET");
      }
    } else {
      console.error("Unknown error:", error);
    }

    process.exit(1);
  }
}

testMux();
