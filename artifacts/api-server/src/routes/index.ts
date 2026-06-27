import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import freelancersRouter from "./freelancers";
import clientsRouter from "./clients";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import productsRouter from "./products";
import conversationsRouter from "./messages";
import reviewsRouter from "./reviews";
import reportsRouter from "./reports";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/freelancers", freelancersRouter);
router.use("/clients", clientsRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/products", productsRouter);
router.use("/conversations", conversationsRouter);
router.use("/reviews", reviewsRouter);
router.use("/reports", reportsRouter);
router.use("/stats", statsRouter);

export default router;
