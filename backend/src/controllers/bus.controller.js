import { Bus } from "../models/bus.model.js";
import { Driver } from "../models/driver.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createBus = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can create buses");
    }

    const { busNumber, route, capacity, available_capacity, current_location } = req.body;

    if (!busNumber || !route || !current_location?.coordinates) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
        throw new ApiError(400, "Bus with this number already exists");
    }

    const bus = await Bus.create({
        busNumber,
        route,
        capacity: parseInt(capacity, 10),
        available_capacity: parseInt(available_capacity, 10),
        current_location
    });

    return res.status(201).json(new ApiResponse(201, bus, "Bus created successfully"));
});

const getAllBuses = asyncHandler(async (req, res) => {
    const { status, route, assignedDriver, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (route) filter.route = route;
    if (assignedDriver) filter.assignedDriver = assignedDriver;

    const buses = await Bus.find(filter)
        .populate("route")
        .populate("assignedDriver", "userId licenseNumber experience")
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10));

    return res.status(200).json(new ApiResponse(200, buses, "Buses retrieved successfully"));
});

const getBusById = asyncHandler(async (req, res) => {
    const bus = await Bus.findById(req.params.id)
        .populate("route")
        .populate("assignedDriver", "userId licenseNumber experience");

    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    return res.status(200).json(new ApiResponse(200, bus, "Bus details retrieved successfully"));
});

const updateBusDetails = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can update bus details");
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(bus, updates);

    await bus.save();

    return res.status(200).json(new ApiResponse(200, bus, "Bus details updated successfully"));
});

const deleteBus = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can delete buses");
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    await bus.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Bus deleted successfully"));
});

const updateBusLocation = asyncHandler(async (req, res) => {
    const { coordinates } = req.body;
    if (!coordinates || coordinates.length !== 2) {
        throw new ApiError(400, "Valid coordinates (longitude, latitude) are required");
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    if (req.user?.role !== "driver" || req.user._id.toString() !== bus.assignedDriver?.toString()) {
        throw new ApiError(403, "Unauthorized access, only assigned drivers can update location");
    }

    bus.current_location.coordinates = coordinates;
    await bus.save();

    return res.status(200).json(new ApiResponse(200, bus, "Bus location updated successfully"));
});

const updateAvailableSeat = asyncHandler(async (req, res) => {
    if (!req.user || req.user.role !== "driver") {
        throw new ApiError(403, "Unauthorized access, only assigned drivers are allowed");
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    if (!bus.assignedDriver || bus.assignedDriver.toString() !== driver._id.toString()) {
        throw new ApiError(403, "Unauthorized access, only assigned driver can update available seats");
    }

    const { available_capacity } = req.body;
    if (typeof available_capacity !== 'number' || available_capacity < 0 || available_capacity > bus.capacity) {
        throw new ApiError(400, `Available capacity should be a number between 0 and ${bus.capacity}`);
    }

    bus.available_capacity = available_capacity;
    await bus.save();

    return res.status(200).json(new ApiResponse(200, bus, "Bus available seat updated successfully"));
});

const getBusesByUserRoute = asyncHandler(async (req, res) => {
    const { route } = req.query;

    if (!route) {
        throw new ApiError(400, "Route parameter is required");
    }

    const buses = await Bus.find({ route })
        .populate("route")
        .populate("assignedDriver", "userId licenseNumber experience");

    return res.status(200).json(new ApiResponse(200, buses, "Buses for the specified route retrieved successfully"));
});

export { 
    createBus, 
    getAllBuses, 
    getBusById, 
    updateBusDetails, 
    deleteBus, 
    updateBusLocation, 
    updateAvailableSeat,
    getBusesByUserRoute
};
