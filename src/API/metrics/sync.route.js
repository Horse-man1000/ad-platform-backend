import { Router } from "express";
import { syncMetricsForClient } from "../../Services/metrics-sync.service.js";
import { errorResponse } from "../../Utils/response.util.js";
import { parsePositiveInt } from "../../Utils/validation.util.js";
import { ERROR_CODES } from "../../Utils/error-codes.js";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParam(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

router.get("/", async (req, res) => {
  const clientId = parsePositiveInt(req.query.clientId);
  const fromRaw = req.query.from;
  const toRaw = req.query.to;

  if (!clientId) {
    return res.status(400).json(errorResponse("clientId query param is required"));
  }

  const from = parseDateParam(fromRaw);
  const to = parseDateParam(toRaw);

  if (!from || !to) {
    return res.status(400).json(errorResponse("from and to must be YYYY-MM-DD"));
  }

  if (from > to) {
    return res.status(400).json(errorResponse("from must be before or equal to to"));
  }

  try {
    console.info(`[metrics-sync] start clientId=${clientId} from=${fromRaw} to=${toRaw}`);
    const result = await syncMetricsForClient(clientId, from, to);
    console.info(
      `[metrics-sync] finish clientId=${clientId} platform=google success=${result.platforms.google.synced} added=${result.platforms.google.metricsAdded} updated=${result.platforms.google.metricsUpdated}`
    );
    console.info(
      `[metrics-sync] finish clientId=${clientId} platform=meta success=${result.platforms.meta.synced} added=${result.platforms.meta.metricsAdded} updated=${result.platforms.meta.metricsUpdated}`
    );
    return res.json(result);
  } catch (error) {
    console.info(`[metrics-sync] failed clientId=${clientId} reason=${error.code || ERROR_CODES.SYNC_FAILED}`);

    if (error.code === ERROR_CODES.CLIENT_NOT_FOUND) {
      return res.status(404).json(errorResponse("client not found"));
    }

    if (error.code === ERROR_CODES.INVALID_DATE_RANGE) {
      return res.status(400).json(errorResponse("invalid date range"));
    }

    return res.status(500).json(errorResponse("metrics sync failed"));
  }
});

export default router;
