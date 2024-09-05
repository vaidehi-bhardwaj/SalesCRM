const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const AuthRouter = require("./Routes/AuthRouter");
const OptionsRouter = require("./Routes/OptionsRouter");
const Lead = require("./Models/createLeads");
const multer = require("multer");
const upload = multer();
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

app.use(bodyParser.json());
app.use("/auth", AuthRouter);
app.use(express.json());
app.use("/api/options", OptionsRouter);

app.post("/api/leads", upload.single("file"), async (req, res) => {
  console.log("Incoming lead data:", req.body.data);
  try {
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

    console.log("Processed lead data:", JSON.stringify(leadData, null, 2));

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

app.get("/api/leads", async (req, res) => {
  try {
    const leads = await Lead.find(
      {},
      {
        leadNumber: 1,
        "companyInfo.Company Name": 1,
        "contactInfo.it.name": 1,
        "contactInfo.it.email": 1,
        "itLandscape.netNew.Using ERP (y/n)": 1,
        "descriptionSection.description": 1,
        createdAt: 1,
        createdBy: 1, // Add this line to include the user ID in the response
      }
    )
      .sort({ createdAt: -1 })
      .limit(10);

    console.log("Leads being sent:", JSON.stringify(leads, null, 2));
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

