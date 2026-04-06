import { Router } from "express";
import { initiateAuth, handleCallback, refreshToken } from "../../Services/OAuth/meta.service.js";
import { parseCallbackParams } from "../../Utils/oauth.util.js";
import { successResponse, errorResponse } from "../../Utils/response.util.js";
import { parsePositiveInt } from "../../Utils/validation.util.js";

const router = Router();

router.get("/", (req, res) => {
  const clientId = parsePositiveInt(req.query.clientId);
  if (!clientId) {
    return res.status(400).json(errorResponse("clientId query param is required"));
  }
  try {
    const authURL = initiateAuth(clientId);
    return res.redirect(authURL);
  } catch (err) {
    if (err.code === "OAUTH_NOT_CONFIGURED") {
      return res.status(503).json(errorResponse("Meta OAuth is not configured on this server"));
    }
    return res.status(500).json(errorResponse("Failed to initiate Meta OAuth"));
  }
});

router.get("/callback", async (req, res) => {
  const { code, state, error: oauthError, errorDescription } = parseCallbackParams(req.query);
  if (oauthError) {
    return res.status(400).json(errorResponse(`OAuth denied: ${errorDescription || oauthError}`));
  }
  if (!code || !state) {
    return res.status(400).json(errorResponse("code and state are required"));
  }
  try {
    const result = await handleCallback(code, state);
    return res.json(successResponse("auth/meta", "Meta OAuth complete", result));
  } catch (err) {
    if (err.code === "OAUTH_NOT_CONFIGURED") {
      return res.status(503).json(errorResponse("Meta OAuth is not configured on this server"));
    }
    if (err.code === "INVALID_STATE") {
      return res.status(400).json(errorResponse("Invalid OAuth state parameter"));
    }
    if (err.code === "TOKEN_EXCHANGE_FAILED") {
      return res.status(502).json(errorResponse("Token exchange with Meta failed"));
    }
    return res.status(500).json(errorResponse("Meta OAuth callback failed"));
  }
});

router.post("/refresh", async (req, res) => {
  const clientId = parsePositiveInt(req.body?.clientId);
  if (!clientId) {
    return res.status(400).json(errorResponse("clientId is required"));
  }
  try {
    const result = await refreshToken(clientId);
    return res.json(successResponse("auth/meta", "Meta token refreshed", result));
  } catch (err) {
    if (err.code === "OAUTH_NOT_CONFIGURED") {
      return res.status(503).json(errorResponse("Meta OAuth is not configured on this server"));
    }
    if (err.code === "NO_REFRESH_TOKEN") {
      return res.status(404).json(errorResponse("No token found for this client"));
    }
    if (err.code === "TOKEN_REFRESH_FAILED") {
      return res.status(502).json(errorResponse("Token refresh with Meta failed"));
    }
    return res.status(500).json(errorResponse("Meta token refresh failed"));
  }
});

export default router;
