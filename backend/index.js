const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Lead = require("./Models/createLeads");
const User = require("./Models/User");

const AuthRouter = require("./Routes/AuthRouter");
const OptionsRouter = require("./Routes/OptionsRouter");

require("dotenv").config();
require("./Models/db");

const app = express();

// CORS configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));

// Body-parser configuration
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// File upload configuration
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Route handlers
app.use("/auth", AuthRouter);
app.use("/api/options", OptionsRouter);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const checkRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (roles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
};

const checkUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status === "inactive") {
      return res
        .status(403)
        .json({ message: "Access denied. User is inactive." });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking user status", error });
  }
};

// POST lead data with file upload
app.post("/api/leads", upload.single("file"), async (req, res) => {
  try {
    const parsedData = JSON.parse(req.body.data);

    const leadData = {
      companyInfo: {
        leadType: parsedData.company.leadType,
        genericEmail1: parsedData.company.genericEmail1,
        vertical: parsedData.company.vertical,
        companyName: parsedData.company.companyName,
        genericEmail2: parsedData.company.genericEmail2,
        leadAssignedTo: new mongoose.Types.ObjectId(
          parsedData.company.leadAssignedTo
        ),
        website: parsedData.company.website,
        genericPhone1: parsedData.company.genericPhone1,
        bdm: parsedData.company.bdm,
        address: parsedData.company.address,
        genericPhone2: parsedData.company.genericPhone2,
        leadStatus: parsedData.company.leadStatus,
        city: parsedData.company.city,
        leadSource: parsedData.company.leadSource,
        priority: parsedData.company.priority,
        state: parsedData.company.state,
        totalNoOfOffices: Number(parsedData.company.totalNoOfOffices),
        nextAction: parsedData.company.nextAction,
        country: parsedData.company.country,
        turnOverINR: parsedData.company.turnOverINR,
        leadUsable: parsedData.company.leadUsable,
        employeeCount: parsedData.company.employeeCount,
        totalNoOfManufUnits: Number(parsedData.company.totalNoOfManufUnits),
        reason: parsedData.company.reason,
        aboutTheCompany: parsedData.company.aboutTheCompany,
        dateField: parsedData.company.dateField,
      },
      contactInfo: {
        it: {
          name: parsedData.contact.itName,
          dlExt: parsedData.contact.itDlExt,
          designation: parsedData.contact.itDesignation,
          mobile: parsedData.contact.itMobile,
          email: parsedData.contact.itEmail,
          personalEmail: parsedData.contact.itPersonalEmail,
        },
        finance: {
          name: parsedData.contact.financeName,
          dlExt: parsedData.contact.financeDlExt,
          designation: parsedData.contact.financeDesignation,
          mobile: parsedData.contact.financeMobile,
          email: parsedData.contact.financeEmail,
          personalEmail: parsedData.contact.financePersonalEmail,
        },
        businessHead: {
          name: parsedData.contact.businessHeadName,
          dlExt: parsedData.contact.businessHeadDlExt,
          designation: parsedData.contact.businessHeadDesignation,
          mobile: parsedData.contact.businessHeadMobile,
          email: parsedData.contact.businessHeadEmail,
          personalEmail: parsedData.contact.businessHeadPersonalEmail,
        },
      },
      itLandscape: {
        netNew: parsedData.itLandscape.netNew,
        SAPInstalledBase: parsedData.itLandscape.SAPInstalledBase,
      },
      descriptions: [
        {
          description: parsedData.description,
          selectedOption: parsedData.selectedOption,
          radioValue: parsedData.radioValue,
          addedBy: new mongoose.Types.ObjectId(parsedData.createdBy),
        },
      ],
      createdBy: new mongoose.Types.ObjectId(parsedData.createdBy),
    };

    if (req.file) {
      leadData.descriptions[0].file = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      };
    }

    const lead = new Lead(leadData);
    const savedLead = await lead.save();

    await savedLead.populate("descriptions.addedBy", "firstName");
    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      leadNumber: savedLead.leadNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error creating lead",
      details: error.message,
    });
  }
});


// Helper function to safely convert string to ObjectId
const safeObjectId = (id) => {
  try {
    return mongoose.Types.ObjectId(id);
  } catch (error) {
    console.warn(`Invalid ObjectId: ${id}`);
    return id; // Return the original string if conversion fails
  }
};

app.get(
  "/api/leads",
  authenticateToken,
  checkRole(["subuser", "supervisor", "admin"]),
  async (req, res) => {
    try {
      const userId = req.user?._id; // The user ID from the authenticated user
      const userRole = req.user?.role; // The role of the authenticated user

      // Check if userId and userRole are valid
      if (!userId || !userRole) {
        return res.status(400).json({ error: "Invalid user data" });
      }

      // Initialize the query object
      let query = {};

      if (userRole === "admin") {
        // Admin can see all leads, no need to modify the query
      } else {
        // Create an array of userIds including the current user
        let userIds = [new mongoose.Types.ObjectId(userId)]; // Use 'new' to instantiate ObjectId

        if (userRole === "supervisor") {
          // If the user is a supervisor, find their subusers
          const subusers = await User.find({
            supervisor: userId, // Use the plain userId, no need to convert here
            role: "subuser",
          }).select("_id");

          if (subusers.length > 0) {
            // Map subusers to their ObjectIds
            const subuserIds = subusers.map(
              (user) => new mongoose.Types.ObjectId(user._id)
            ); // Use 'new' to instantiate ObjectId
            userIds = [...userIds, ...subuserIds]; // Include subuser IDs in the array
          }
        }

        // Modify the query to find leads created by or assigned to the user(s)
        query = {
          $or: [
            { createdBy: { $in: userIds } }, // Include leads created by the user
            { "companyInfo.leadAssignedTo": { $in: userIds } }, // Include leads assigned to the user(s) (updated field name)
          ],
        };
      }

      // Fetch leads based on the constructed query
      const leads = await Lead.find(query)
        .populate("companyInfo.leadAssignedTo", "firstName lastName") // Populate assigned user (updated field name)
        .populate("createdBy", "firstName lastName") // Populate creator's name
        .sort({ createdAt: -1 })
        .limit(userRole === "admin" ? 0 : 10); // Limit results for non-admins

      // Return the fetched leads
      res.json(leads);
    } catch (error) {
      // Log the error and send a 500 response
      console.error("Error fetching leads:", error);
      res.status(500).json({
        success: false,
        error: "Error fetching leads",
        details: error.message,
      });
    }
  }
);

// GET lead by lead number
app.get("/api/leads/:leadNumber", async (req, res) => {
  try {
    const lead = await Lead.findOne({ leadNumber: req.params.leadNumber })
      .populate("descriptions.addedBy", "firstName")
      .populate("createdBy", "firstName");
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/leads/:leadNumber", async (req, res) => {
  try {
    const lead = await Lead.findOne({ leadNumber: req.params.leadNumber });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Field mapping to handle case sensitivity and naming differences
    const fieldMapping = {
      genericEmail1: "Generic Email 1", // Updated
      genericPhone1: "Generic Phone 1", // Updated
      leadAssignedTo: "Lead Assigned To", // Updated

      bdm: "BDM", // Updated
    };

    // Helper function to recursively update nested objects with field mapping
    const updateNestedObject = (target, source) => {
      Object.keys(source).forEach((key) => {
        const mappedKey = fieldMapping[key] || key;
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          if (!(mappedKey in target)) target[mappedKey] = {};
          updateNestedObject(target[mappedKey], source[key]);
        } else {
          target[mappedKey] = source[key];
        }
      });
    };

    // Update companyInfo
    if (req.body.companyInfo) {
      updateNestedObject(lead.companyInfo, req.body.companyInfo);
    }

    // Update other sections
    const fieldsToUpdate = ["contactInfo", "itLandscape", "descriptions"];
    for (const field of fieldsToUpdate) {
      if (req.body[field]) {
        updateNestedObject(lead[field], req.body[field]);
      }
    }

    // Ensure numeric fields are stored as numbers

    await lead.save();

    res.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(400).json({ error: error.message });
  }
});

// POST new description for a lead
app.post("/api/leads/:leadNumber/descriptions", async (req, res) => {
  try {
    const { leadNumber } = req.params;
    const { description, userId } = req.body;

    if (!description || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lead = await Lead.findOne({ leadNumber });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    lead.descriptions.push({
      description,
      addedBy: userId,
      // Include other fields as necessary
    });

    await lead.save();

    // Populate the user information
    await lead.populate("descriptions.addedBy", "firstName");

    res.json(lead);
  } catch (error) {
    console.error("Error in add description route:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Global error handler for PayloadTooLargeError
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Payload too large",
    });
  }
  next(err);
});

app.get("/api/admin/users", checkRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const {
      firstName,
      lastName,
      designation,
      email,
      mobile,
      password,
      role,
      supervisor,
      status,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Hashed Password:", hashedPassword);

    const newUser = new User({
      firstName,
      lastName,
      designation,
      email,
      mobile,
      password: hashedPassword,
      role,
      supervisor: supervisor || null,
      status: status || "active",
    });

    console.log("User to be saved:", newUser);

    const savedUser = await newUser.save();

    console.log("User saved successfully:", savedUser);

    res.status(201).json(savedUser);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      // Handle duplicate key error
      res.status(400).json({
        error: "Duplicate key error",
        details: error.message,
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const { name, supervisor, role, designation, status } = req.query;

    // Log the incoming query parameters for debugging
    console.log("Received filters:", {
      name,
      supervisor,
      role,
      designation,
      status,
    });

    // Build the query object based on filters
    const query = {};

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }
    if (supervisor) {
      query.supervisor = supervisor;
    }
    if (role) {
      query.role = role;
    }
    if (designation) {
      query.designation = { $regex: designation, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    console.log("MongoDB query:", query);

    const users = await User.find(query, {
      firstName: 1,
      lastName: 1,
      email: 1,
      role: 1,
      status: 1,
    }).populate("supervisor", "firstName lastName");

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching user data",
      details: error.message,
    });
  }
});

app.put("/api/users/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, req.body, {
      new: true,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/supervisors", async (req, res) => {
  try {
    // Fetch users with role as either 'supervisor' or 'admin'
    const supervisors = await User.find(
      { role: { $in: ["supervisor", "admin"] } }, // Correctly filtering by role
      { firstName: 1, lastName: 1, _id: 1 } // Returning only necessary fields
    );
    res.json(supervisors);
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, {
      firstName: 1,
      lastName: 1,
      designation: 1,
      email: 1,
      mobile: 1,
      role: 1,
      supervisor: 1,
      status: 1,
    }).populate("supervisor", "firstName lastName"); // Populating supervisor's details if available

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching user",
      details: error.message,
    });
  }
});

app.get("/api/team-overview", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    let users;

    if (userRole === "admin") {
      users = await User.find({}, "firstName lastName email role").populate(
        "supervisor",
        "firstName lastName"
      );
    } else if (userRole === "supervisor") {
      users = await User.find(
        { supervisor: req.user._id },
        "firstName lastName email role"
      );
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Make sure you send a valid JSON response
    res.json({ users });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching team data", details: error.message });
  }
});

app.get("/api/users/:userId/leads", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch the leads associated with the user
    const leads = await Lead.find({ createdBy: userId })
      .populate("createdBy", "firstName lastName") // Populate user details
      .populate("descriptions.addedBy", "firstName") // Populate descriptions
      .exec(); // Make sure to execute the query

    res.json({ leads }); // Return the full leads array
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: "Error fetching leads" });
  }
});

app.get("/api/leads/inactive", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    // Fetch all inactive users first
    const inactiveUsers = await User.find({ status: "inactive" }).select(
      "_id firstName lastName"
    );

    // For admin: fetch leads created by or assigned to inactive users
    if (userRole === "admin") {
      const inactiveUserIds = inactiveUsers.map((user) => user._id);
      const inactiveUserNames = inactiveUsers.map(
        (user) => `${user.firstName} ${user.lastName}`
      );

      const leads = await Lead.find({
        "companyInfo.priority": { $in: ["hot", "warm", "cold"] }, // Updated field name
        $or: [
          { createdBy: { $in: inactiveUserIds } }, // Leads created by inactive users
          { "companyInfo.leadAssignedTo": { $in: inactiveUserNames } }, // Leads assigned to inactive users (by name, updated field name)
        ],
      }).populate("createdBy", "firstName lastName");

      return res.json(leads);
    }

    // For supervisor: fetch leads created or assigned to inactive sub-users under their supervision
    if (userRole === "supervisor") {
      const subUsers = await User.find({
        supervisor: userId,
        status: "inactive",
      }).select("_id firstName lastName");
      const subUserIds = subUsers.map((user) => user._id);
      const subUserNames = subUsers.map(
        (user) => `${user.firstName} ${user.lastName}`
      );

      const leads = await Lead.find({
        "companyInfo.priority": { $in: ["hot", "warm", "cold"] }, // Updated field name
        $or: [
          { createdBy: { $in: subUserIds } }, // Leads created by supervised sub-users
          { "companyInfo.leadAssignedTo": { $in: subUserNames } }, // Leads assigned to supervised sub-users
        ],
      }).populate("createdBy", "firstName lastName");

      return res.json(leads);
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (error) {
    console.error("Error fetching inactive user leads:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
