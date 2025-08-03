// transformer_chatbot.js with voice input/output

import readline from 'readline';
import axios from 'axios';
import dotenv from 'dotenv';
import say from 'say';
import record from 'node-record-lpcm16';
import SpeechToText from 'speech-to-text';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("[ERROR] OPENAI_API_KEY not set in environment variables.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const chatHistory = [];
let useVoice = false;

async function generateResponse(userInput, history) {
  const messages = [];
  for (const turn of history) {
    messages.push({ role: 'user', content: turn.user });
    messages.push({ role: 'assistant', content: turn.bot });
  }
  messages.push({ role: 'user', content: userInput });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    return `[ERROR] ${error.message}`;
  }
}

function startVoiceInput() {
  console.log("🎙️ Listening... Say something or type 'exit' to quit.\n");
  const listener = new SpeechToText(onSpeech, onError);

  record
    .start({ sampleRateHertz: 16000, threshold: 0.5, verbose: false, recordProgram: 'sox' })
    .pipe(listener);

  function onSpeech(text) {
    if (text.trim().toLowerCase() === 'exit') {
      process.exit(0);
    }
    processUserInput(text);
  }

  function onError(err) {
    console.error('Speech error:', err);
  }
}

async function processUserInput(input) {
  const reply = await generateResponse(input.trim(), chatHistory);
  console.log(`You: ${input}`);
  console.log(`Bot: ${reply}\n`);
  say.speak(reply);
  chatHistory.push({ user: input.trim(), bot: reply });

  if (!useVoice) rl.prompt();
}

function startTypingMode() {
  rl.setPrompt("You: ");
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    await processUserInput(input);
  });
}

function askInputMode() {
  rl.question("Choose input mode — Type (t) or Voice (v): ", (answer) => {
    if (answer.toLowerCase() === 'v') {
      useVoice = true;
      rl.close();
      startVoiceInput();
    } else {
      useVoice = false;
      startTypingMode();
    }
  });
}

console.log("\n🤖 Transformer Chatbot | POWERED BY OKID");
console.log("This chatbot can answer questions, explain concepts, write code, translate, and more.");
console.log("Type 'exit' to end the chat.\n");
askInputMode();
