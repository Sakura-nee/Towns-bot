import ethers from "ethers"
import { makeRiverConfig, makeSignerContextFromBearerToken, type RiverConfig, type SignerContext } from "@towns-protocol/sdk"
import { config as Config } from "../../config"
const config: RiverConfig = makeRiverConfig(Config.network)

if (!Config.bearer) throw new Error("Bearer token is required")
const signerContex: SignerContext = await makeSignerContextFromBearerToken(Config.bearer)

export {signerContex, config as RiverConfig }