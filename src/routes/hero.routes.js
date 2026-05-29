import express from "express";
import { getHeroSlides } from "../controllers/heroController.js";

const router = express.Router();

router.get("/", getHeroSlides);

export default router;
