import z from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { systemMessage } from "../conversation";
import dbInstance from "../db";
import model from "../model";

export const answerNode = async (state: any) => {
    const responseSchema = z.object({
        answer: z.string().describe("Final answer"),
    });

    const instruct = `# Message from System
Hasil akhir dari proses berpikir Anda adalah: <thought>${state.thought}</thought>.
Sekarang berikan jawaban akhir untuk pertanyaan ini: <question>${state.question}</question>`;

    const agent = model.withStructuredOutput(responseSchema);

    const result = await agent.invoke([
        new SystemMessage(systemMessage),
        ...dbInstance.get(state.sessionId),
        new HumanMessage(instruct),
    ]);

    return { finalAnswer: result.answer };
}