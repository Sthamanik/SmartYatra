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
});


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
});

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
    driver.status = "available"; // Change driver status to available

    // Save the updated bus and driver
    await bus.save();
    await driver.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Driver removed from bus successfully")
    );
});


export {
    setDriverDetails,
    assignBusToDriver,
    removeDriverFromBus
}