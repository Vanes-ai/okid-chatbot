<?php
// transformer_chatbot.php

require 'vendor/autoload.php';
use GuzzleHttp\Client;

define('OPENAI_API_KEY', getenv('OPENAI_API_KEY'));

if (!OPENAI_API_KEY) {
    exit("[ERROR] OPENAI_API_KEY not set in environment variables.\n");
}

function generateResponse($userInput, &$history) {
    $messages = [];
    foreach ($history as $turn) {
        $messages[] = ["role" => "user", "content" => $turn['user']];
        $messages[] = ["role" => "assistant", "content" => $turn['bot']];
    }
    $messages[] = ["role" => "user", "content" => $userInput];

    $client = new Client();
    try {
        $response = $client->post('https://api.openai.com/v1/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . OPENAI_API_KEY,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'gpt-3.5-turbo',
                'messages' => $messages,
                'temperature' => 0.7,
            ],
        ]);

        $data = json_decode($response->getBody(), true);
        return $data['choices'][0]['message']['content'];

    } catch (Exception $e) {
        return "[ERROR] " . $e->getMessage();
    }
}

function runChat() {
    echo "\n🤖 Transformer Chatbot | POWERED BY OKID\n";
    echo "Type 'exit' to end the chat.\n\n";

    $history = [];

    while (true) {
        echo "You: ";
        $userInput = trim(fgets(STDIN));
        if (strtolower($userInput) === 'exit') break;

        $reply = generateResponse($userInput, $history);
        echo "Bot: $reply\n\n";
        $history[] = ['user' => $userInput, 'bot' => $reply];
    }
}

runChat();
