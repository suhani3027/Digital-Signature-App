# Digital Signature App

A full-stack application for uploading, signing, and managing documents with digital signatures.

## Features
- User authentication (register/login)
- Upload PDF documents
- Draw, type, or upload a signature
- Drag-and-drop signature placement
- Download signed documents

## Project Structure
```
Digital-Signature-App/
  backend/    # Node.js/Express API
  frontend/   # React.js client
```

## Prerequisites
- Node.js (v16+ recommended)
- npm
- Git

## Setup Instructions

### 1. Clone the Repository (using SSH)
```sh
git clone git@github.com:your-username/Digital-Signature-App.git
cd Digital-Signature-App
```

### 2. Backend Setup
```sh
cd backend
cp env.example .env
npm install
npm start
```
- Edit `.env` with your MongoDB URI and other secrets as needed.

### 3. Frontend Setup
```sh
cd ../frontend
npm install
npm run dev
```
- The frontend will run on [http://localhost:5173](http://localhost:5173) by default.

## SSH Git Setup
1. Generate an SSH key (if you don't have one):
   ```sh
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. Add your public key to your Git provider (e.g., GitHub > Settings > SSH and GPG keys).
3. Test with:
   ```sh
   ssh -T git@github.com
   ```

## Contributing
Pull requests are welcome! For major changes, open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)