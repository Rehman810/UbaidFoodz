import fs from "fs";
import path from "path";
import multer from "multer";
import { sniffImage } from "./image-sniff";

export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WebP or GIF images are allowed."));
    }
  },
});

export async function reencodeImage(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const kind = sniffImage(buf);
  if (!kind) {
    fs.unlinkSync(filePath);
    throw new Error("Only JPG, PNG, WebP or GIF images are allowed.");
  }
  const sharp = (await import("sharp")).default;
  const pipeline = sharp(buf, { failOn: "error" }).rotate();
  const out = kind === "png" ? await pipeline.png().toBuffer() : await pipeline.jpeg({ quality: 82 }).toBuffer();
  const ext = kind === "png" ? ".png" : ".jpg";
  const next = filePath.replace(/\.[^.]+$/, ext);
  if (next !== filePath) fs.unlinkSync(filePath);
  fs.writeFileSync(next, out);
  return path.basename(next);
}
