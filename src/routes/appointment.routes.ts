import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";

const router = Router();

// Привязываем GET запрос к нашему методу в контроллере
router.get('/', AppointmentController.getDailySchedule);

export default router;