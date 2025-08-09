import { Wallet, ethers } from "ethers";

export class SafeWallet extends Wallet {
    static readonly MAX_GAS_LIMIT = ethers.BigNumber.from("1000000");
    static readonly MAX_GAS_PRICE = ethers.utils.parseUnits("0.05", "gwei");

    constructor(privateKey: string, provider?: ethers.providers.Provider) {
        super(privateKey, provider);
    }

    override async sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse> {
        const origGasLimit = transaction.gasLimit ? ethers.BigNumber.from(transaction.gasLimit) : await this.provider!.estimateGas(transaction);
        const gasLimit = origGasLimit.gt(SafeWallet.MAX_GAS_LIMIT) ? SafeWallet.MAX_GAS_LIMIT : origGasLimit;
        const origGasPrice = transaction.gasPrice ? ethers.BigNumber.from(transaction.gasPrice) : await this.provider!.getGasPrice();
        const gasPrice = origGasPrice.gt(SafeWallet.MAX_GAS_PRICE) ? SafeWallet.MAX_GAS_PRICE : origGasPrice;

        const safeTx: ethers.providers.TransactionRequest = {
            ...transaction,
            gasLimit,
            gasPrice,
        };

        return super.sendTransaction(safeTx);
    }
}
