import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'signed', 'completed', 'expired'],
    default: 'draft'
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    pageCount: {
      type: Number,
      default: 1
    },
    originalName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ uploadedBy: 1, status: 1 });
documentSchema.index({ status: 1, expiresAt: 1 });
documentSchema.index({ title: 'text', description: 'text' });

// Virtual for checking if document is expired
documentSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

const Document = mongoose.model('Document', documentSchema);

export default Document; 