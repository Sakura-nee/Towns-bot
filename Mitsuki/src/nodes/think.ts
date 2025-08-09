import z from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { systemMessage } from "../conversation";
import model from "../model";
import dbInstance from "../db";

export const thinkNode = async (state: any) => {
    const responseSchema = z.object({
        thought: z.string().describe("Thought process"),
    });

    const instruct = `# Message from System
Jelaskan proses berpikir Anda untuk menjawab pertanyaan ini: <question>${state.question}</question>`;

    const agent = model.withStructuredOutput(responseSchema);

    const result = await agent.invoke([
        new SystemMessage(systemMessage),
        ...dbInstance.get(state.sessionId),
        new HumanMessage(instruct),
    ]);

    return result;
}