import { run as askAI } from "../src"

await Promise.all([
    askAI('Yukinoshita', 'Seele'),
    askAI('Vollerei', 'Woiii!!')
])