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
        "Lead Type": parsedData.company["Lead Type"],
        "Generic Email 1": parsedData.company["Generic email 1"],
        Vertical: parsedData.company.Vertical,
        "Company Name": parsedData.company["Company Name"],
        "Generic Email 2": parsedData.company["Generic email 2"],
        "Lead Assigned To": parsedData.company["Lead Assigned to"],
        Website: parsedData.company.Website,
        "Generic Phone 1": parsedData.company["Generic phone 1"],
        BDM: parsedData.company.BDM,
        Address: parsedData.company.Address,
        "Generic Phone 2": parsedData.company["Generic phone 2"],
        "Lead Status": parsedData.company["Lead Status"],
        City: parsedData.company.City,
        "Lead Source": parsedData.company["Lead Source"],
        Priority: parsedData.company.Priority,
        State: parsedData.company.State,
        totalNoOfOffices: Number(parsedData.company.totalNoOfOffices),
        "Next Action": parsedData.company["Next Action"],
        Country: parsedData.company.Country,
        "Turn Over(INR)": parsedData.company["Turn Over(INR)"],
        "Lead Usable": parsedData.company["Lead Usable"],
        "Employee Count": parsedData.company["Employee Count"],
        totalNoOfManufUnits: Number(parsedData.company.totalNoOfManufUnits),

        Reason: parsedData.company.Reason,
        "About The Company": parsedData.company["About The Company"],
        dateField: parsedData.company.dateField,
      },
      contactInfo: {
        it: {
          name: parsedData.contact.itName,
          email: parsedData.contact.itEmail,
        },
        finance: {
          name: parsedData.contact.financeName,
          email: parsedData.contact.financeEmail,
        },
        businessHead: {
          name: parsedData.contact.businessHeadName,
          email: parsedData.contact.businessHeadEmail,
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
          addedBy: parsedData.createdBy,
        },
      ],
      createdBy: parsedData.createdBy,
    };

    if (req.file) {
      leadData.descriptions[0].file = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      };
    }

    // Validate required fields
    const requiredFields = [
      "contactInfo.it.name",
      "contactInfo.it.email",
      "contactInfo.finance.name",
      "contactInfo.finance.email",
      "contactInfo.businessHead.name",
      "contactInfo.businessHead.email",
    ];

    for (const field of requiredFields) {
      const [section, role, key] = field.split(".");
      if (!leadData[section][role][key]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const lead = new Lead(leadData);

    const savedLead = await lead.save();

    await savedLead.populate("descriptions.addedBy", "name");
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
      const userId = req.user?._id;
      const userRole = req.user?.role;
      const userName = req.user?.firstName;

      if (!userId || !userName || !userRole) {
        console.error("Invalid user data:", { userId, userRole, userName });
        return res.status(400).json({
          success: false,
          error: "Invalid user data",
          details: { userId, userRole, userName },
        });
      }

      let query = {};

      if (userRole === "admin") {
        // Admin can see all leads, so we don't need to filter
      } else {
        let usersToInclude = [userName];
        let userIds = [safeObjectId(userId)];

        if (userRole === "supervisor") {
          const subusers = await User.find({
            supervisor: safeObjectId(userId),
            role: "subuser",
          }).select("_id firstName");

          if (subusers.length > 0) {
            const subuserNames = subusers
              .map((user) => user.firstName)
              .filter(Boolean);
            const subuserIds = subusers.map((user) => user._id).filter(Boolean);
            usersToInclude = [...usersToInclude, ...subuserNames];
            userIds = [...userIds, ...subuserIds];
          }
        }

        query = {
          $or: [
            { createdBy: { $in: userIds } },
            { "companyInfo.Lead Assigned To": { $in: usersToInclude } },
            { createdBy: safeObjectId(userId) },
            { "companyInfo.Lead Assigned To": userName },
          ],
        };
      }

      const leads = await Lead.find(query, {
        leadNumber: 1,
        "companyInfo.Company Name": 1,
        "companyInfo.Lead Assigned To": 1,
        "companyInfo.Generic Phone 1": 1,
        "companyInfo.Generic Phone 2": 1,
        "companyInfo.Priority": 1,
        "companyInfo.Next Action": 1,
        "companyInfo.dateField": 1,
        "contactInfo.it.name": 1,
        "contactInfo.it.email": 1,
        "itLandscape.netNew.Using ERP (y/n)": 1,
        descriptions: 1,
        createdAt: 1,
        createdBy: 1,
      })
        .populate({
          path: "createdBy",
          select: "firstName",
        })
        .sort({ createdAt: -1 })
        .limit(userRole === "admin" ? 0 : 10); // Remove limit for admin users

      const filteredLeads = leads.filter((lead) => lead.createdBy !== null);

      res.json(filteredLeads);
    } catch (error) {
      console.error("Error in /api/leads route:", error);
      res.status(500).json({
        success: false,
        error: "Error fetching leads",
        details: error.message,
        stack: error.stack,
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
      "Generic email 1": "Generic Email 1",
      "Generic phone 1": "Generic Phone 1",
      "Lead Assigned to": "Lead Assigned To",

      BDM: "BDM",
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

// GET all users

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






// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));