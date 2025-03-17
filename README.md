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

- Run tests: `npm test`
- Build for production: `npm run build`
- Start production server: `npm start`


## Contributing

TBD

## License

TBD
