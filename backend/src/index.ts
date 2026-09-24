import path from "path";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
import cors from "cors";
import { authRouter } from "./routes/auth";
import { menuRouter } from "./routes/menu";
import { ordersRouter } from "./routes/orders";
import { riderRouter } from "./routes/rider";
import { adminRouter } from "./routes/admin";
import { invoicesRouter } from "./routes/invoices";
import { uploadRouter } from "./routes/upload";
import { categoriesRouter } from "./routes/categories";
import { dealsRouter } from "./routes/deals";
import { deliveryAreasRouter } from "./routes/delivery-areas";
import { settingsRouter } from "./routes/settings";
import { UPLOAD_DIR } from "./lib/uploads";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/upload", uploadRouter);
app.use("/auth", authRouter);
app.use("/menu", menuRouter);
app.use("/categories", categoriesRouter);
app.use("/deals", dealsRouter);
app.use("/delivery-areas", deliveryAreasRouter);
app.use("/settings", settingsRouter);
app.use("/orders", ordersRouter);
app.use("/rider", riderRouter);
app.use("/admin", adminRouter);
app.use("/invoices", invoicesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`Ubaid Fast Foodz API on http://localhost:${PORT}`);
});
