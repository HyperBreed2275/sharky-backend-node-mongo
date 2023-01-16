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
const client = Client.forMainnet()
    .setOperator(operatorId, operatorKey)
    .setDefaultMaxTransactionFee(new Hbar(50));

exports.receiveAllowance = async (senderId_r, tokenId_r, serialNum_r, amount_r) => {
    console.log('receiveAllowanceNft log - 1 : ', senderId_r, tokenId_r, serialNum_r, amount_r);
    try {

        let approvedSendTx = new TransferTransaction();
        if (amount_r > 0) {
            const sendBal = new Hbar(amount_r);
            approvedSendTx.addApprovedHbarTransfer(AccountId.fromString(senderId_r), sendBal.negated())
                .addHbarTransfer(operatorId, sendBal);
        }
        if (serialNum_r > 0) {
            const nft = new NftId(TokenId.fromString(tokenId_r), serialNum_r);
            approvedSendTx.addApprovedNftTransfer(nft, AccountId.fromString(senderId_r), operatorId);
        }
        approvedSendTx.setTransactionId(TransactionId.generate(operatorId)) // Spender must generate the TX ID or be the client
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

exports.sendHbar = async (senderId_s, receiverId_s, amount_s) => {
    console.log('sendHbar log - 1 : ', senderId_s, receiverId_s, amount_s);
    try {
        const transferTx = await new TransferTransaction()
            .addHbarTransfer(AccountId.fromString(senderId_s), new Hbar(-amount_s))
            .addHbarTransfer(AccountId.fromString(receiverId_s), new Hbar(amount_s))
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

exports.sendNft = async (senderId_s, receiverId_s, tokenId_s, serialNum_s) => {
    console.log('sendNft log - 1 : ', receiverId_s, serialNum_s);
    try {
        const transferTx = await new TransferTransaction()
            .addNftTransfer(
                TokenId.fromString(tokenId_s),
                serialNum_s,
                AccountId.fromString(senderId_s),
                AccountId.fromString(receiverId_s))
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