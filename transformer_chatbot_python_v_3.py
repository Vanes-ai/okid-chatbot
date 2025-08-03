# transformer_chatbot.py

import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")

if not openai.api_key:
    raise EnvironmentError("[ERROR] OPENAI_API_KEY not set in environment variables.")

chat_history = []

def generate_response(user_input, history):
    messages = []
    for turn in history:
        messages.append({"role": "user", "content": turn["user"]})
        messages.append({"role": "assistant", "content": turn["bot"]})
    messages.append({"role": "user", "content": user_input})

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[ERROR] {str(e)}"

def run_chat():
    print("\n🤖 Transformer Chatbot | POWERED BY OKID")
    print("Type 'exit' to end the chat.\n")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() == 'exit':
            break
        reply = generate_response(user_input, chat_history)
        print(f"Bot: {reply}\n")
        chat_history.append({"user": user_input, "bot": reply})

if __name__ == "__main__":
    run_chat()
