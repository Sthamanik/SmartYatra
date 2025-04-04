import { Ride } from "../models/ride.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Route } from "../models/Route.js";

const calculateFare = (distance) => {
    const baseFare = 10; // Some base fare
    const ratePerKm = 2; // Example rate per km
    return baseFare + (distance * ratePerKm);
};

const createRide = asyncHandler ( async ( req, res ) => {
    const passenger = req.user?.id;

    if (!passenger) {
        throw new ApiError(401, "User not authenticated");
    }

    const { bus, startStop, endStop } = req.body;

    // Validate inputs
    if (!bus ||!startStop ||!endStop) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user has the ongoing ride already
    const ongoingRide = await Ride.findOne({ passenger, status: "ongoing" });
    if (ongoingRide) {
        throw new ApiError(400, "User already has an ongoing ride");
    }

    // Create and save new ride document
    const ride = await Ride.create({
        passenger,
        bus,
        startStop,
        endStop
    })

    res.status(201).json(
        new ApiResponse( 201, ride._id, "ride created successfully")
    )
});

const verifyRide = asyncHandler( async ( req, res ) => {
    const passenger = req.user?.id;
    const rideId = req.params.rideId;

    // Validate inputs
    if (!passenger ||!rideId) {
        throw new ApiError(401, "User not authenticated");
    }

    // check if user has the ongoing ride already
    const ride = await Ride.findOne({ passenger, _id: rideId, status: 'ongoing' });
    if (!ride) {
        throw new ApiError(400, "User does not have an ongoing ride");
    }

   // Check if the ride was created within the last 5 minutes
   const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
   if (ride.createdAt < fiveMinutesAgo) {
       throw new ApiError(400, "Ride verification time has expired");
   }

   // check if ride is already verified
   if (ride.verified) {
       throw new ApiError(400, "Ride has already been verified");
   }

   // Mark the ride as verified
   ride.verified = true;
   await ride.save();

   res.status(200).json(new ApiResponse(200, ride, "Ride verified successfully"));
})

const cancelRide = asyncHandler( async ( req, res ) => {
    const passenger = req.user?.id;
    const rideId = req.params.rideId;

    // Validate inputs
    if (!passenger ||!rideId) {
        throw new ApiError(401, "User not authenticated");
    }

    // check if user has the ongoing ride already
    const ride = await Ride.findOne({ passenger, _id: rideId, status: 'ongoing' });
    if (!ride) {
        throw new ApiError(400, "User does not have an ongoing ride");
    }

    ride.status = "canceled";
    await ride.save();

    if (!delRide) {
        throw new ApiError(500, "Failed to cancel the ride");
    }
    res.status(200).json(new ApiResponse(200, null, "Ride cancelled successfully"));
});

const deleteCancelledRides = asyncHandler ( async ( req, res ) => {
    if ( !req.user || req.user?.role !== "admin" ){
        throw new ApiError(403, "Unauthorized access, only admins can delete cancelled rides");
    }

    const cancelledRides = await Ride.find({ status: "canceled" });
    if (!cancelledRides) {
        throw new ApiError(404, "No cancelled rides found");
    }

    const deletedCount = await Ride.deleteMany({ status: "canceled" });
    if (deletedCount.deletedCount === 0) {
        throw new ApiError(500, "Failed to delete cancelled rides");
    }

    res.status(200).json(new ApiResponse(200, null, `${deletedCount.deletedCount} cancelled rides deleted successfully`));
}) 

const startRide = asyncHandler(async (req, res) => {
    const passenger = req.user?.id; // Get passenger ID from authenticated user
    const rideId = req.params.rideId; // Get rideId from request params
    const { startStop, endStop } = req.body; // Get start and end stops from the body

    // Validate inputs
    if (!passenger || !rideId || !startStop || !endStop) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if the user has an ongoing ride
    const ride = await Ride.findOne({ passenger, _id: rideId, status: 'ongoing' });
    if (!ride) {
        throw new ApiError(400, "User does not have an ongoing ride");
    }

    // Fetch the route details from the Route collection
    const route = await Route.findOne({ "stops.name": startStop, "stops.name": endStop });
    if (!route) {
        throw new ApiError(400, "Route with the given start and end stops not found");
    }

    // Get the distance and travel time between the start and end stops
    const startStopDetails = route.stops.find(stop => stop.name === startStop);
    const endStopDetails = route.stops.find(stop => stop.name === endStop);

    if (!startStopDetails || !endStopDetails) {
        throw new ApiError(400, "Start or End Stop details not found in the route");
    }

    const distance = endStopDetails.distance - startStopDetails.distance; 
    const travelTime = endStopDetails.travelTime - startStopDetails.travelTime; 

    if (distance < 0 || travelTime < 0) {
        throw new ApiError(400, "Invalid distance or travel time calculation");
    }

    // Calculate the fare (you can modify this logic to use more sophisticated fare calculation)
    const fare = calculateFare(distance);

    // Update the ride details
    ride.startStop = startStop;
    ride.endStop = endStop;
    ride.fare = fare;
    ride.estimatedTime = travelTime; 

    // Save the updated ride
    await ride.save();

    // Send the response with the updated ride information
    res.status(200).json(
        new ApiResponse(200, ride, "Ride started successfully with estimated fare and travel time")
    )
});

const endRide = asyncHandler(async (req, res) => {
    const passenger = req.user?.id;
    const rideId = req.params.rideId;
    const { currentLocation } = req.body; // The user's current location

    // Validate inputs
    if (!passenger || !rideId || currentLocation == null) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user has an ongoing ride
    const ride = await Ride.findOne({ passenger, _id: rideId, status: "ongoing" });
    if (!ride) {
        throw new ApiError(400, "User does not have an ongoing ride");
    }

    // Fetch the route details from the Route collection
    const route = await Route.findOne({ "stops.name": { $in: [ride.startStop] } });
    if (!route) {
        throw new ApiError(400, "Route for the ride not found");
    }

    // Get the start stop and next stops details
    const startStopIndex = route.stops.findIndex(stop => stop.name === ride.startStop);
    if (startStopIndex === -1) {
        throw new ApiError(400, "Start stop not found in the route");
    }

    // Find the nearest stop the user is closest to based on currentLocation
    let endStop = route.stops[startStopIndex]; // Default to the start stop
    for (let i = startStopIndex + 1; i < route.stops.length; i++) {
        const stop = route.stops[i];
        if (currentLocation >= stop.distance) {
            endStop = stop;
        } else {
            break;
        }
    }

    // Calculate the expected fare and time between start and end stops
    const startStopDetails = route.stops[startStopIndex];
    const endStopDetails = endStop;

    const distance = endStopDetails.distance - startStopDetails.distance;
    const travelTime = endStopDetails.travelTime - startStopDetails.travelTime;

    if (distance < 0 || travelTime < 0) {
        throw new ApiError(400, "Invalid distance or travel time calculation");
    }

    const fare = calculateFare(distance); // Calculate fare based on distance

    // Update the ride's end stop, status, and other relevant information
    ride.endStop = endStop.name;
    ride.status = "completed"; // Mark as completed
    ride.fare = fare;
    ride.estimatedTime = travelTime;

    // If the payment method is wallet, deduct the fare
    if (ride.paymentMethod === "wallet") {
        const user = await User.findById(passenger);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Check if user has enough balance to pay the fare
        if (user.walletBalance < ride.fare) {
            throw new ApiError(400, "Insufficient balance to complete the ride");
        }

        // Deduct the fare from the user's wallet
        user.walletBalance -= ride.fare;
        await user.save();
    }

    // Save the updated ride
    await ride.save();

    // Send the response with the updated ride information
    res.status(200).json(
        new ApiResponse(200, ride, "Ride ended successfully")
    );
});


export {
    createRide,
    verifyRide,
    cancelRide,
    deleteCancelledRides,
    startRide,
    endRide
}