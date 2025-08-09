import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    model: "deepseek-ai/DeepSeek-V3-0324",
    openAIApiKey: "OPENAI_API_KEY",
    configuration: {
        baseURL: "https://api.openai.moe/v1"
    }
});

export default model;