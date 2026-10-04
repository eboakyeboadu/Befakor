# Befakor

Befakor is a student marketplace platform designed to help communities buy, sell, and discover goods and services in a trusted, campus-focused environment. The app is built around a modern React frontend, a lightweight Node/Express backend, and Firebase services for authentication, storage, and data persistence.

---

## Why this project exists

The goal of Befakor is to make local exchange easier and safer for students and communities by combining:

- user authentication and profile management
- listing creation and discovery
- media uploads for product or service posts
- search and filtering for relevant listings
- support for digital payments and checkout flows
- a scalable foundation for future marketplace features

---

## Core features

- Secure user sign-in and account management with Firebase Auth
- Marketplace listings with rich metadata and media support
- Upload and storage of images and other assets
- Search, filtering, and browsing experience optimized for discovery
- Payment-ready integration using Stripe
- Google Maps integration for location-aware experiences
- Vite + React front end with TypeScript for a fast developer workflow
- Express server for API and backend logic

---

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express
- Authentication & data: Firebase Auth, Firestore, Firebase Storage
- Payments: Stripe
- Map integration: Google Maps React
- Media handling: Multer

---

## Project structure

```text
Befakor/
├── src/                 # Frontend application source
├── public/              # Static public assets
├── server.ts            # Express server entrypoint
├── package.json         # Scripts and dependency definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config
├── .env.example         # Sample environment variables
├── README.md            # Project documentation
└── LICENSE              # License details
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file based on `.env.example` and add your project credentials, including Firebase and Stripe configuration values as needed by the app.

### 3. Run the app locally

```bash
npm run dev
```

This starts the development server for the app.

### 4. Build for production

```bash
npm run build
```

### 5. Start production server

```bash
npm start
```

---

## Available scripts

```bash
npm run dev      # Start the application in development mode
npm run build    # Build the frontend and backend bundle
npm run start    # Run the compiled production server
npm run lint     # Type-check the TypeScript project
npm run clean    # Remove generated build artifacts
```

---

## Security notice

This project is a demo or development application and should not be treated as a public, no-auth marketplace without additional hardening.

Before deploying publicly, make sure to:

- use a dedicated Firebase project for demo or production data
- restrict Firestore and Storage access to authenticated users only
- remove real user data and sample listings from the database
- never commit secrets or production credentials to the repository
- review Firebase rules and Stripe configuration before launch

If you plan to share this repo publicly, replace any environment-specific credentials with placeholders and keep deployment configuration separate from source control.

---

## Contributing

Contributions are welcome. If you want to improve the app, add new marketplace features, or refine the user experience, feel free to open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
