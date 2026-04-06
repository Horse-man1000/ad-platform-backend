import { Router } from "express";
import { getClientToken, saveClientToken } from "../Services/tokens.service.js";
import { maskToken, normalizePlatform } from "../Utils/token.util.js";
import { errorResponse, successResponse } from "../Utils/response.util.js";
import {
  parseDateOrNull,
  parsePositiveInt,
  requireNonEmptyString,
} from "../Utils/validation.util.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(
    successResponse("tokens", "tokens module ready", {
      endpoints: ["POST /api/tokens", "GET /api/tokens/:clientId/:platform"],
    })
  );
});

router.post("/", async (req, res) => {
  try {
    const clientId = parsePositiveInt(req.body.clientId);
    const platform = normalizePlatform(req.body.platform);
    const accessToken = requireNonEmptyString(req.body.accessToken);
    const refreshToken = req.body.refreshToken || null;
    const expiresAtRaw = req.body.expiresAt;
    const expiresAt = parseDateOrNull(expiresAtRaw);

    if (!clientId) {
      return res
        .status(400)
        .json(errorResponse("clientId must be a positive integer"));
    }

    if (!platform) {
      return res.status(400).json(errorResponse("platform is required"));
    }

    if (!accessToken) {
      return res.status(400).json(errorResponse("accessToken is required"));
    }

    if (expiresAtRaw && !expiresAt) {
      return res
        .status(400)
        .json(errorResponse("expiresAt must be a valid datetime string"));
    }

    const token = await saveClientToken({
      clientId,
      platform,
      accessToken,
      refreshToken,
      expiresAt,
    });

    return res
      .status(200)
      .json(
        successResponse("tokens", "token saved", {
          id: token.id,
          clientId: token.clientId,
          platform: token.platform,
          accessToken: maskToken(token.accessToken),
          refreshToken: token.refreshToken ? maskToken(token.refreshToken) : null,
          expiresAt: token.expiresAt,
          updatedAt: token.updatedAt,
        })
      );
  } catch (error) {
    if (error.code === "CLIENT_NOT_FOUND") {
      return res.status(404).json(errorResponse("client not found"));
    }

    return res.status(500).json(errorResponse("failed to save token"));
  }
});

router.get("/:clientId/:platform", async (req, res) => {
  try {
    const clientId = parsePositiveInt(req.params.clientId);
    const platform = normalizePlatform(req.params.platform);

    if (!clientId) {
      return res
        .status(400)
        .json(errorResponse("clientId must be a positive integer"));
    }

    if (!platform) {
      return res.status(400).json(errorResponse("platform is required"));
    }

    const token = await getClientToken(clientId, platform);

    if (!token) {
      return res.status(404).json(errorResponse("token not found"));
    }

    return res.json(
      successResponse("tokens", "token fetched", {
        id: token.id,
        clientId: token.clientId,
        platform: token.platform,
        accessToken: maskToken(token.accessToken),
        refreshToken: token.refreshToken ? maskToken(token.refreshToken) : null,
        expiresAt: token.expiresAt,
        updatedAt: token.updatedAt,
      })
    );
  } catch {
    return res.status(500).json(errorResponse("failed to fetch token"));
  }
});

export default router;
