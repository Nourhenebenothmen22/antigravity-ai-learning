import express from "express";
import { registerValidation } from "../middlewares/auth.validation.js";
import { register, login } from "../controllers/auth.controller.js";
const router = express.Router();


router.post("/register", registerValidation, register);
router.post("/login", login);

export default router;
