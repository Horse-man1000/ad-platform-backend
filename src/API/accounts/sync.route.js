import { Router } from "express";
import { syncAccountsForClient } from "../../Services/accounts-sync.service.js";
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
    console.info(`[accounts-sync] start clientId=${clientId}`);
    const result = await syncAccountsForClient(clientId);
    console.info(
      `[accounts-sync] finish clientId=${clientId} platform=google success=${result.platforms.google.synced} added=${result.platforms.google.accountsAdded} updated=${result.platforms.google.accountsUpdated}`
    );
    console.info(
      `[accounts-sync] finish clientId=${clientId} platform=meta success=${result.platforms.meta.synced} added=${result.platforms.meta.accountsAdded} updated=${result.platforms.meta.accountsUpdated}`
    );
    return res.json(result);
  } catch (error) {
    console.info(`[accounts-sync] failed clientId=${clientId} reason=${error.code || ERROR_CODES.SYNC_FAILED}`);

    if (error.code === ERROR_CODES.CLIENT_NOT_FOUND) {
      return res.status(404).json(errorResponse("client not found"));
    }

    return res.status(500).json(errorResponse("account sync failed"));
  }
});

export default router;
