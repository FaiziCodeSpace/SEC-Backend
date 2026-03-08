import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const LeadsSchema = new mongoose.Schema({
  LeadId: {
    type: String,
    default: () => `AUD-${uuidv4().split("-")[0].toUpperCase()}`
  },
  Salesman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Remove the default: "Admin" string entirely
    index: true,
    required: [true, "A lead must be assigned to a salesman"]
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  fullAddress: {
    addressText: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  industryType: {
    type: String,
    default: 'Other'
  },
  decisionMakerMet: {
    type: Boolean,
    default: false
  },
  availabilityTime: {
    type: String,
    default: ''
  },
  contactCaptured: {
    type: Boolean,
    default: false
  },
  decisionMakerContact: {
    type: String,
  },
  currentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', ''],
    default: 'pending'
  },
  energyIntensive: {
    type: String,
    enum: ['Low', 'Mid', 'High', ''],
    default: 'Low'
  },
  investmentPlanned24Months: {
    type: String,
    enum: ['Yes', 'No', 'Not sure yet', ''],
    default: 'Not sure yet'
  },
  estFundingPotential: {
    type: String,
    enum: ['<15k', '15–25k', '>25k', ''],
    default: '<15k'
  },
  auditSold: {
    type: Number,
    enum: [0, 500, 1500, 3000],
    default: 0
  },
  additionalNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Leads = mongoose.model('Leads', LeadsSchema);

export default Leads;