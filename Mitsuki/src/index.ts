import { StateGraph } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import { thinkNode } from "./nodes/think";
import { answerNode } from "./nodes/repl";
import { START, END } from "@langchain/langgraph";
import dbInstance from "./db";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const StateSchema = Annotation.Root({
    sessionId: Annotation<string>({
        default: () => "",
        reducer: (state, newValue) => newValue,
    }),

    question: Annotation<string>({
        default: () => "",
        reducer: (state, newValue) => newValue,
    }),

    finalAnswer: Annotation<string>({
        default: () => "",
        reducer: (state, newValue) => newValue,
    })
});

const workflow = new StateGraph(StateSchema)
    .addNode("think", thinkNode)
    .addNode("answer", answerNode)

    .addEdge(START, "think")
    .addEdge("think", "answer")
    .addEdge("answer", END);

const app = workflow.compile();

export const run = async (sessionId: string, question: string) => {
    if (!dbInstance.get(sessionId)) {
        dbInstance.setPath(sessionId, [])
    }

    dbInstance.pushToArray(sessionId, new HumanMessage(question))
    const result = await app.invoke({ question, sessionId });
    dbInstance.pushToArray(sessionId, new AIMessage(result.finalAnswer))
    return result.finalAnswer
}

export const deleteConversation = (sessionId: string) => dbInstance.setPath(sessionId, [])