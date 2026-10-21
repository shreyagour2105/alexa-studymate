# Alexa+ StudyMate (upgraded starter)

An independent, Alexa-inspired student productivity project. It is **not an official Amazon Alexa product**.

## What is included

- Real Gemini AI responses through a server-side API. The API key is kept in `.env`, not in browser JavaScript.
- Recent chat context sent to the model for follow-up questions.
- Browser voice input using Web Speech API where supported.
- Optional spoken AI replies using browser speech synthesis.
- Assignment create/complete/filter/delete with server-side JSON persistence on the machine running the server. A local-browser copy is also kept as a fallback.
- Study planner and responsive dark/light UI.
- A separate Alexa Skills Kit starter under `alexa-skill/`, including a Lambda handler and interaction model.

## Run on your Mac

You need Node.js 20 or newer and an internet connection for Gemini.

1. Open Terminal and move into the extracted project folder, for example:
   ```bash
   cd ~/Downloads/alexa_studymate
   ```
2. Install server dependencies:
   ```bash
   npm install
   ```
3. Create your private environment file:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` in a text editor and paste your Gemini API key after `GEMINI_API_KEY=`. Get a key from Google AI Studio. A Google AI Pro subscription does not automatically mean a Gemini API key or API quota is included; check the API project's terms and usage limits.
5. Start the app:
   ```bash
   npm start
   ```
6. Open **http://localhost:8000**. Keep Terminal open while using the app.

To stop the server, press `Control + C` in Terminal. After changing `.env`, restart the server.

## Test the backend

With the server running, visit `http://localhost:8000/api/health`. It should return JSON with `"ok":true` and `"aiConfigured":true` after you set the API key.

## Voice notes

- Tap the microphone to dictate a message. The browser may ask for microphone permission.
- The **Voice on/off** control toggles spoken assistant replies.
- Speech recognition support varies by browser. Use a recent Chrome/Edge browser if the microphone control is unavailable. Speech synthesis may work in more browsers.

## Data storage and privacy

Assignments are stored in `data/tasks.json` on the machine running the server, with a browser-local fallback. This survives app/server restarts on that machine, but it is **not a cloud database and does not sync between devices**. The starter has no login or multi-user isolation. The web server binds to `127.0.0.1` so it is local to your Mac by default. Keep it that way; do not expose it to the public internet or use real sensitive student records without adding authentication and a proper database with access controls. Do not commit `.env` or share your API key.

## Alexa skill setup (separate from the web app)

The `alexa-skill/` folder is a starter, not a deployed skill.

1. Sign in to the Amazon Developer Console and create a custom Alexa skill.
2. Choose a custom model and copy the content of `alexa-skill/interaction-model.json` into the skill's JSON editor. Build the interaction model.
3. Deploy `alexa-skill/lambda/index.js` as an AWS Lambda function using Node.js 20+, install the dependency from `alexa-skill/package.json`, and set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the Lambda environment variables.
4. Configure the skill endpoint to use that Lambda function, then test in the Alexa developer console simulator.
5. Test phrases such as “Alexa, open Study Mate” and “Alexa, ask Study Mate to explain binary search.”

Amazon account requirements, skill availability, review, and deployment are controlled by Amazon. This repository cannot connect or publish the skill for you.

## Current limits

- No login, calendar/LMS/email integration, or cloud sync.
- Alexa skill and web app are separate; they do not yet share assignment data.
- AI responses depend on Gemini API availability, key configuration, model access, network, and quota.
- This is a learning prototype, not a production service. Before public deployment, add authentication, request limits, privacy controls, and managed persistent storage.
