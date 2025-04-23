import express from 'express';
import {
    createRide,
    verifyRide,
    cancelRide,
    deleteCancelledRides,
    startRide,
    endRide
} from '../controllers/rideController.js'; // Adjust the path as necessary
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT)
router.post('/create', createRide);
router.post('/verify/:rideId', verifyRide);
router.post('/cancel/:rideId', cancelRide);
router.delete('/cancelled', deleteCancelledRides);
router.post('/start/:rideId', startRide);
router.post('/end/:rideId', endRide);

export default router;
