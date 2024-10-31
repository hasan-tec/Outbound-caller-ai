# OpenAI Realtime API Twilio Phone Call Assistant

A phone call application that integrates OpenAI's Realtime API with Twilio for outbound calling capabilities. This project uses a monorepo structure managed by Turborepo.

## Prerequisites

Before you begin, you'll need:
- OpenAI API Key with Realtime API access
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number
- Server URL (for webhook endpoints)

> **Important**: Ensure your Twilio phone number has the appropriate Voice Geographic Permissions configured in your [Twilio Console](https://console.twilio.com/us1/develop/voice/settings/geo-permissions).

## Tech Stack
- NestJS (Backend)
- SQLite Database
- Express
- Turbo (Monorepo)

## Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Initialize database:
```bash
npm start
```

5. Start the application:
```bash
npm start
```

## Local Development

1. Start ngrok to expose your local server:
```bash
ngrok http 3000
```

2. Access the web interface:
```
http://localhost:3000
```

3. Configure the application:
   - Click the config button in the top right corner
   - Enter your credentials:
     - OpenAI API Key
     - Twilio Account SID
     - Twilio Auth Token
     - Twilio Phone Number
     - Server URL

4. Create an agent and initiate phone calls through the interface.

## Disclaimer

This application is experimental and should be used ethically. Please ensure compliance with all applicable laws and regulations regarding AI-powered calling systems.

## References

This project is built with inspiration from:
- [OpenAI Realtime Console](https://github.com/openai/openai-realtime-console)
- [Twilio Speech Assistant Sample](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-node.git)

## License

MIT
