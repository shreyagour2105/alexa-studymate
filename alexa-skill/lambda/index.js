// Alexa skill starter for StudyMate. Deploy this file as an AWS Lambda function
// with Node.js 20+ and set GEMINI_API_KEY as a Lambda environment variable.
const Alexa = require('ask-sdk-core');

async function askGemini(question) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return 'StudyMate AI is not configured yet. Please finish setup in the developer console.';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You are StudyMate, a concise and encouraging study assistant for students. Give safe, age-appropriate educational help. Keep spoken answers brief, with no markdown tables or long lists.' }] },
      contents: [{ role: 'user', parts: [{ text: question.slice(0, 2000) }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 350 }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'AI request failed');
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || 'I could not come up with an answer just now. Please try again.';
}
const LaunchHandler = {
  canHandle(handlerInput) { return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'; },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak('Welcome to StudyMate. Ask me to explain a topic, help plan a study session, or give you a revision strategy.').reprompt('What would you like help studying?').getResponse();
  }
};
const AskStudyMateHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskStudyMateIntent';
  },
  async handle(handlerInput) {
    const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
    if (!question) return handlerInput.responseBuilder.speak('Please ask a study question, such as explain binary search.').reprompt('What would you like to learn?').getResponse();
    try {
      const answer = await askGemini(question);
      return handlerInput.responseBuilder.speak(answer.slice(0, 7000)).reprompt('What else would you like help with?').getResponse();
    } catch (error) {
      console.error('StudyMate Alexa skill error:', error.message);
      return handlerInput.responseBuilder.speak('I could not reach the study assistant right now. Please try again later.').reprompt('Ask me another study question.').getResponse();
    }
  }
};
const HelpHandler = {
  canHandle(handlerInput) { return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'; },
  handle(handlerInput) { return handlerInput.responseBuilder.speak('You can ask me to explain a topic, help you revise, or make a study plan.').reprompt('What are you studying?').getResponse(); }
};
const CancelStopHandler = {
  canHandle(handlerInput) { return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && ['AMAZON.CancelIntent','AMAZON.StopIntent'].includes(Alexa.getIntentName(handlerInput.requestEnvelope)); },
  handle(handlerInput) { return handlerInput.responseBuilder.speak('Good luck with your studies. See you next time.').getResponse(); }
};
const FallbackHandler = {
  canHandle(handlerInput) { return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'; },
  handle(handlerInput) { return handlerInput.responseBuilder.speak('I can help with study questions and revision plans. Try asking, explain recursion.').reprompt('What topic are you studying?').getResponse(); }
};
const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.error('Alexa request error:', error.message);
    return handlerInput.responseBuilder.speak('Sorry, StudyMate had a problem. Please try again.').reprompt('What would you like help with?').getResponse();
  }
};
exports.handler = Alexa.SkillBuilders.custom().addRequestHandlers(LaunchHandler, AskStudyMateHandler, HelpHandler, CancelStopHandler, FallbackHandler).addErrorHandlers(ErrorHandler).lambda();
