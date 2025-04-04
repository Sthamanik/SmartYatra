import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createBus, deleteBus, getAllBuses, getBusById, getBusesByUserRoute, updateAvailableSeat, updateBusDetails, updateBusLocation } from "../controllers/bus.controller.js";

const router = Router();

router.use(verifyJWT)

// route to create & get all bus
router.route('/')
.post(createBus)
.get(getAllBuses); 

// route to get bus by id and perform various operations
router.route('/:id')
.get(getBusById)
.put(updateBusDetails)
.delete(deleteBus);

// other routes
router.route('/:id/location').put(updateBusLocation);
router.route('/:id/seats').put(updateAvailableSeat);
router.route('/by-route').get(getBusesByUserRoute); // Pass route ID as a query param


export default router;