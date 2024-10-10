const mongoose = require("mongoose");
const Counter = require("./counter");

const leadSchema = new mongoose.Schema(
  {
    leadNumber: { type: Number, unique: true, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    }, // New field to track the creator of the lead
    companyInfo: {
      leadType: String, // "Lead Type" changed to leadType
      genericEmail1: String, // "Generic Email 1" changed to genericEmail1
      vertical: String, // "Vertical" remains unchanged (no space)
      companyName: String, // "Company Name" changed to companyName
      genericEmail2: String, // "Generic Email 2" changed to genericEmail2
      leadAssignedTo: {
        // "Lead Assigned To" changed to leadAssignedTo
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      website: String, // "Website" changed to website
      genericPhone1: String, // "Generic Phone 1" changed to genericPhone1
      bdm: String, // "BDM" remains unchanged (no space)
      address: String, // "Address" remains unchanged (no space)
      genericPhone2: String, // "Generic Phone 2" changed to genericPhone2
      leadStatus: String, // "Lead Status" changed to leadStatus
      city: String, // "City" remains unchanged (no space)
      leadSource: String, // "Lead Source" changed to leadSource
      priority: String, // "Priority" remains unchanged (no space)
      state: String, // "State" remains unchanged (no space)
      totalNoOfOffices: { type: Number, default: 0 }, // "totalNoOfOffices" remains unchanged (no space)
      nextAction: String, // "Next Action" changed to nextAction
      country: String, // "Country" remains unchanged (no space)
      turnOverINR: String, // "Turn Over(INR)" changed to turnOverINR
      leadUsable: String, // "Lead Usable" changed to leadUsable
      employeeCount: String, // "Employee Count" changed to employeeCount
      totalNoOfManufUnits: { type: Number, default: 0 }, // "totalNoOfManufUnits" remains unchanged (no space)
      reason: String, // "Reason" remains unchanged (no space)
      aboutTheCompany: String, // "About The Company" changed to aboutTheCompany
      dateField: { type: Date, default: Date.now },
    },
    contactInfo: {
      it: {
        name: { type: String, required: true },
        dlExt: String,
        designation: String,
        mobile: String,
        email: { type: String, required: true },
        personalEmail: String,
      },
      finance: {
        name: { type: String, required: true },
        dlExt: String,
        designation: String,
        mobile: String,
        email: { type: String, required: true },
        personalEmail: String,
      },
      businessHead: {
        name: { type: String, required: true },
        dlExt: String,
        designation: String,
        mobile: String,
        email: { type: String, required: true },
        personalEmail: String,
      },
      otherSections: [
        {
          name: String,
          dlExt: String,
          designation: String,
          mobile: String,
          email: String,
          personalEmail: String,
        },
      ],
    },
    itLandscape: {
      netNew: {
        usingERP: String, // "Using ERP (y/n)" changed to usingERP
        budget: String, // "Budget" remains unchanged (no space)
        ifYesWhichOne: String, // "If yes, which one" changed to ifYesWhichOne
        hardware: String, // "Hardware" remains unchanged (no space)
        authority: String, // "Authority" remains unchanged (no space)
        ifNoWhy: String, // "If no, why" changed to ifNoWhy
        need: String, // "Need" remains unchanged (no space)
        opportunityForUs1: String, // "Opportunity for us 1" changed to opportunityForUs1
        timeframe: String, // "Timeframe" remains unchanged (no space)
        opportunityValue1: String, // "Opportunity Value 1" changed to opportunityValue1
        currentDatabase: String, // "Current Database" changed to currentDatabase
      },
      SAPInstalledBase: {
        opportunityForUs2: String, // "Opportunity for us 2" changed to opportunityForUs2
        yearOfImplementation: String, // "Year of Implementation" changed to yearOfImplementation
        opportunityValue2: String, // "Opportunity Value 2" changed to opportunityValue2
        noOfUsers: String, // "No. of Users" changed to noOfUsers
        opportunityForUs3: String, // "Opportunity for us 3" changed to opportunityForUs3
        contractExpiry: String, // "Contract Expiry" changed to contractExpiry
        opportunityValue3: String, // "Opportunity Value 3" changed to opportunityValue3
        exactVersion: String, // "Exact Version" changed to exactVersion
        hardware: String, // "Hardware" remains unchanged (no space)
        noOfLicense: String, // "No. of License" changed to noOfLicense
        supportPartner: String, // "Support Partner" changed to supportPartner
        licenseValue: String, // "License Value" changed to licenseValue
        modulesImplemented: String, // "Modules Implemented" changed to modulesImplemented
        totalProjectCost: String, // "Total Project Cost" changed to totalProjectCost
        implementationPartner: String, // "Implementation Partner" changed to implementationPartner
      },
    },
    descriptions: [
      {
        description: String,
        createdAt: { type: Date, default: Date.now },
        file: {
          data: Buffer,
          contentType: String,
          filename: String,
        },
        selectedOption: String,
        radioValue: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // Add this line
      },
    ],
  },
  { timestamps: true }
);

leadSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "leadNumber" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.leadNumber = counter.seq;
  }
  next();
});

const Lead = mongoose.model("Lead", leadSchema);

module.exports = Lead;
