// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  rawText: {
    type: String
  },
  parsedData: {
    name:                 String,
    email:                String,
    phone:                String,
    skills:               [String],
    totalYearsExperience: Number,
    education:            [mongoose.Schema.Types.Mixed],
    experience:           [mongoose.Schema.Types.Mixed]
  },
  nlpMeta: {
    keywordsExtracted: [String],
    processedAt:       Date
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);