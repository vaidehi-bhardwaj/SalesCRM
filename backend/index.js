const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const AuthRouter = require("./Routes/AuthRouter");
const OptionsRouter = require("./Routes/OptionsRouter");
const Lead = require("./Models/createLeads");
const multer = require("multer");
const User = require("./Models/User");

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
app.use((req, res, next) => {
  console.log(`Request size: ${req.get("content-length")} bytes`);
  next();
});

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
    console.log("Incoming lead data:", req.body.data);
    const parsedData = JSON.parse(req.body.data);
    console.log("Parsed data:", JSON.stringify(parsedData, null, 2));

    const leadData = {
      companyInfo: parsedData.company,
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
    console.log("Saved lead:", JSON.stringify(savedLead, null, 2));

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      leadNumber: savedLead.leadNumber,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
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
    const leads = await Lead.find(
      {},
      {
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
      }
    )
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
    const lead = await Lead.findOne({ leadNumber: req.params.leadNumber });
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

    console.log("Received update data:", JSON.stringify(req.body, null, 2));
    console.log("Lead before update:", JSON.stringify(lead, null, 2));

    // Field mapping to handle case sensitivity and naming differences
    const fieldMapping = {
      "Generic email 1": "Generic Email 1",
      "Generic phone 1": "Generic Phone 1",
      "Lead Assigned to": "Lead Assigned To",
      "Total no. of Manuf. Units": "Total no. of Manuf. Units",
      "Total no. of offices": "Total no. of Offices",
      "BDM": "BDM"
    };

    // Helper function to recursively update nested objects with field mapping
    const updateNestedObject = (target, source) => {
      Object.keys(source).forEach(key => {
        const mappedKey = fieldMapping[key] || key;
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
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
    const fieldsToUpdate = ['contactInfo', 'itLandscape', 'descriptions'];
    for (const field of fieldsToUpdate) {
      if (req.body[field]) {
        updateNestedObject(lead[field], req.body[field]);
      }
    }

    // Ensure numeric fields are stored as numbers
    lead.companyInfo["Total no. of Manuf. Units"] = Number(lead.companyInfo["Total no. of Manuf. Units"]);
    lead.companyInfo["Total no. of Offices"] = Number(lead.companyInfo["Total no. of Offices"]);

    await lead.save();
    console.log("Lead after update:", JSON.stringify(lead, null, 2));
    res.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(400).json({ error: error.message });
  }
});


// POST new description for a lead
app.post("/api/leads/:leadNumber/descriptions", async (req, res) => {
  try {
    const lead = await Lead.findOne({ leadNumber: req.params.leadNumber });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    lead.descriptions.push({
      description: req.body.description,
      createdAt: new Date(),
    });

    await lead.save();
    res.json(lead);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

