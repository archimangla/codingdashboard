import { Router } from "express";
import healthRouter from "./health.js";
import userRouter from "./user.js";
import platformsRouter from "./platforms.js";
import dashboardRouter from "./dashboard.js";
import activityRouter from "./activity.js";
import analyticsRouter from "./analytics.js";
import searchRouter from "./search.js";
import insightsRouter from "./insights.js";
import exportRouter from "./export.js";

const router = Router();

router.use(healthRouter);
router.use(userRouter);
router.use(platformsRouter);
router.use(dashboardRouter);
router.use(activityRouter);
router.use(analyticsRouter);
router.use(searchRouter);
router.use(insightsRouter);
router.use(exportRouter);

export default router;
