import readline from 'readline';
import { run as askAI } from './src'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'prompt> ',
});

function printAbove(text: string) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(text);
    rl.prompt(true);
}

function mockServerResponse(msg: string) {
    setTimeout(() => {
        printAbove(`<reply from server: ${msg}>`);
    }, Math.random() * 2000 + 500);
}

rl.prompt();

rl.on('line', (line) => {
    const trimmed = line.trim();
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);

    if (trimmed.toLowerCase() === 'exit') {
        return rl.close();
    }

    printAbove(`>sent to server: ${trimmed}`);
    mockServerResponse(trimmed);
});

rl.on('close', () => {
    console.log('\nBye!');
    process.exit(0);
});
