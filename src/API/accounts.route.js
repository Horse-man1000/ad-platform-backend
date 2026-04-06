import { Router } from "express";
import { createAdAccount, getAdAccountById } from "../Services/accounts.service.js";
import { normalizePlatform } from "../Utils/token.util.js";
import { errorResponse, successResponse } from "../Utils/response.util.js";
import {
  parsePositiveInt,
  requireNonEmptyString,
  normalizeOptionalString,
} from "../Utils/validation.util.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(
    successResponse("accounts", "accounts module ready", {
      endpoints: ["POST /api/accounts", "GET /api/accounts/:id"],
    })
  );
});

router.post("/", async (req, res) => {
  try {
    const clientId = parsePositiveInt(req.body.clientId);
    const platform = normalizePlatform(req.body.platform);
    const externalAccountId = requireNonEmptyString(req.body.externalAccountId);
    const name = normalizeOptionalString(req.body.name);

    if (!clientId) {
      return res
        .status(400)
        .json(errorResponse("clientId must be a positive integer"));
    }

    if (!platform) {
      return res.status(400).json(errorResponse("platform is required"));
    }

    if (!externalAccountId) {
      return res.status(400).json(errorResponse("externalAccountId is required"));
    }

    const account = await createAdAccount({
      clientId,
      platform,
      externalAccountId,
      name,
    });

    return res
      .status(201)
      .json(successResponse("accounts", "account saved", account));
  } catch (error) {
    if (error.code === "CLIENT_NOT_FOUND") {
      return res.status(404).json(errorResponse("client not found"));
    }

    return res.status(500).json(errorResponse("failed to save account"));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);

    if (!id) {
      return res
        .status(400)
        .json(errorResponse("id must be a positive integer"));
    }

    const account = await getAdAccountById(id);

    if (!account) {
      return res.status(404).json(errorResponse("account not found"));
    }

    return res.json(successResponse("accounts", "account fetched", account));
  } catch {
    return res.status(500).json(errorResponse("failed to fetch account"));
  }
});

export default router;
