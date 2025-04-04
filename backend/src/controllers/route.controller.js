import { Route } from "../models/route.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Function to validate stops (checks if each stop has a name and valid coordinates)
const validateStops = (stops) => {
    return stops.every(stop => stop.name && Array.isArray(stop.coordinates) && stop.coordinates.length === 2);
};

// Controller to create a new route
const createRoute = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can create routes");
    }

    const { route_name, stops } = req.body;

    if (!route_name || !stops || !Array.isArray(stops) || stops.length < 2) {
        throw new ApiError(400, "A valid route with at least two stops is required");
    }

    if (!validateStops(stops)) {
        throw new ApiError(400, "Each stop must have a name and valid coordinates");
    }

    const existingRoute = await Route.findOne({ route_name });
    if (existingRoute) {
        throw new ApiError(400, "Route with this name already exists");
    }

    const route = await Route.create({ route_name, stops });

    return res.status(201).json(new ApiResponse(201, route, "Route created successfully"));
});

// Controller to get all routes
const getAllRoutes = asyncHandler(async (req, res) => {
    const routes = await Route.find().sort({ route_name: 1 });

    return res.status(200).json(new ApiResponse(200, routes, "Routes retrieved successfully"));
});

// Controller to get a route by ID
const getRouteById = asyncHandler(async (req, res) => {
    const route = await Route.findById(req.params.id);

    if (!route) {
        throw new ApiError(404, "Route not found");
    }

    return res.status(200).json(new ApiResponse(200, route, "Route details retrieved successfully"));
});

// Controller to update a route by ID
const updateRoute = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can update routes");
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
        throw new ApiError(404, "Route not found");
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(route, updates);

    // If stops are updated, validate them
    if (updates.stops && !validateStops(updates.stops)) {
        throw new ApiError(400, "Each stop must have a name and valid coordinates");
    }

    await route.save();

    return res.status(200).json(new ApiResponse(200, route, "Route updated successfully"));
});

// Controller to delete a route by ID
const deleteRoute = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can delete routes");
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
        throw new ApiError(404, "Route not found");
    }

    await route.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Route deleted successfully"));
});

export {
    createRoute,
    getAllRoutes,
    getRouteById,
    updateRoute,
    deleteRoute,
};
