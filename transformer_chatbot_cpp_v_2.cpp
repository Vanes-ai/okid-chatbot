// transformer_chatbot.cpp

#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct Turn {
    std::string user;
    std::string bot;
};

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {
    size_t totalSize = size * nmemb;
    output->append((char*)contents, totalSize);
    return totalSize;
}

std::string generateResponse(const std::string& input, const std::vector<Turn>& history, const std::string& apiKey) {
    json messages = json::array();
    for (const auto& turn : history) {
        messages.push_back({{"role", "user"}, {"content", turn.user}});
        messages.push_back({{"role", "assistant"}, {"content", turn.bot}});
    }
    messages.push_back({{"role", "user"}, {"content", input}});

    json requestBody = {
        {"model", "gpt-3.5-turbo"},
        {"messages", messages},
        {"temperature", 0.7}
    };

    CURL* curl;
    CURLcode res;
    std::string responseString;

    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();

    if (curl) {
        struct curl_slist* headers = nullptr;
        std::string authHeader = "Authorization: Bearer " + apiKey;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, authHeader.c_str());

        curl_easy_setopt(curl, CURLOPT_URL, "https://api.openai.com/v1/chat/completions");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, requestBody.dump().c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseString);

        res = curl_easy_perform(curl);

        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);
    }

    curl_global_cleanup();

    if (res != CURLE_OK) {
        return "[ERROR] Failed to connect to OpenAI API.";
    }

    try {
        json responseJson = json::parse(responseString);
        return responseJson["choices"][0]["message"]["content"];
    } catch (...) {
        return "[ERROR] Failed to parse response.";
    }
}

int main() {
    std::string apiKey = std::getenv("OPENAI_API_KEY") ? std::getenv("OPENAI_API_KEY") : "";
    if (apiKey.empty()) {
        std::cerr << "OPENAI_API_KEY not set in environment variables." << std::endl;
        return 1;
    }

    std::cout << "\n🤖 Transformer Chatbot | POWERED BY OKID" << std::endl;
    std::cout << "Type 'exit' to end the chat.\n" << std::endl;

    std::vector<Turn> history;
    std::string input;

    while (true) {
        std::cout << "You: ";
        std::getline(std::cin, input);
        if (input == "exit") break;

        std::string reply = generateResponse(input, history, apiKey);
        std::cout << "Bot: " << reply << "\n" << std::endl;
        history.push_back({input, reply});
    }

    return 0;
}
