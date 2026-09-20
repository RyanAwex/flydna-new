"use server";

import fs from "fs";
import path from "path";
import https from "https";

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      try {
        const stats = fs.statSync(dest);
        if (stats.size > 1000) {
          resolve();
          return;
        }
        fs.unlinkSync(dest);
      } catch (e) {
        console.error("[FlyDnA] Error checking/deleting file:", e);
      }
    }
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
};

export async function downloadSceneAssets() {
  try {
    const dir = path.join(process.cwd(), "public", "scenes");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const localCyberpunk =
      "C:\\Users\\ryana\\.gemini\\antigravity-ide\\brain\\df5f114d-8e8e-42c3-a8a8-1df4306e0404\\cyberpunk_scene_1781441185741.png";
    const destCyberpunk = path.join(dir, "cyberpunk.png");
    if (fs.existsSync(localCyberpunk) && !fs.existsSync(destCyberpunk)) {
      try {
        fs.copyFileSync(localCyberpunk, destCyberpunk);
        console.log("[FlyDnA Server Action] Copied cyberpunk scene from brain");
      } catch (e) {
        console.error(
          "[FlyDnA Server Action] Failed to copy cyberpunk scene:",
          e,
        );
      }
    }

    const scenes: Record<string, string> = {
      "cyberpunk.png":
        "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800&auto=format&fit=crop&q=80",
      "bamboo.png":
        "https://images.unsplash.com/photo-1505245208761-ba872912fac0?w=800&auto=format&fit=crop&q=80",
      "sunset.png":
        "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop&q=80",
      "cave.png":
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
      "desert.png":
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80",
      "waves.png":
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      "cockpit.png":
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      "ruins.png":
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80",
      "metropolis.png":
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
      "aurora.png":
        "https://images.unsplash.com/photo-1483168527879-c66136b56105?w=800&auto=format&fit=crop&q=80",
    };

    const promises = Object.entries(scenes).map(([filename, url]) => {
      const dest = path.join(dir, filename);
      return downloadFile(url, dest);
    });

    await Promise.allSettled(promises);
    return { success: true };
  } catch (err: any) {
    console.error("[FlyDnA Server Action] Error in downloadSceneAssets:", err);
    return { success: false, error: err.message };
  }
}
