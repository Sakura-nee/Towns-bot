import 'fake-indexeddb/auto'
import ethers from "ethers"
import { SyncAgent, waitFor } from '@towns-protocol/sdk'
import type { TimelineEvent } from '@towns-protocol/sdk'
import { signerContex, RiverConfig } from './providers/WalletSigner'
import dbInstance from './providers/nDB'
import EventHandler from './client'
import { spaceIdFromChannelId } from '@towns-protocol/sdk'
import { config, config as Config } from "../config"


// Initialize synced agent
const syncAgent = new SyncAgent({
    context: signerContex,
    riverConfig: RiverConfig,
    riverProvider: new ethers.providers.JsonRpcProvider(RiverConfig.river.rpcUrl),
    baseProvider: new ethers.providers.JsonRpcProvider(RiverConfig.base.rpcUrl),
    disablePersistenceStore: true
})

// DB
dbInstance.setPath('botProfileId.address', syncAgent.userId)

async function initializeAgent() {
    try {
        console.log('Starting sync agent')
        await syncAgent.start()
        console.log('Agent started...')
        
        try {
            await waitFor(() => syncAgent.spaces.value.status === 'loaded')
            console.log('Spaces loaded...')
        } catch (err) {
            console.error("Error loading spaces:", err)
            // Continue despite space loading error
        }

        try {
            const SpaceId = spaceIdFromChannelId(config.channelId)
            console.log('SpaceId:', SpaceId)
            const clientStream = syncAgent.spaces.getSpace(SpaceId)
                .getChannel(config.channelId)

            try {
                const streamC = await syncAgent.riverConnection.client?.waitForStream(config.channelId)
                await new Promise(resolve => setTimeout(resolve, 5000))
                
                const lastEventNum: bigint = streamC?.view.lastEventNum ?? 0n
                dbInstance.set('confirmedEventNum', Number(lastEventNum))
                console.log('lastEventNum:', dbInstance.get('confirmedEventNum'))
            } catch (err) {
                console.error("Error processing stream:", err)
            }

            const onEvent = new EventHandler(clientStream)
            console.log(clientStream.data.isJoined, syncAgent.userId)

            clientStream.timeline.events.subscribe((events: TimelineEvent[]) => {
                try {
                    events.forEach(e => {
                        try {
                            onEvent.onEvent([e]) // Wrap single event in array
                        } catch (err: unknown) {
                            console.error("Error processing individual event:", err)
                            // Continue processing other events
                        }
                    })
                } catch (err: unknown) {
                    console.error("Error in event subscription:", err)
                    // Recover by continuing the subscription
                }
            })
            
            console.log('Client Ready...')
        } catch (err) {
            console.error("Error initializing client stream:", err)
        }
    } catch (err) {
        console.error("[INDEX.TS] Error starting sync agent:", err)
    }
}

// Start agent
initializeAgent()
