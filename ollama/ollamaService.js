import { Ollama } from "@langchain/community/llms/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

const ollama = new Ollama({
    baseUrl: process.env.OLLAMA_HOST || "http://localhost:11434",
    model: process.env.OLLAMA_GENERATION_MODEL || "gemma3:1b",
});

const embeddings = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_HOST || "http://localhost:11434",
    model: process.env.OLLAMA_EMBEDDING_MODEL || "bge-m3:latest",
});

async function generateResponse(prompt) {
    try {
        const response = await ollama.invoke(prompt);
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        throw error;
    }
}

async function generateEmbedding(text) {
    try {
        const embedding = await embeddings.embedQuery(text);
        return embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

module.exports = {
    generateResponse,
    generateEmbedding
};