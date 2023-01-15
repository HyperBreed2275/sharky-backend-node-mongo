require('dotenv').config('../.env');
const { receiveAllowanceNft, getAccountHbarBalance } = require("../chainAction");
const { LoanInfo } = require('../../db');
const { dayToMillisec } = require("../mainFunctions");

exports.sendOffer = async (req, res) => {
    console.log('sendOffer log - 1 : ', req.body);
    try {
        const accountId = atob(req.body.accountId);
        const tokenId = atob(req.body.tokenId);
        const serialNum = atob(req.body.serialNum);
        const duration = atob(req.body.duration);
        const billPrice = atob(req.body.billPrice);

        console.log('sendOffer log - 2 : ', accountId, tokenId, serialNum, duration, billPrice);

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

        // // receive nft
        // const receiveResult = await receiveAllowanceNft(accountId, tokenId, serialNum);
        // console.log('sendOffer log - 3 : ', receiveResult);
        // if (!receiveResult) {
        //     return res.send({ result: false, error: 'Error detected in while sending NFT!' });
        // }

        // // check existing
        // const findLoan = await LoanInfo.find({ accountId: accountId, tokenId: tokenId, serialNum: serialNum });
        // console.log('sendOffer log - 4 : ', findLoan);
        // if (findLoan.length > 0) {
        //     return res.send({ result: false, error: 'This NFT is already participate in loan.' });
        // }

        // // add loan to db
        // const newLoan = new LoanInfo({
        //     accountId: accountId,
        //     tokenId: tokenId,
        //     serialNum: serialNum,
        //     billPrice: billPrice,
        //     duration: duration,
        //     remainTime: dayToMillisec(duration),
        // })

        // const createResult = await newLoan.save();
        // console.log('sendOffer log - 5 : ', createResult);
        // if (!createResult)
        return res.send({ result: false, error: 'Add loan data to database is failed!' });

        // return res.send({ result: true, data: createResult });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}