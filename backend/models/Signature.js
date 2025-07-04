import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Document ID is required']
  },
  signerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // was true, now optional for public/pending signatures
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requestor ID is required']
  },
  position: {
    x: {
      type: Number,
      required: [true, 'X coordinate is required']
    },
    y: {
      type: Number,
      required: [true, 'Y coordinate is required']
    },
    page: {
      type: Number,
      required: [true, 'Page number is required'],
      min: [1, 'Page number must be at least 1']
    },
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 100
    }
  },
  signatureType: {
    type: String,
    enum: ['text', 'image', 'drawing'],
    default: 'text'
  },
  signatureContent: {
    type: String,
    required: false // was true, now optional for public/pending signatures
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected', 'expired'],
    default: 'pending'
  },
  signedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot be more than 500 characters']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required']
  },
  email: {
    type: String,
    required: [true, 'Signer email is required'],
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Signer name is required'],
    trim: true
  },
  // --- Add for public signature links ---
  publicToken: {
    type: String,
    index: true,
    unique: true,
    sparse: true
  },
  publicTokenExpiresAt: {
    type: Date
  },
  // --- End public signature fields ---
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    signatureMethod: {
      type: String,
      enum: ['typed', 'drawn', 'uploaded'],
      default: 'typed'
    },
    deviceInfo: String,
    location: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
signatureSchema.index({ documentId: 1, status: 1 });
signatureSchema.index({ signerId: 1, status: 1 });
signatureSchema.index({ status: 1, expiresAt: 1 });
signatureSchema.index({ email: 1 });

// Virtual for checking if signature is expired
signatureSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for checking if signature is overdue
signatureSchema.virtual('isOverdue').get(function() {
  return this.status === 'pending' && this.isExpired;
});

// Ensure virtual fields are serialized
signatureSchema.set('toJSON', { virtuals: true });
signatureSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set expiration if not provided
signatureSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default: 7 days
    this.expiresAt = date;
  }
  next();
});

const Signature = mongoose.model('Signature', signatureSchema);

export default Signature; 