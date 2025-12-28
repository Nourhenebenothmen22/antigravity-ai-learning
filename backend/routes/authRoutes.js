import express from "express";
import { registerValidation } from "../middlewares/auth.validation.js";
import { register, login,getProfile,updateProfile,changePassword,logout } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.js";
const router = express.Router();

//public routes
router.post("/register", registerValidation, register);
router.post("/login", login);
router.post("/logout", logout);

//protected routes
router.get("/profile",authMiddleware,getProfile)
router.put("/profile",authMiddleware,updateProfile)
router.post("/change-password", authMiddleware, changePassword)

export default router;
