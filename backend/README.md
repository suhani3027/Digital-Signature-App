# Digital Signature App - Backend

A Node.js/Express backend for the Digital Signature App (DocuSign Clone) with MongoDB database.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📄 **PDF Document Management** - Upload, store, and manage PDF documents
- ✍️ **Digital Signatures** - Create and manage signature requests
- 📧 **Email Notifications** - Notify signers via email
- 🔒 **Role-based Access** - User and admin roles
- 📊 **Audit Trail** - Track signature activities
- 🛡️ **Security** - Rate limiting, input validation, CORS protection

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **PDF Processing**: PDF-Lib
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Digital-Signature-App/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/digital-signature-app
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   
   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   
   # Security
   BCRYPT_ROUNDS=12
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Documents
- `POST /api/documents/upload` - Upload a new document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document

### Signatures
- `POST /api/signatures` - Create signature request
- `GET /api/signatures/document/:documentId` - Get document signatures
- `GET /api/signatures/pending` - Get pending signatures
- `GET /api/signatures/:id` - Get signature details
- `PUT /api/signatures/:id/sign` - Sign document
- `PUT /api/signatures/:id/reject` - Reject signature
- `DELETE /api/signatures/:id` - Delete signature request

### Health Check
- `GET /api/health` - Server health status

## Database Models

### User
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (user/admin)
- `isVerified` - Email verification status
- `avatar` - Profile picture URL

### Document
- `title` - Document title
- `description` - Document description
- `fileName` - Stored filename
- `filePath` - File system path
- `fileSize` - File size in bytes
- `uploadedBy` - User who uploaded
- `status` - Document status (draft/pending/signed/completed/expired)
- `expiresAt` - Expiration date
- `tags` - Document tags

### Signature
- `documentId` - Reference to document
- `signerId` - Reference to signer user
- `requestedBy` - Reference to requester
- `position` - Signature position (x, y, page)
- `signatureType` - Type of signature (text/image/drawing)
- `signatureContent` - Actual signature content
- `status` - Signature status (pending/signed/rejected/expired)
- `email` - Signer's email
- `name` - Signer's name
- `expiresAt` - Signature expiration

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Input Validation** - Express-validator for all inputs
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Configurable cross-origin requests
- **Helmet** - Security headers
- **File Type Validation** - Only PDF files allowed
- **File Size Limits** - Configurable upload limits

## File Structure

```
backend/
├── models/          # Database models
│   ├── User.js
│   ├── Document.js
│   └── Signature.js
├── routes/          # API routes
│   ├── auth.js
│   ├── documents.js
│   └── signatures.js
├── middleware/      # Custom middleware
│   └── auth.js
├── uploads/         # File uploads directory
├── server.js        # Main server file
├── package.json     # Dependencies
├── env.example      # Environment variables example
└── README.md        # This file
```

## Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Production Deployment

1. **Set environment variables for production**
2. **Use MongoDB Atlas for database**
3. **Set up proper CORS origins**
4. **Configure email service**
5. **Set up file storage (consider cloud storage)**
6. **Enable HTTPS**
7. **Set up monitoring and logging**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 