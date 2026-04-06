import { Router } from "express";
import { syncCampaignsForClient } from "../../Services/campaigns-sync.service.js";
import { errorResponse } from "../../Utils/response.util.js";
import { parsePositiveInt } from "../../Utils/validation.util.js";
import { ERROR_CODES } from "../../Utils/error-codes.js";

const router = Router();

router.get("/", async (req, res) => {
  const clientId = parsePositiveInt(req.query.clientId);

  if (!clientId) {
    return res.status(400).json(errorResponse("clientId query param is required"));
  }

  try {
    console.info(`[campaigns-sync] start clientId=${clientId}`);
    const result = await syncCampaignsForClient(clientId);
    console.info(
      `[campaigns-sync] finish clientId=${clientId} platform=google success=${result.platforms.google.synced} added=${result.platforms.google.campaignsAdded} updated=${result.platforms.google.campaignsUpdated}`
    );
    console.info(
      `[campaigns-sync] finish clientId=${clientId} platform=meta success=${result.platforms.meta.synced} added=${result.platforms.meta.campaignsAdded} updated=${result.platforms.meta.campaignsUpdated}`
    );
    return res.json(result);
  } catch (error) {
    console.info(`[campaigns-sync] failed clientId=${clientId} reason=${error.code || ERROR_CODES.SYNC_FAILED}`);

    if (error.code === ERROR_CODES.CLIENT_NOT_FOUND) {
      return res.status(404).json(errorResponse("client not found"));
    }

    return res.status(500).json(errorResponse("campaign sync failed"));
  }
});

export default router;
