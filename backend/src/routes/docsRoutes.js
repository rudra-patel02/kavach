import express from "express";

import { getOpenApiJson, getSwaggerUi } from "../controllers/docsController.js";

const router = express.Router();

router.get("/", getSwaggerUi);
router.get("/openapi.json", getOpenApiJson);

export default router;
