import express from 'express';
import { body, validationResult } from 'express-validator';
import Signature from '../models/Signature.js';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// @route   POST /api/signatures
// @desc    Create a new signature request
// @access  Private
router.post('/', protect, [
  body('documentId')
    .isMongoId()
    .withMessage('Valid document ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('position.x')
    .isNumeric()
    .withMessage('X coordinate must be a number'),
  body('position.y')
    .isNumeric()
    .withMessage('Y coordinate must be a number'),
  body('position.page')
    .isInt({ min: 1 })
    .withMessage('Page number must be at least 1'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid date')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { documentId, email, name, position, expiresAt } = req.body;

    // Check if document exists and user owns it
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if signature already exists for this document and email
    const existingSignature = await Signature.findOne({
      documentId,
      email: email.toLowerCase()
    });

    if (existingSignature) {
      return res.status(400).json({ message: 'Signature request already exists for this email' });
    }

    // Create signature request
    const signature = await Signature.create({
      documentId,
      signerId: null, // Will be set when user signs up/logs in
      requestedBy: req.user.id,
      email: email.toLowerCase(),
      name,
      position,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
      signatureContent: `Signature requested for ${name}`,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Signature request created successfully',
      signature: {
        id: signature._id,
        documentId: signature.documentId,
        email: signature.email,
        name: signature.name,
        status: signature.status,
        expiresAt: signature.expiresAt,
        createdAt: signature.createdAt
      }
    });
  } catch (error) {
    console.error('Create signature error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/signatures/document/:documentId
// @desc    Get all signatures for a document
// @access  Private
router.get('/document/:documentId', protect, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Check if document exists and user owns it
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signatures = await Signature.find({ documentId })
      .populate('signerId', 'name email')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ signatures });
  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/signatures/pending
// @desc    Get pending signatures for current user
// @access  Private
router.get('/pending', protect, async (req, res) => {
  try {
    const signatures = await Signature.find({
      email: req.user.email,
      status: 'pending'
    })
    .populate('documentId', 'title description fileName')
    .populate('requestedBy', 'name email')
    .sort({ createdAt: -1 });

    res.json({ signatures });
  } catch (error) {
    console.error('Get pending signatures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/signatures/:id
// @desc    Get signature by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id)
      .populate('documentId', 'title description fileName')
      .populate('signerId', 'name email')
      .populate('requestedBy', 'name email');

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    // Check if user has access to this signature
    const document = await Document.findById(signature.documentId._id);
    if (document.uploadedBy.toString() !== req.user.id && 
        signature.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ signature });
  } catch (error) {
    console.error('Get signature error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/signatures/:id/sign
// @desc    Sign a document
// @access  Private
router.put('/:id/sign', protect, [
  body('signatureContent')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Signature content is required and must be less than 500 characters'),
  body('signatureType')
    .optional()
    .isIn(['text', 'image', 'drawing'])
    .withMessage('Invalid signature type')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { signatureContent, signatureType = 'text' } = req.body;

    const signature = await Signature.findById(req.params.id);

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    // Check if user is the intended signer
    if (signature.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if signature is still pending and not expired
    if (signature.status !== 'pending') {
      return res.status(400).json({ message: 'Signature is not pending' });
    }

    if (signature.isExpired) {
      return res.status(400).json({ message: 'Signature request has expired' });
    }

    // Update signature
    signature.signatureContent = signatureContent;
    signature.signatureType = signatureType;
    signature.status = 'signed';
    signature.signedAt = new Date();
    signature.signerId = req.user.id;
    signature.ipAddress = req.ip;
    signature.userAgent = req.get('User-Agent');

    await signature.save();

    // Update document status if all signatures are complete
    const document = await Document.findById(signature.documentId);
    const pendingSignatures = await Signature.countDocuments({
      documentId: signature.documentId,
      status: 'pending'
    });

    if (pendingSignatures === 0) {
      document.status = 'signed';
      await document.save();
    }

    res.json({
      message: 'Document signed successfully',
      signature: {
        id: signature._id,
        status: signature.status,
        signedAt: signature.signedAt
      }
    });
  } catch (error) {
    console.error('Sign document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/signatures/:id/reject
// @desc    Reject a signature request
// @access  Private
router.put('/:id/reject', protect, [
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot be more than 500 characters')
], async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const signature = await Signature.findById(req.params.id);

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    // Check if user is the intended signer
    if (signature.email !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if signature is still pending
    if (signature.status !== 'pending') {
      return res.status(400).json({ message: 'Signature is not pending' });
    }

    // Update signature
    signature.status = 'rejected';
    signature.rejectedAt = new Date();
    signature.rejectionReason = rejectionReason || '';
    signature.signerId = req.user.id;

    await signature.save();

    res.json({
      message: 'Signature request rejected',
      signature: {
        id: signature._id,
        status: signature.status,
        rejectedAt: signature.rejectedAt
      }
    });
  } catch (error) {
    console.error('Reject signature error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/signatures/:id
// @desc    Delete signature request
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found' });
    }

    // Check if user owns the document
    const document = await Document.findById(signature.documentId);
    if (document.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Signature.findByIdAndDelete(req.params.id);

    res.json({ message: 'Signature request deleted successfully' });
  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 