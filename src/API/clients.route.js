import { Router } from "express";
import {
  createClient,
  getClientById,
  listClients,
} from "../Services/clients.service.js";
import { errorResponse, successResponse } from "../Utils/response.util.js";
import {
  isSimpleEmail,
  normalizeOptionalString,
  parsePositiveInt,
  requireNonEmptyString,
} from "../Utils/validation.util.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = parsePositiveInt(req.query.limit) || 25;
    const clients = await listClients(limit);

    return res.json(successResponse("clients", "clients list", clients));
  } catch {
    return res.status(500).json(errorResponse("failed to fetch clients"));
  }
});

router.post("/", async (req, res) => {
  try {
    const name = requireNonEmptyString(req.body.name);
    const email = normalizeOptionalString(req.body.email);

    if (!name) {
      return res.status(400).json(errorResponse("name is required"));
    }

    if (!isSimpleEmail(email)) {
      return res
        .status(400)
        .json(errorResponse("email must be a valid email address"));
    }

    const client = await createClient({ name, email });

    return res.status(201).json(successResponse("clients", "client created", client));
  } catch {
    return res.status(500).json(errorResponse("failed to create client"));
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

    const client = await getClientById(id);

    if (!client) {
      return res.status(404).json(errorResponse("client not found"));
    }

    return res.json(successResponse("clients", "client fetched", client));
  } catch {
    return res.status(500).json(errorResponse("failed to fetch client"));
  }
});

export default router;
