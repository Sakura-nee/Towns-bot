import { Channel, RiverTimelineEvent, type ChannelMessageEvent, type TimelineEvent } from "@towns-protocol/sdk";
import dbInstance from "./providers/nDB";
import idleManager from "./providers/idleManager";
import { run as callAI, deleteConversation } from "../Mitsuki/src";

class EventHandler {
    public channel: Channel

    constructor(channel: Channel) {
        this.channel = channel
    }

    public onEvent(event: TimelineEvent[]) {
        this.MessageHandler(event, this.ConditionHandler.bind(this));
    }

    private MessageHandler(event: TimelineEvent[], call?: Function) {
        const message = event.filter((e: TimelineEvent) => e.content?.kind === RiverTimelineEvent.ChannelMessage)

        if (message.length > 0) {
            const latestMessage = message[message.length - 1]
            if (latestMessage?.confirmedEventNum && Number(latestMessage.confirmedEventNum) > dbInstance.get('confirmedEventNum')) {
                dbInstance.set('confirmedEventNum', Number(latestMessage.confirmedEventNum))

                if (latestMessage.sender.id === dbInstance.getPath('botProfileId.address')) {
                    console.log('> Skip \'Cause Sender is Bot')
                    return
                };

                if (call) {
                    return call(latestMessage)
                }

                // log
                console.log('> No callback handler')
                return;
            }
        }
    }

    private async ConditionHandler(event: TimelineEvent) {
        // AI
        const bypass = true
        if ((!bypass && dbInstance.get('whitelistedUsers').includes(event.sender.id)) || bypass) {
            const message = event.content as ChannelMessageEvent

            if (message.body.startsWith('/')) {
                if (message.body.startsWith('/enable ai')) {
                    dbInstance.setPath('userPersonas.' + event.sender.id + '.aiEnabled', true)
                    return this.channel.sendMessage('AI Enable')
                } else if (message.body.startsWith('/delete conversation') || message.body.trim() === '/d' || message.body.trim() === '/dc') {
                    deleteConversation(event.sender.id)
                    return this.channel.sendMessage('Conversation Deleted')
                }
            } else if (message.mentions.length > 0) {
                if (message.mentions.map(m => m.userId).includes(dbInstance.getPath('botProfileId.address'))) {
                    dbInstance.setPath('userPersonas.' + event.sender.id + '.aiEnabled', true)

                    idleManager.markUserActive(event.sender.id)
                    try {
                        const askAI = await callAI(event.sender.id, message.body.trim())

                        if (message.threadId) return this.channel.sendMessage(askAI, { threadId: message.threadId })
                        return this.channel.sendMessage(askAI)
                    } catch (e) {
                        console.log(e)
                    }

                }
            } else {
                if (dbInstance.get('userPersonas')[event.sender.id]?.aiEnabled === true) {
                    idleManager.markUserActive(event.sender.id)

                    try {
                        const askAI = await callAI(event.sender.id, message.body.trim());

                        if (message.threadId) return this.channel.sendMessage(askAI, { threadId: message.threadId })
                        return this.channel.sendMessage(askAI)
                    } catch (e) {
                        console.log(e)
                    }
                    
                }
            }
        }
    }
}

export default EventHandler