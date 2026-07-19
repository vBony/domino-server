import { Router } from "express";
import * as authController from "../controllers/authController";
import { requireAuth } from "../middlewares/auth";
import * as authValidator from "../validators/auth";

const router = Router();

router.post("/auth/register", authValidator.register, authController.register);
router.post("/auth/login", authValidator.login, authController.login);
router.post("/auth/guest", authController.guest);
router.get("/auth/me", requireAuth, authController.me);

export default router;
