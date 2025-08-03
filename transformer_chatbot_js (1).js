// transformer_chatbot.js

import readline from 'readline';
import axios from 'axios';
import dotenv from 'dotenv';

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

/**
 * Generates a chatbot response using OpenAI's API based on user input and conversation history.
 * The chatbot can:
 *  - Answer general knowledge questions
 *  - Summarize or explain complex topics
 *  - Engage in casual conversation
 *  - Provide coding help and debugging assistance
 *  - Simulate roles (e.g., teacher, therapist, assistant)
 *  - Translate text between languages
 */
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

function runChat() {
  console.log("\n🤖 Transformer Chatbot | POWERED BY OKID");
  console.log("This chatbot can answer questions, explain concepts, write code, translate, and more.");
  console.log("Type 'exit' to end the chat.\n");

  rl.setPrompt("You: ");
  rl.prompt();

  rl.on('line', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      rl.close();
      return;
    }
    const reply = await generateResponse(input.trim(), chatHistory);
    console.log(`Bot: ${reply}\n`);
    chatHistory.push({ user: input.trim(), bot: reply });
    rl.prompt();
  });
}

runChat();
