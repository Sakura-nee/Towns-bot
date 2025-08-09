// fake database
import fs from 'fs'

export interface UserPersona {
    aiEnabled: boolean | undefined
}

export interface Database {
    botProfileId: {
        address: string | undefined
    };
    userPersonas: {
        [key: string]: UserPersona
    }
    confirmedEventNum: number;
}

export const database: Database = {
    botProfileId: {
        address: undefined
    },
    userPersonas: {},
    confirmedEventNum: 0
}

export const sync: Function = async () => {
    const localRead = fs.readFileSync('database.json', 'utf-8')
    Object.assign(database, JSON.parse(localRead))
    return;
}

export const writeSync: Function = () => {
    fs.writeFileSync('database.json', JSON.stringify(database, null, 2))
}