import { Router } from "express";
import { getCampaignsServicePlaceholder } from "../Services/campaigns.service.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    module: "campaigns",
    message: "placeholder route",
    service: getCampaignsServicePlaceholder(),
  });
});

export default router;
