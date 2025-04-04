import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute } from "../controllers/route.controller.js";

const router = Router();

// Route to create and get all routes
router.route('/')
    .post(verifyJWT, createRoute) 
    .get(getAllRoutes); 
               
// Route to get, update, or delete a specific route by ID
router.route('/:id')
    .get(getRouteById)              
    .put(verifyJWT, updateRoute)
    .delete(verifyJWT, deleteRoute);

export default router;
