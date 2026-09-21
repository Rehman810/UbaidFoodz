import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { imageUpload } from "../lib/uploads";

export const uploadRouter = Router();

uploadRouter.post(
  "/image",
  requireAuth,
  requireRole(Role.ADMIN),
  (req, res) => {
    imageUpload.single("image")(req, res, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        return res.status(400).json({ error: message });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided." });
      }

      const host = req.get("host");
      const protocol = req.protocol;
      const url = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.status(201).json({ url, filename: req.file.filename });
    });
  }
);
