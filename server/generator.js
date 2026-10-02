import { mkdir, writeFile, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { updateGeneratedJob } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectFolder = path.join(here, "..");
export const uploadsFolder = path.join(here, "uploads");
export const generatedFolder = path.join(here, "generated");

export function runPython(args) {
  const python =
    process.env.STICKAI_PYTHON ||
    (process.platform === "win32" ? "python" : "python3");
  return new Promise((resolve, reject) => {
    const child = spawn(python, args, {
      cwd: projectFolder,
      env: process.env,
      windowsHide: true,
    });
    let errorText = "";
    child.stderr.on("data", (chunk) => {
      errorText += chunk;
    });
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(errorText || `Python exited with code ${code}.`))
    );
  });
}

export async function generateSticker(job, card, outfit, additionalPrompt, image, mimeType) {
  const inputPath = path.join(uploadsFolder, `${job.id}.input`);
  const outputPath = path.join(generatedFolder, `${job.id}.png`);
  try {
    await mkdir(uploadsFolder, { recursive: true });
    await mkdir(generatedFolder, { recursive: true });
    await writeFile(inputPath, image);
    await runPython([
      path.join(projectFolder, "scripts", "generate_image.py"),
      card.prompt,
      "--image",
      inputPath,
      "--mime-type",
      mimeType,
      "--additional-prompt",
      additionalPrompt,
      "--output",
      outputPath,
    ]);
    await updateGeneratedJob(job.id, {
      status: "completed",
      image: `/api/generated/${job.id}`,
      errorMessage: null,
    });
  } catch (error) {
    const detail = String(error.message || error).slice(0, 500);
    const missingProject = !process.env.GCP_PROJECT_ID;
    await updateGeneratedJob(job.id, {
      status: "error",
      errorMessage: missingProject
        ? "Thiếu GCP_PROJECT_ID trong .env.local. Xem README để cấu hình Vertex AI."
        : `Vertex AI không tạo được ảnh: ${detail}`,
    });
    console.error("Generate failed:", detail);
  } finally {
    await unlink(inputPath).catch(() => undefined);
  }
}

