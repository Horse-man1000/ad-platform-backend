import { Router } from "express";
import { getReportsServicePlaceholder } from "../Services/reports.service.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    module: "reports",
    message: "placeholder route",
    service: getReportsServicePlaceholder(),
  });
});

export default router;
