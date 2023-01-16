require('dotenv').config('../.env');
const { receiveAllowanceNft, getAccountHbarBalance, receiveAllowance, sendHbar, sendNft } = require("../chainAction");
const { LoanInfo } = require('../../db');
const { dayToMilliSec: dayToMillisec, dayToMilliSec } = require("../mainFunctions");

exports.sendOffer = async (req, res) => {
    console.log('sendOffer log - 1 : ', req.body);
    try {
        const accountId = atob(req.body.a);
        const tokenId = atob(req.body.b);
        const serialNum = atob(req.body.c);
        const imageUrl = atob(req.body.d);
        const duration = atob(req.body.e);
        const billPrice = atob(req.body.f);
        const fee = atob(req.body.g);
        console.log('sendOffer log - 2 : ', accountId, tokenId, serialNum, imageUrl, duration, billPrice);

        // check treasury balance
        const treasuryBalance = await getAccountHbarBalance(process.env.TREASURY_ID);
        console.log('sendOffer log - 3 : ', treasuryBalance);
        if (!treasuryBalance.result) {
            return res.send({ result: false, error: 'Error detected in treasury balance!' });
        }

        if (parseFloat(treasuryBalance.data) <= parseFloat(billPrice)) {
            console.log('sendOffer log - 4 : ', treasuryBalance.data, billPrice);
            return res.send({ result: false, error: 'Treasury has not enough hbar!' });
        }

        // check existing
        const findLoan = await LoanInfo.find({ accountId: accountId, tokenId: tokenId, serialNum: serialNum });
        console.log('sendOffer log - 7 : ', findLoan);
        if (findLoan.length > 0) {
            return res.send({ result: false, error: 'This NFT is already participate in loan.' });
        }

        // receive nft
        const receiveResult = await receiveAllowance(accountId, tokenId, serialNum, fee);
        console.log('sendOffer log - 5 : ', receiveResult);
        if (!receiveResult) {
            return res.send({ result: false, error: 'Error detected in while sending NFT!' });
        }

        // send bill price
        const sendResult = await sendHbar(process.env.TREASURY_ID, accountId, billPrice);
        console.log('sendOffer log - 6 : ', sendResult);
        if (!sendResult) {
            return res.send({ result: false, error: 'Error detected in while sending bill price!' });
        }

        // add loan to db
        const newLoan = new LoanInfo({
            accountId: accountId,
            tokenId: tokenId,
            serialNum: serialNum,
            imageUrl: imageUrl,
            billPrice: billPrice,
            duration: duration,
            remainTime: dayToMillisec(duration),
        });

        const createResult = await newLoan.save();
        console.log('sendOffer log - 8 : ', createResult);
        if (!createResult)
            return res.send({ result: false, error: 'Add loan data to database is failed!' });

        setTimeout(loanTimerOut, newLoan.remainTime, newLoan);
        return res.send({ result: true, data: createResult });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getLoans = async (req, res) => {
    console.log('getLoans log - 1 : ', req.query);
    try {
        const accountId = atob(req.query.a);
        console.log('getLoans log - 2 : ', accountId);

        let findLoan = await LoanInfo.find({ accountId: accountId },
            { _id: 0, __v: 0, updatedAt: 0, description: 0 });
        console.log('getLoans log - 3 : ', findLoan);

        // calc remain time
        for (let i = 0; i < findLoan.length; i++) {
            findLoan[i].remainTime = dayToMilliSec(findLoan[i].duration) - (Date.now() - findLoan[i].createdAt);
        }

        console.log('getLoans log - 4 : ', findLoan);

        return res.send({ result: true, data: findLoan });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getBackOffer = async (req, res) => {
    console.log('getBackOffer log - 1 : ', req.body);
    try {
        const accountId = atob(req.body.a);
        const tokenId = atob(req.body.b);
        const serialNum = atob(req.body.c);
        console.log('getBackOffer log - 2 : ', accountId, tokenId, serialNum);

        // check existing
        const findLoan = await LoanInfo.findOne({ accountId: accountId, tokenId: tokenId, serialNum: serialNum });
        console.log('getBackOffer log - 3 : ', findLoan);
        if (findLoan === null) {
            return res.send({ result: false, error: 'No existing loan.' });
        }

        // receive bill price
        const receiveResult = await receiveAllowance(accountId, 0, 0, findLoan.billPrice);
        console.log('getBackOffer log - 4 : ', receiveResult);
        if (!receiveResult) {
            return res.send({ result: false, error: 'Error detected in while receiving bill price!' });
        }

        // send nft
        const sendResult = await sendNft(process.env.TREASURY_ID, accountId, findLoan.tokenId, findLoan.serialNum);
        console.log('getBackOffer log - 5 : ', sendResult);
        if (!sendResult) {
            return res.send({ result: false, error: 'Error detected in while sending bill price!' });
        }

        // delete loan from db
        await LoanInfo.deleteOne({ accountId: accountId, tokenId: tokenId, serialNum: serialNum });

        return res.send({ result: true, data: 'success' });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

const loanTimerOut = async (loanInfo_l) => {
    console.log('loanTimerOut log - 1 : ', loanInfo_l);

    // check existing
    const findLoan = await LoanInfo.findOne({ accountId: loanInfo_l.accountId, tokenId: loanInfo_l.tokenId, serialNum: loanInfo_l.serialNum });
    console.log('getBackOffer log - 3 : ', findLoan);
    if (findLoan === null) return;

    const newRemainTime = dayToMilliSec(findLoan.duration) - (Date.now() - findLoan.createdAt);
    if (newRemainTime > 0) {
        setTimeout(loanTimerOut, newRemainTime, findLoan);
        return;
    }

    // send nft
    const sendResult = await sendNft(process.env.TREASURY_ID, process.env.CYCLE_ID, findLoan.tokenId, findLoan.serialNum);
    console.log('loanTimerOut log - 2 : ', sendResult);
    if (!sendResult) return;

    // delete loan from db
    await LoanInfo.deleteOne({ accountId: findLoan.accountId, tokenId: findLoan.tokenId, serialNum: findLoan.serialNum });
}

const initLoanTimer = async () => {
    console.log('initLoanTimer log - 1');

    const findLoan = await LoanInfo.find({});
    for (let i = 0; i < findLoan.length; i++) {
        const newRemainTime = dayToMilliSec(findLoan[i].duration) - (Date.now() - findLoan[i].createdAt);
        if (newRemainTime > 0) {
            setTimeout(loanTimerOut, newRemainTime, findLoan[i]);
        } else {
            // send nft
            const sendResult = await sendNft(process.env.TREASURY_ID, process.env.CYCLE_ID, findLoan[i].tokenId, findLoan[i].serialNum);
            console.log('loanTimerOut log - 2 : ', sendResult);
            if (!sendResult) return;

            // delete loan from db
            await LoanInfo.deleteOne({ accountId: findLoan[i].accountId, tokenId: findLoan[i].tokenId, serialNum: findLoan[i].serialNum });
        }
    }
}

initLoanTimer();