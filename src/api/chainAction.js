require('dotenv').config('../.env');
const {
    AccountId,
    PrivateKey,
    TokenId,
    Client,
    NftId,
    Hbar,
    TransactionId,
    TransferTransaction,
    TokenMintTransaction,
    TokenBurnTransaction,
} = require('@hashgraph/sdk');
const axios = require('axios');
const { changeToRealHbarBalance } = require('./mainFunctions');

const operatorId = AccountId.fromString(process.env.TREASURY_ID);
const operatorKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
<<<<<<< HEAD
const client = Client.forMainnet().setOperator(operatorId, operatorKey);
=======
const client = Client.forMainnet()
    .setOperator(operatorId, operatorKey)
    .setDefaultMaxTransactionFee(new Hbar(50));
const supplyKey = PrivateKey.fromString(process.env.SUPPLY_KEY);
const tokenId = TokenId.fromString(process.env.TOKEN_ID);
>>>>>>> 9bd2f3eeedb40eed755ab34bd9bf924d73ec695c

exports.receiveAllowanceHbar = async (sender, amount) => {
    console.log('receiveAllowanceHbar log - 1 : ', sender, amount);
    try {
        const sendBal = new Hbar(amount);

        const approvedSendTx = new TransferTransaction()
            .addApprovedHbarTransfer(AccountId.fromString(sender), sendBal.negated())
            .addHbarTransfer(operatorId, sendBal)
            .setTransactionId(TransactionId.generate(operatorId)) // Spender must generate the TX ID or be the client
            .freezeWith(client);
        const approvedSendSign = await approvedSendTx.sign(operatorKey);
        const approvedSendSubmit = await approvedSendSign.execute(client);
        const approvedSendRx = await approvedSendSubmit.getReceipt(client);

        if (approvedSendRx.status._code != 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}

exports.receiveAllowanceNft = async (sender_r, tokenId_r, serialNum_r) => {
    console.log('receiveAllowanceNft log - 1 : ', sender_r, tokenId_r, serialNum_r);
    try {
        const nft = new NftId(TokenId.fromString(tokenId_r), serialNum_r);

        const approvedSendTx = new TransferTransaction()
            .addApprovedNftTransfer(nft, AccountId.fromString(sender_r), operatorId)
            .setTransactionId(TransactionId.generate(operatorId)) // Spender must generate the TX ID or be the client
            .freezeWith(client);
        const approvedSendSign = await approvedSendTx.sign(operatorKey);
        const approvedSendSubmit = await approvedSendSign.execute(client);
        const approvedSendRx = await approvedSendSubmit.getReceipt(client);

        if (approvedSendRx.status._code != 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}

<<<<<<< HEAD
=======
exports.mintNft = async (CID) => {
    console.log('mintNft log - 1 : ', CID);
    try {
        let mintTx = await new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([Buffer.from(CID)])
            .freezeWith(client)
            .sign(supplyKey);
        let mintTxSubmit = await mintTx.execute(client);
        let mintRx = await mintTxSubmit.getReceipt(client);
        console.log('mintNft log - 2 : ', mintRx);

        let newSerialNum = mintRx.serials[0].low;

        return newSerialNum;
    } catch (error) {
        return 0;
    }
}

exports.burnNft = async (serialNum) => {
    console.log('burnNft log - 1 : ', serialNum);
    try {
        let tokenBurnTx = await new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setSerials([serialNum])
            .freezeWith(client)
            .sign(supplyKey);
        let tokenBurnSubmit = await tokenBurnTx.execute(client);
        let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);

        if (tokenBurnRx.status._code !== 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}

>>>>>>> 9bd2f3eeedb40eed755ab34bd9bf924d73ec695c
exports.sendHbar = async (receiverId, amount) => {
    console.log('sendHbar log - 1 : ', receiverId, amount);
    try {
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-amount))
            .addHbarTransfer(AccountId.fromString(receiverId), new Hbar(amount))
            .freezeWith(client)
            .sign(operatorKey);
        const transferSubmit = await transferTx.execute(client);
        const transferRx = await transferSubmit.getReceipt(client);

        if (transferRx.status._code !== 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}

exports.sendNft = async (receiverId, serialNum) => {
    console.log('sendNft log - 1 : ', receiverId, serialNum);
    try {
        const transferTx = await new TransferTransaction()
            .addNftTransfer(
                TokenId.fromString(tokenId),
                serialNum,
                operatorId,
                AccountId.fromString(receiverId))
            .freezeWith(client)
            .sign(operatorKey);
        const transferSubmit = await transferTx.execute(client);
        const transferRx = await transferSubmit.getReceipt(client);

        if (transferRx.status._code !== 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}

exports.getAccountHbarBalance = async (accountId_g) => {
    console.log('getAccountHbarBalance log - 1 : ', accountId_g);
    try {
        const balanceInfo = await axios.get(`https://mainnet-public.mirrornode.hedera.com/api/v1/balances?account.id=${accountId_g}`);
        console.log('getAccountHbarBalance log - 2 : ', balanceInfo.data);
        if (balanceInfo.data?.balances?.length > 0) {
            return { result: true, data: changeToRealHbarBalance(balanceInfo.data.balances[0].balance) };
        }
        return { result: false, error: 'axios error!' };
    } catch (error) {
        return { result: false, error: error.message };
    }
}