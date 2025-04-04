import { Driver } from "../models/driver.model.js";
import { User } from "../models/user.model.js";
import { Bus} from "../models/bus.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const setDriverDetails = asyncHandler (async (req, res) => {
    const { licenseNumber, experience } = req.body;

    if (!licenseNumber || !experience) {
        throw new ApiError(400, "License number and experience are required");
    }

    // Ensure user is authenticated
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access, token is required");
    }

    // Check if user exists and has the role of 'driver'
    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== "driver") {
        throw new ApiError(403, "Unauthorized access, only drivers can set driver details");
    }

    // Check if driver details already exist
    const existingDriver = await Driver.exists({ userId });
    if (existingDriver) {
        throw new ApiError(400, "Driver details already exist for this user");
    }

    // Create and save new driver document
    const driver = await Driver.create({
        userId,
        licenseNumber,
        experience
    });

    return res.status(201).json(new ApiResponse(201, driver, "Driver details set successfully"));
})

// assign the driver to the existing bus
const assignBusToDriver = asyncHandler(async (req, res) => {
    const { busId, driverId } = req.body;

    if (!busId || !driverId) {
        throw new ApiError(400, "Bus ID and Driver ID are required");
    }

    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access, token is required");
    }

    // Check if user exists and is an admin
    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can assign buses");
    }

    // Use transaction to prevent inconsistent updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if bus and driver exist
        const bus = await Bus.findById(busId).session(session);
        if (!bus) {
            throw new ApiError(404, "Bus not found");
        }

        const driver = await Driver.findById(driverId).session(session);
        if (!driver) {
            throw new ApiError(404, "Driver not found");
        }

        // Check if bus already has an assigned driver
        if (bus.assignedDriver) {
            throw new ApiError(400, "Bus already has a driver assigned");
        }

        // Check if driver is already assigned to another bus
        if (driver.assignedBus) {
            throw new ApiError(400, "Driver is already assigned to another bus");
        }

        // Assign driver to bus and vice versa
        bus.assignedDriver = driver._id;
        driver.assignedBus = bus._id;
        driver.status = "on-duty";

        await bus.save({ session });
        await driver.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Populate assignedDriver details in response
        const updatedBus = await Bus.findById(busId).populate("assignedDriver");

        return res.status(200).json(new ApiResponse(200, updatedBus, "Driver assigned to bus successfully"));

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
})

// remove the driver from the existing bus
const removeDriverFromBus = asyncHandler(async (req, res) => {
    const { busId } = req.body;

    if (!busId) {
        throw new ApiError(400, "Bus ID is required");
    }

    // Ensure user is authenticated
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access, token is required");
    }

    // Check if user exists and has the role of 'admin'
    const user = await User.findById(userId).select("role").lean();
    if (!user || user.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can remove drivers");
    }

    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
        throw new ApiError(404, "Bus not found");
    }

    // Check if bus has an assigned driver
    if (!bus.assignedDriver) {
        throw new ApiError(400, "No driver is assigned to this bus");
    }

    // Find the driver and ensure they are assigned to the bus
    const driver = await Driver.findById(bus.assignedDriver);
    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // Remove driver from the bus and update driver status
    bus.assignedDriver = null;
    driver.assignedBus = null;
    driver.status = "available"; 

    // Save the updated bus and driver
    await bus.save();
    await driver.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Driver removed from bus successfully")
    );
});

const addDriverRating = asyncHandler(async (req, res) => {
    const { driverId, rating } = req.body;
    const userId = req.user._id;  // Assuming user is authenticated

    if (!userId) {
        throw new ApiError(401, "Unauthorized access, token is required");
    }

    if (!driverId || rating === undefined) {
        throw new ApiError(400, "Driver ID and rating are required");
    }

    if (rating < 0 || rating > 5) {
        throw new ApiError(400, "Rating must be between 0 and 5");
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // Check if user has already rated this driver
    const existingRating = driver.ratings.find(r => r.userId.toString() === userId.toString());

    if (existingRating) {
        existingRating.score = rating; // Update existing rating
    } else {
        driver.ratings.push({ userId, score: rating }); // Add new rating
    }

    // Calculate new average rating
    const totalScore = driver.ratings.reduce((sum, r) => sum + r.score, 0);
    driver.averageRating = totalScore / driver.ratings.length;

    await driver.save();

    return res.status(200).json(
        new ApiResponse(200, {
            averageRating: driver.averageRating,
            totalRatings: driver.ratings.length
        }, "Driver rating updated successfully")
    );
})

const removeDriverRating = asyncHandler(async (req, res) => {
    const { driverId } = req.params;

    // Ensure user is authenticated
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized access, token is required");
    }

    // Find the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // Check if the user has rated the driver
    const ratingIndex = driver.ratings.findIndex(r => r.userId.toString() === userId.toString());
    if (ratingIndex === -1) {
        throw new ApiError(400, "You have not rated this driver");
    }

    // Remove the rating
    driver.ratings.splice(ratingIndex, 1);

    // Recalculate the average rating
    const totalRatings = driver.ratings.length;
    const newAverageRating = totalRatings > 0
        ? driver.ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
        : 0;

    driver.averageRating = newAverageRating;

    // Save the updated driver document
    await driver.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Your rating has been removed successfully")
    );
});

const getAllDrivers = asyncHandler(async (req, res) => {
    const { status, minExperience, maxExperience, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) {
        filter.status = status; // Filter by driver status
    }

    if (minExperience || maxExperience) {
        filter.experience = {};
        if (minExperience) filter.experience.$gte = parseInt(minExperience);
        if (maxExperience) filter.experience.$lte = parseInt(maxExperience);
    }

    const drivers = await Driver.find(filter)
        .populate("userId", "name email") // Populate user details
        .populate("assignedBus", "busNumber route") // Populate bus details
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(); // Convert to plain objects for performance

    return res.status(200).json(new ApiResponse(200, drivers, "Drivers retrieved successfully"));
});

// Update driver details (only accessible by admins)
const updateDriverDetails = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get driver ID from URL parameters
    const { licenseNumber, experience } = req.body; // New details for the driver

    // Check if the fields are provided in the request body
    if (!licenseNumber && !experience) {
        throw new ApiError(400, "At least one of the following is required: license number or experience");
    }

    // Ensure user is an admin
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can update driver details");
    }

    // Find the driver by ID
    const driver = await Driver.findById(id);
    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // Update the driver's details if provided
    if (licenseNumber) {
        driver.licenseNumber = licenseNumber;
    }
    if (experience) {
        driver.experience = experience;
    }

    // Save the updated driver details
    await driver.save();
    return res.status(200).json(new ApiResponse(200, driver, "Driver details updated successfully"));
});

const deleteDriver = asyncHandler ( async (req, res) => {
    const { id } = req.params;
    // Ensure user is an admin
    if (req.user?.role!== "admin") {
        throw new ApiError(403, "Unauthorized access, only admins can delete drivers");
    }
    // Find the driver by ID
    const driver = await Driver.findById(id);
    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // Check if the driver is assigned to a bus
    if (driver.assignedBus) {
        throw new ApiError(400, "Cannot delete a driver assigned to a bus");
    }

    // store the driver userId and find the user 
    const userId = driver.userId;
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete the driver from both db
    await driver.remove();
    await user.remove();
    return res.status(200).json(new ApiResponse(200, null, "Driver deleted successfully"));
})

export {
    setDriverDetails,
    assignBusToDriver,
    removeDriverFromBus,
    addDriverRating,
    removeDriverRating,
    getAllDrivers,
    updateDriverDetails,
    deleteDriver
}