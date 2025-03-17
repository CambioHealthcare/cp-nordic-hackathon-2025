# Cambio Platform Reference Application

A simple reference application implementing showcasing how to get access to and use openEHR and HL7 FHIR APIs provided by Cambio Platform.

## Technologies

- Frontend: React with TypeScript
- Backend: Node.js with TypeScript
- Standards: openEHR and HL7 FHIR R4 and OAuth2

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Windows PowerShell

## Getting Started

1. Clone the repository:
```powershell
git clone https://github.com/your-organization/RefApp.git
cd RefApp
```

2. Install dependencies:
```powershell
npm install
```

3. Set up environment variables:
```powershell
Copy-Item .env.example .env
```
Edit the `.env` file with your configuration settings.

4. Start the development server:
```powershell
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
RefApp/
├── src/
│   ├── components/     # React components
│   ├── config/        # Environment configuration
│   ├── hooks/        # Re-usable hooks
│   ├── pages/        # TypeScript pages rendering the different pages of the application
│   ├── services/      # API services
│   └── styles/         # Re-used css files for styling
│   └── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
└── public/           # Static assets
```

## Development

- Start production server: `npm start`


## License

 GNU AFFERO GENERAL PUBLIC LICENSE (AGPL-3.0)

Non-Commercial Use Restriction:
Notwithstanding the terms of the AGPL-3.0, the User may not use, sell, license, or otherwise exploit the software for direct or indirect commercial advantage. This includes, but is not limited to:
-Selling or licensing copies of the software or derivative works.
-Using the software as part of a paid service, whether directly or via third parties.
-Incorporating the software into proprietary systems intended for commercial distribution.
Any violation of this restriction will result in an immediate termination of the granted rights under this license, and the User must cease all use of the software.
