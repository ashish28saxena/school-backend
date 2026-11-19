
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const TransportRoute = require("../models/TransportRoute");
const RouteAssignment = require("../models/RouteAssignment");
const StudentTransport = require("../models/StudentTransport");
const AssignStudent = require("../models/AssignStudent");
const Student = require("../models/Student");
const TransportFee = require("../models/TransportFee");
const TransportFeePayment = require("../models/TransportFeePayment");
const TransportAttendance = require("../models/TransportAttendance");
const VehicleMaintenance = require("../models/VehicleMaintenance");













// GET ALL VEHICLES
router.get("/vehicles", async (req, res) => {
  try {
    const result = await Vehicle.find({ status: true }).sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Vehicles fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET VEHICLE BY ID
router.get("/vehicle/:id", async (req, res) => {
  try {
    const result = await Vehicle.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Vehicle fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// ADD VEHICLE
router.post("/vehicle/submit", async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      vehicleModel,
      capacity,
      registrationDate,
      insuranceExpiryDate,
      fitnessExpiryDate,
      description,
    } = req.body;

    const existingVehicle = await Vehicle.findOne({
      vehicleNumber: vehicleNumber?.trim().toUpperCase(),
    });

    if (existingVehicle) {
      return res.status(400).json({
        status: 400,
        message: "Vehicle number already exists",
      });
    }

    const result = await Vehicle.create({
      vehicleNumber,
      vehicleType,
      vehicleModel,
      capacity,
      registrationDate,
      insuranceExpiryDate,
      fitnessExpiryDate,
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Vehicle added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE VEHICLE
router.put("/vehicle/update/:id", async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      vehicleModel,
      capacity,
      registrationDate,
      insuranceExpiryDate,
      fitnessExpiryDate,
      description,
    } = req.body;

    const existingVehicle = await Vehicle.findOne({
      vehicleNumber: vehicleNumber?.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });

    if (existingVehicle) {
      return res.status(400).json({
        status: 400,
        message: "Vehicle number already exists",
      });
    }

    const result = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        vehicleNumber,
        vehicleType,
        vehicleModel,
        capacity,
        registrationDate,
        insuranceExpiryDate,
        fitnessExpiryDate,
        description,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Vehicle updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE VEHICLE
router.delete("/vehicle/delete/:id", async (req, res) => {
  try {
    const result = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Vehicle deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});






// GET ALL DRIVERS
router.get("/drivers", async (req, res) => {
  try {
    const result = await Driver.find({ status: true }).sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Drivers fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET DRIVER BY ID
router.get("/driver/:id", async (req, res) => {
  try {
    const result = await Driver.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Driver fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// ADD DRIVER
router.post("/driver/submit", async (req, res) => {
  try {
    const {
      driverName,
      mobileNumber,
      email,
      address,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      joiningDate,
    } = req.body;

    const existingDriver = await Driver.findOne({
      licenseNumber: licenseNumber?.trim().toUpperCase(),
    });

    if (existingDriver) {
      return res.status(400).json({
        status: 400,
        message: "License number already exists",
      });
    }

    const result = await Driver.create({
      driverName,
      mobileNumber,
      email,
      address,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      joiningDate,
    });

    res.status(201).json({
      status: 201,
      message: "Driver added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE DRIVER
router.put("/driver/update/:id", async (req, res) => {
  try {
    const {
      driverName,
      mobileNumber,
      email,
      address,
      licenseNumber,
      licenseType,
      licenseExpiryDate,
      joiningDate,
    } = req.body;

    const existingDriver = await Driver.findOne({
      licenseNumber: licenseNumber?.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });

    if (existingDriver) {
      return res.status(400).json({
        status: 400,
        message: "License number already exists",
      });
    }

    const result = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        driverName,
        mobileNumber,
        email,
        address,
        licenseNumber,
        licenseType,
        licenseExpiryDate,
        joiningDate,
      },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Driver updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE DRIVER
router.delete("/driver/delete/:id", async (req, res) => {
  try {
    const result = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Driver deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});






// GET ALL ROUTES
router.get("/routes", async (req, res) => {
  try {
    const result = await TransportRoute.find({
      status: true,
    }).sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Routes fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET ROUTE BY ID
router.get("/route/:id", async (req, res) => {
  try {
    const result = await TransportRoute.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Route not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Route fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// ADD ROUTE
router.post("/route/submit", async (req, res) => {
  try {
    const {
      routeName,
      routeCode,
      startingPoint,
      endingPoint,
      pickupPoints,
      totalDistance,
      estimatedTravelTime,
      description,
    } = req.body;

    const existingRoute = await TransportRoute.findOne({
      routeCode: routeCode?.trim().toUpperCase(),
    });

    if (existingRoute) {
      return res.status(400).json({
        status: 400,
        message: "Route code already exists",
      });
    }

    const result = await TransportRoute.create({
      routeName,
      routeCode,
      startingPoint,
      endingPoint,
      pickupPoints,
      totalDistance,
      estimatedTravelTime,
      description,
    });

    res.status(201).json({
      status: 201,
      message: "Route added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE ROUTE
router.put("/route/update/:id", async (req, res) => {
  try {
    const {
      routeName,
      routeCode,
      startingPoint,
      endingPoint,
      pickupPoints,
      totalDistance,
      estimatedTravelTime,
      description,
    } = req.body;

    const existingRoute = await TransportRoute.findOne({
      routeCode: routeCode?.trim().toUpperCase(),
      _id: { $ne: req.params.id },
    });

    if (existingRoute) {
      return res.status(400).json({
        status: 400,
        message: "Route code already exists",
      });
    }

    const result = await TransportRoute.findByIdAndUpdate(
      req.params.id,
      {
        routeName,
        routeCode,
        startingPoint,
        endingPoint,
        pickupPoints,
        totalDistance,
        estimatedTravelTime,
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Route not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Route updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE ROUTE
router.delete("/route/delete/:id", async (req, res) => {
  try {
    const result = await TransportRoute.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Route not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Route deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});






// GET ALL ASSIGNMENTS
router.get("/assignments", async (req, res) => {
  try {
    const result = await RouteAssignment.find({ status: true })
      .populate("vehicleId")
      .populate("driverId")
      .populate("routeId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Assignments fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET ASSIGNMENT BY ID
router.get("/assignment/:id", async (req, res) => {
  try {
    const result = await RouteAssignment.findOne({
      _id: req.params.id,
      status: true,
    })
      .populate("vehicleId")
      .populate("driverId")
      .populate("routeId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Assignment fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// ADD ROUTE ASSIGNMENT
router.post("/assignment/submit", async (req, res) => {
  try {
    const {
      vehicleId,
      driverId,
      routeId,
      assignmentDate,
      startTime,
      endTime,
      remarks,
    } = req.body;

    if (
      !vehicleId ||
      !driverId ||
      !routeId ||
      !assignmentDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        status: 400,
        message: "All required fields must be provided",
      });
    }

    // Validate time format and range
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timeRegex.test(startTime) ||
      !timeRegex.test(endTime) ||
      startTime >= endTime
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide valid start and end times",
      });
    }

    // Check active vehicle, driver and route
    const [vehicle, driver, route] = await Promise.all([
      Vehicle.findOne({ _id: vehicleId, status: true }),
      Driver.findOne({ _id: driverId, status: true }),
      TransportRoute.findOne({ _id: routeId, status: true }),
    ]);

    if (!vehicle || !driver || !route) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or inactive vehicle, driver or route",
      });
    }

    const date = new Date(assignmentDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid assignment date",
      });
    }

    // Same date and overlapping time check
    const dateStart = new Date(date);
    dateStart.setUTCHours(0, 0, 0, 0);

    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    const conflict = await RouteAssignment.findOne({
      status: true,
      assignmentDate: {
        $gte: dateStart,
        $lt: dateEnd,
      },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } },
      ],
      $or: [
        { vehicleId },
        { driverId },
      ],
    });

    if (conflict) {
      return res.status(400).json({
        status: 400,
        message: "Vehicle or driver is already assigned during this time",
      });
    }

    const result = await RouteAssignment.create({
      vehicleId,
      driverId,
      routeId,
      assignmentDate: date,
      startTime,
      endTime,
      remarks,
    });

    res.status(201).json({
      status: 201,
      message: "Route assigned successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE ROUTE ASSIGNMENT
router.put("/assignment/update/:id", async (req, res) => {
  try {
    const {
      vehicleId,
      driverId,
      routeId,
      assignmentDate,
      startTime,
      endTime,
      remarks,
    } = req.body;

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timeRegex.test(startTime || "") ||
      !timeRegex.test(endTime || "") ||
      startTime >= endTime
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide valid start and end times",
      });
    }

    const current = await RouteAssignment.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!current) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    const date = new Date(assignmentDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid assignment date",
      });
    }

    const [vehicle, driver, route] = await Promise.all([
      Vehicle.findOne({ _id: vehicleId, status: true }),
      Driver.findOne({ _id: driverId, status: true }),
      TransportRoute.findOne({ _id: routeId, status: true }),
    ]);

    if (!vehicle || !driver || !route) {
      return res.status(400).json({
        status: 400,
        message: "Invalid or inactive vehicle, driver or route",
      });
    }

    const dateStart = new Date(date);
    dateStart.setUTCHours(0, 0, 0, 0);

    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    const conflict = await RouteAssignment.findOne({
      _id: { $ne: req.params.id },
      status: true,
      assignmentDate: { $gte: dateStart, $lt: dateEnd },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } },
      ],
      $or: [{ vehicleId }, { driverId }],
    });

    if (conflict) {
      return res.status(400).json({
        status: 400,
        message: "Vehicle or driver is already assigned during this time",
      });
    }

    const result = await RouteAssignment.findByIdAndUpdate(
      req.params.id,
      {
        vehicleId,
        driverId,
        routeId,
        assignmentDate: date,
        startTime,
        endTime,
        remarks,
      },
      { new: true, runValidators: true }
    )
      .populate("vehicleId")
      .populate("driverId")
      .populate("routeId");

    res.status(200).json({
      status: 200,
      message: "Assignment updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE ASSIGNMENT
router.delete("/assignment/delete/:id", async (req, res) => {
  try {
    const result = await RouteAssignment.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Assignment deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});






// GET ALL STUDENT TRANSPORT
router.get("/student-transports", async (req, res) => {
  try {
    const result = await StudentTransport.find({ status: true })
      .populate("studentId")
      .populate({
        path: "assignStudentId",
        populate: [
          { path: "classId" },
          { path: "sectionId" },
        ],
      })
      .populate("routeId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Student transport fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET STUDENT TRANSPORT BY ID
router.get("/student-transport/:id", async (req, res) => {
  try {
    const result = await StudentTransport.findOne({
      _id: req.params.id,
      status: true,
    })
      .populate("studentId")
      .populate("assignStudentId")
      .populate("routeId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Student transport not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Student transport fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// ADD STUDENT TRANSPORT
router.post("/student-transport/submit", async (req, res) => {
  try {
    const {
      studentId,
      assignStudentId,
      routeId,
      pickupPointId,
      monthlyFee,
      startDate,
      endDate,
      remarks,
    } = req.body;

    if (
      !studentId ||
      !assignStudentId ||
      !routeId ||
      !pickupPointId ||
      monthlyFee === undefined ||
      !startDate
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide all required fields",
      });
    }

    // Check student assignment
    const studentAssignment = await AssignStudent.findOne({
      _id: assignStudentId,
      studentId,
      status: true,
    });

    if (!studentAssignment) {
      return res.status(400).json({
        status: 400,
        message: "Invalid student assignment",
      });
    }

    // Check student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        status: 404,
        message: "Student not found",
      });
    }

    // Check route
    const route = await TransportRoute.findOne({
      _id: routeId,
      status: true,
    });

    if (!route) {
      return res.status(404).json({
        status: 404,
        message: "Active route not found",
      });
    }

    // Check pickup point belongs to selected route
    const pickupPoint = route.pickupPoints.id(pickupPointId);

    if (!pickupPoint) {
      return res.status(400).json({
        status: 400,
        message: "Invalid pickup point for this route",
      });
    }

    // Check duplicate active assignment
    const existing = await StudentTransport.findOne({
      studentId,
      status: true,
    });

    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "Student already has an active transport assignment",
      });
    }

    const result = await StudentTransport.create({
      studentId,
      assignStudentId,
      routeId,
      pickupPointId,
      monthlyFee,
      startDate,
      endDate,
      remarks,
    });

    res.status(201).json({
      status: 201,
      message: "Student transport assigned successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// UPDATE STUDENT TRANSPORT
router.put("/student-transport/update/:id", async (req, res) => {
  try {
    const {
      studentId,
      assignStudentId,
      routeId,
      pickupPointId,
      monthlyFee,
      startDate,
      endDate,
      remarks,
    } = req.body;

    const current = await StudentTransport.findOne({
      _id: req.params.id,
      status: true,
    });

    if (!current) {
      return res.status(404).json({
        status: 404,
        message: "Student transport not found",
      });
    }

    const studentAssignment = await AssignStudent.findOne({
      _id: assignStudentId,
      studentId,
      status: true,
    });

    if (!studentAssignment) {
      return res.status(400).json({
        status: 400,
        message: "Invalid student assignment",
      });
    }

    const route = await TransportRoute.findOne({
      _id: routeId,
      status: true,
    });

    if (!route || !route.pickupPoints.id(pickupPointId)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid route or pickup point",
      });
    }

    const existing = await StudentTransport.findOne({
      _id: { $ne: req.params.id },
      studentId,
      status: true,
    });

    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "Student already has another active transport assignment",
      });
    }

    const result = await StudentTransport.findByIdAndUpdate(
      req.params.id,
      {
        studentId,
        assignStudentId,
        routeId,
        pickupPointId,
        monthlyFee,
        startDate,
        endDate,
        remarks,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 200,
      message: "Student transport updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// SOFT DELETE STUDENT TRANSPORT
router.delete("/student-transport/delete/:id", async (req, res) => {
  try {
    const result = await StudentTransport.findByIdAndUpdate(
      req.params.id,
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Student transport not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Student transport deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

// GET STUDENT TRANSPORT BY STUDENT ID
router.get("/student-transport/student/:studentId", async (req, res) => {
  try {
    const result = await StudentTransport.find({
      studentId: req.params.studentId,
      status: true,
    })
      .populate("studentId")
      .populate("routeId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Student transport history fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});





router.post("/fee/generate", async (req, res) => {
  try {
    const { studentTransportId, billingMonth, dueDate } = req.body;

    if (!studentTransportId || !billingMonth || !dueDate) {
      return res.status(400).json({
        status: 400,
        message: "Please provide all required fields",
      });
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth)) {
      return res.status(400).json({
        status: 400,
        message: "Billing month must be in YYYY-MM format",
      });
    }

    const assignment = await StudentTransport.findOne({
      _id: studentTransportId,
      status: true,
    });

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Active student transport assignment not found",
      });
    }

    const existing = await TransportFee.findOne({
      studentTransportId,
      billingMonth,
    });

    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "Fee invoice already generated for this month",
      });
    }

    const amount = Number(assignment.monthlyFee);

    const result = await TransportFee.create({
      studentTransportId,
      studentId: assignment.studentId,
      billingMonth,
      amountDue: amount,
      amountPaid: 0,
      balance: amount,
      dueDate,
      paymentStatus: amount === 0 ? "Paid" : "Pending",
    });

    res.status(201).json({
      status: 201,
      message: "Transport fee generated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/fees", async (req, res) => {
  try {
    const filter = { status: true };

    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.billingMonth) {
      filter.billingMonth = req.query.billingMonth;
    }

    const result = await TransportFee.find(filter)
      .populate("studentId")
      .populate("studentTransportId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Transport fees fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});




router.post("/fee/collect", async (req, res) => {
  try {
    const {
      transportFeeId,
      amountPaid,
      paymentDate,
      paymentMode,
      transactionId,
      remarks,
    } = req.body;

    const amount = Number(amountPaid);

    if (
      !transportFeeId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !paymentMode
    ) {
      return res.status(400).json({
        status: 400,
        message: "Please provide valid payment details",
      });
    }

    const fee = await TransportFee.findOne({
      _id: transportFeeId,
      status: true,
    });

    if (!fee) {
      return res.status(404).json({
        status: 404,
        message: "Transport fee invoice not found",
      });
    }

    if (amount > fee.balance) {
      return res.status(400).json({
        status: 400,
        message: "Payment amount cannot exceed pending balance",
      });
    }

    const newAmountPaid = fee.amountPaid + amount;
    const newBalance = fee.amountDue - newAmountPaid;

    const payment = await TransportFeePayment.create({
      transportFeeId,
      studentId: fee.studentId,
      receiptNumber: `TRF-${Date.now()}`,
      amountPaid: amount,
      paymentDate: paymentDate || new Date(),
      paymentMode,
      transactionId,
      remarks,
    });

    fee.amountPaid = newAmountPaid;
    fee.balance = newBalance;
    fee.paymentStatus =
      newBalance === 0 ? "Paid" : "Partial";

    await fee.save();

    res.status(201).json({
      status: 201,
      message: "Transport fee collected successfully",
      data: {
        payment,
        fee,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/fees/pending", async (req, res) => {
  try {
    const result = await TransportFee.find({
      status: true,
      balance: { $gt: 0 },
    })
      .populate("studentId")
      .populate("studentTransportId")
      .sort({ dueDate: 1 });

    res.status(200).json({
      status: 200,
      message: "Pending transport fees fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/fee-payments", async (req, res) => {
  try {
    const filter = { status: true };

    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    if (req.query.transportFeeId) {
      filter.transportFeeId = req.query.transportFeeId;
    }

    const result = await TransportFeePayment.find(filter)
      .populate("studentId")
      .populate("transportFeeId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Transport payment history fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.post("/attendance/submit", async (req, res) => {
  try {
    const {
      studentTransportId,
      attendanceDate,
      pickupStatus,
      pickupTime,
      dropStatus,
      dropTime,
      remarks,
    } = req.body;

    if (!studentTransportId || !attendanceDate) {
      return res.status(400).json({
        status: 400,
        message: "Student transport and attendance date are required",
      });
    }

    const assignment = await StudentTransport.findOne({
      _id: studentTransportId,
      status: true,
    });

    if (!assignment) {
      return res.status(404).json({
        status: 404,
        message: "Active student transport assignment not found",
      });
    }

    const date = new Date(attendanceDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance date",
      });
    }

    const validPickup = ["Pending", "Picked", "Absent"];
    const validDrop = ["Pending", "Dropped", "Absent"];

    if (
      (pickupStatus && !validPickup.includes(pickupStatus)) ||
      (dropStatus && !validDrop.includes(dropStatus))
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid pickup or drop status",
      });
    }

    const dateStart = new Date(date);
    dateStart.setUTCHours(0, 0, 0, 0);

    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    const existing = await TransportAttendance.findOne({
      studentTransportId,
      attendanceDate: {
        $gte: dateStart,
        $lt: dateEnd,
      },
    });

    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "Attendance already exists for this student and date",
      });
    }

    const result = await TransportAttendance.create({
      studentTransportId,
      studentId: assignment.studentId,
      routeId: assignment.routeId,
      attendanceDate: date,
      pickupStatus: pickupStatus || "Pending",
      pickupTime,
      dropStatus: dropStatus || "Pending",
      dropTime,
      remarks,
    });

    res.status(201).json({
      status: 201,
      message: "Transport attendance marked successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/attendance", async (req, res) => {
  try {
    const { date, routeId } = req.query;

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Valid attendance date is required",
      });
    }

    const dateStart = new Date(date);
    dateStart.setUTCHours(0, 0, 0, 0);

    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    const filter = {
      status: true,
      attendanceDate: {
        $gte: dateStart,
        $lt: dateEnd,
      },
    };

    if (routeId) filter.routeId = routeId;

    const result = await TransportAttendance.find(filter)
      .populate("studentId")
      .populate("routeId")
      .populate("studentTransportId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Transport attendance fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.put("/attendance/update/:id", async (req, res) => {
  try {
    const {
      pickupStatus,
      pickupTime,
      dropStatus,
      dropTime,
      remarks,
    } = req.body;

    const validPickup = ["Pending", "Picked", "Absent"];
    const validDrop = ["Pending", "Dropped", "Absent"];

    if (
      (pickupStatus && !validPickup.includes(pickupStatus)) ||
      (dropStatus && !validDrop.includes(dropStatus))
    ) {
      return res.status(400).json({
        status: 400,
        message: "Invalid pickup or drop status",
      });
    }

    const updateData = {};

    if (pickupStatus !== undefined) updateData.pickupStatus = pickupStatus;
    if (pickupTime !== undefined) updateData.pickupTime = pickupTime;
    if (dropStatus !== undefined) updateData.dropStatus = dropStatus;
    if (dropTime !== undefined) updateData.dropTime = dropTime;
    if (remarks !== undefined) updateData.remarks = remarks;

    const result = await TransportAttendance.findOneAndUpdate(
      { _id: req.params.id, status: true },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("studentId")
      .populate("routeId");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Attendance record not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Transport attendance updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/attendance/student/:studentId", async (req, res) => {
  try {
    const result = await TransportAttendance.find({
      studentId: req.params.studentId,
      status: true,
    })
      .populate("studentId")
      .populate("routeId")
      .sort({ attendanceDate: -1 });

    res.status(200).json({
      status: 200,
      message: "Student attendance history fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});



router.get("/attendance/route/:routeId", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Valid attendance date is required",
      });
    }

    const dateStart = new Date(date);
    dateStart.setUTCHours(0, 0, 0, 0);

    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    const result = await TransportAttendance.find({
      routeId: req.params.routeId,
      status: true,
      attendanceDate: {
        $gte: dateStart,
        $lt: dateEnd,
      },
    })
      .populate("studentId")
      .populate("routeId")
      .sort({ _id: -1 });

    res.status(200).json({
      status: 200,
      message: "Route attendance report fetched successfully",
      totalStudents: result.length,
      pickedStudents: result.filter(
        (item) => item.pickupStatus === "Picked"
      ).length,
      absentStudents: result.filter(
        (item) => item.pickupStatus === "Absent"
      ).length,
      droppedStudents: result.filter(
        (item) => item.dropStatus === "Dropped"
      ).length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/maintenance/reminders", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    const result = await VehicleMaintenance.find({
      status: true,
      nextServiceDate: {
        $gte: today,
        $lte: next30Days,
      },
    })
      .populate("vehicleId", "vehicleNumber vehicleType vehicleModel")
      .sort({ nextServiceDate: 1 });

    res.status(200).json({
      status: 200,
      message: "Upcoming maintenance reminders fetched successfully",
      total: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.post("/maintenance/submit", async (req, res) => {
  try {
    const {
      vehicleId,
      maintenanceType,
      serviceDate,
      nextServiceDate,
      odometerReading,
      workshopName,
      amount,
      description,
      documentUrl,
      remarks,
    } = req.body;

    if (!vehicleId || !maintenanceType || !serviceDate) {
      return res.status(400).json({
        status: 400,
        message: "Vehicle, maintenance type and service date are required",
      });
    }

    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      status: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        status: 404,
        message: "Active vehicle not found",
      });
    }

    const result = await VehicleMaintenance.create({
      vehicleId,
      maintenanceType,
      serviceDate,
      nextServiceDate: nextServiceDate || null,
      odometerReading,
      workshopName,
      amount,
      description,
      documentUrl,
      remarks,
    });

    res.status(201).json({
      status: 201,
      message: "Vehicle maintenance added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

router.get("/maintenances", async (req, res) => {
  try {
    const { vehicleId, maintenanceType } = req.query;

    const filter = { status: true };

    if (vehicleId) filter.vehicleId = vehicleId;
    if (maintenanceType) filter.maintenanceType = maintenanceType;

    const result = await VehicleMaintenance.find(filter)
      .populate("vehicleId", "vehicleNumber vehicleType vehicleModel")
      .sort({ serviceDate: -1 });

    res.status(200).json({
      status: 200,
      message: "Maintenance records fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/maintenance/:id", async (req, res) => {
  try {
    const result = await VehicleMaintenance.findOne({
      _id: req.params.id,
      status: true,
    }).populate("vehicleId", "vehicleNumber vehicleType vehicleModel");

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Maintenance record not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Maintenance record fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});

router.put("/maintenance/update/:id", async (req, res) => {
  try {
    const result = await VehicleMaintenance.findOneAndUpdate(
      { _id: req.params.id, status: true },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Maintenance record not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Maintenance record updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.delete("/maintenance/delete/:id", async (req, res) => {
  try {
    const result = await VehicleMaintenance.findOneAndUpdate(
      { _id: req.params.id, status: true },
      { status: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 404,
        message: "Maintenance record not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Maintenance record deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});




router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const [
      totalVehicles,
      totalDrivers,
      totalRoutes,
      totalAssignedStudents,
      totalTransportFees,
      pendingTransportFees,
      todayAttendance,
      monthlyMaintenance,
      upcomingServices,
    ] = await Promise.all([
      Vehicle.countDocuments({ status: true }),

      Driver.countDocuments({ status: true }),

      TransportRoute.countDocuments({ status: true }),

      StudentTransport.countDocuments({ status: true }),

      TransportFee.aggregate([
        { $match: { status: true } },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),

      TransportFee.aggregate([
        { $match: { status: true } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),

      TransportAttendance.aggregate([
        {
          $match: {
            status: true,
            attendanceDate: {
              $gte: today,
              $lt: tomorrow,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            picked: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Picked"] }, 1, 0],
              },
            },
            absent: {
              $sum: {
                $cond: [{ $eq: ["$pickupStatus", "Absent"] }, 1, 0],
              },
            },
            dropped: {
              $sum: {
                $cond: [{ $eq: ["$dropStatus", "Dropped"] }, 1, 0],
              },
            },
          },
        },
      ]),

      VehicleMaintenance.aggregate([
        {
          $match: {
            status: true,
            serviceDate: { $gte: monthStart, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      VehicleMaintenance.countDocuments({
        status: true,
        nextServiceDate: {
          $gte: today,
          $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const attendance = todayAttendance[0] || {
      total: 0,
      picked: 0,
      absent: 0,
      dropped: 0,
    };

    res.status(200).json({
      status: 200,
      message: "Transport dashboard fetched successfully",
      data: {
        totalVehicles,
        totalDrivers,
        totalRoutes,
        totalAssignedStudents,

        feeSummary: {
          totalCollected: totalTransportFees[0]?.total || 0,
          pendingAmount: pendingTransportFees[0]?.total || 0,
        },

        todayAttendance: {
          total: attendance.total,
          picked: attendance.picked,
          absent: attendance.absent,
          dropped: attendance.dropped,
        },

        monthlyMaintenanceExpense:
          monthlyMaintenance[0]?.total || 0,

        upcomingServices,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/reports/monthly-fees", async (req, res) => {
  try {
    const result = await TransportFee.aggregate([
      {
        $match: { status: true },
      },
      {
        $group: {
          _id: "$billingMonth",
          totalDue: { $sum: "$amountDue" },
          totalPaid: { $sum: "$amountPaid" },
          totalPending: { $sum: "$balance" },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      status: 200,
      message: "Monthly fee report fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/reports/route-students", async (req, res) => {
  try {
    const result = await StudentTransport.aggregate([
      {
        $match: { status: true },
      },
      {
        $group: {
          _id: "$routeId",
          totalStudents: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "transportroutes",
          localField: "_id",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: {
          path: "$route",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          routeId: "$_id",
          routeName: "$route.routeName",
          routeCode: "$route.routeCode",
          totalStudents: 1,
        },
      },
      {
        $sort: { routeName: 1 },
      },
    ]);

    res.status(200).json({
      status: 200,
      message: "Route-wise student report fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/reports/maintenance-expenses", async (req, res) => {
  try {
    const { vehicleId, fromDate, toDate } = req.query;

    const match = { status: true };

    if (vehicleId) {
      if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
        return res.status(400).json({
          status: 400,
          message: "Invalid vehicle ID",
        });
      }

      match.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    }

    if (fromDate || toDate) {
      match.serviceDate = {};

      if (fromDate) {
        match.serviceDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        match.serviceDate.$lte = endDate;
      }
    }

    const result = await VehicleMaintenance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$maintenanceType",
          totalExpense: { $sum: "$amount" },
          totalRecords: { $sum: 1 },
        },
      },
      { $sort: { totalExpense: -1 } },
    ]);

    res.status(200).json({
      status: 200,
      message: "Maintenance expense report fetched successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});


router.get("/reports/attendance", async (req, res) => {
  try {
    const date = req.query.date
      ? new Date(req.query.date)
      : new Date();

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        status: 400,
        message: "Invalid attendance date",
      });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const result = await TransportAttendance.find({
      status: true,
      attendanceDate: { $gte: start, $lt: end },
    })
      .populate("studentId", "firstName lastName")
      .populate("routeId", "routeName routeCode")
      .sort({ routeId: 1 });

    res.status(200).json({
      status: 200,
      message: "Attendance report fetched successfully",
      totalRecords: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
});








module.exports = router;
