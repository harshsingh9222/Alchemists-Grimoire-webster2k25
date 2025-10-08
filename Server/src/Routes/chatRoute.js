import express from "express";
import {
  sendChatMessage,
  getAllChats,
  getChatHistory,
  deleteChat,
  clearAllChats,
} from "../Controllers/chat.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, sendChatMessage);
router.get("/all", verifyJWT, getAllChats);
router.get("/:id", verifyJWT, getChatHistory);
router.delete("/:id", verifyJWT, deleteChat);
router.delete("/", verifyJWT, clearAllChats);

export default router;
