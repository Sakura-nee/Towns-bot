import dbInstance from "../src/db";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const sessionId: string = 'lmfao'
if (!dbInstance.get(sessionId)) {
    dbInstance.setPath(sessionId, [])
}

dbInstance.pushToArray(sessionId, new HumanMessage('hello'))
dbInstance.pushToArray(sessionId, new AIMessage('world'))

console.log(dbInstance.get(sessionId))