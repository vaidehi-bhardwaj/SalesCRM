const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const AuthRouter = require("./Routes/AuthRouter");
const OptionsRouter = require("./Routes/OptionsRouter");
const Lead = require("./Models/createLeads");
const multer = require("multer");
const User = require("./Models/User");
const mongoose = require("mongoose");
// CORS configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(corsOptions));

require("dotenv").config();
require("./Models/db");

const PORT = process.env.PORT || 8080;

// Configure body-parser with a payload limit of 50MB
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Middleware to log request size

// Configure multer for file uploads with a limit of 50MB
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB file size limit
});

// Route handlers
app.use("/auth", AuthRouter);
app.use("/api/options", OptionsRouter);

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

// GET all leads with specific fields and a limit of 10 results
app.get("/api/leads", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      console.log("No user ID provided");
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch the user to get their name
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const query = {
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { "companyInfo.Lead Assigned To": { $in: [userId, user.name] } },
      ],
    };

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
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching leads",
      details: error.message,
    });
  }
});

// GET lead by lead number
app.get("/api/leads/:leadNumber", async (req, res) => {
  try {
    const lead = await Lead.findOne({ leadNumber: req.params.leadNumber })
      .populate("descriptions.addedBy", "name")
      .populate("createdBy", "name");
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
    await lead.populate("descriptions.addedBy", "name");

    res.json(lead);
  } catch (error) {
    console.error("Error in add description route:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// GET all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, _id: 0 });
    const userNames = users.map((user) => user.name);
    res.json(userNames);
  } catch (error) {
    console.error("Error fetching user names:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching user names",
      details: error.message,
    });
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

app.get("/api/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, { name: 1, _id: 0 });
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
