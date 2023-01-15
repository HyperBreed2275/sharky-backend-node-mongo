const { receiveAllowanceHbar, receiveAllowanceNft, mintNft, burnNft, sendHbar, sendNft, associateCheck } = require('../chainAction');
const { GiftsInfo, NftData } = require('../../db');

exports.sendOffer = async (req, res) => {
    console.log('sendOffer log - 1 : ', req.body);
    try {
        const linkType = atob(req.body.linkType);
        const senderId = atob(req.body.senderId);
        const senderWalletId = atob(req.body.senderWalletId);
        const amount = atob(req.body.amount);
        const receiverId = atob(req.body.receiverId);
        const metadataCID = atob(req.body.metadataCID);

        console.log('sendOffer log - 2: ', linkType, senderId, senderWalletId, amount, receiverId, metadataCID);

        // mint nft
        const nftSerialNum = await mintNft(metadataCID);
        console.log('sendOffer log - 3: ', nftSerialNum);
        if (nftSerialNum === 0) {
            return res.send({ result: false, error: 'Error detected in mint NFT!' });
        }

        // receive hbar
        const receiveResult = await receiveAllowanceHbar(senderWalletId, amount);
        console.log('sendOffer log - 4: ', receiveResult);
        if (!receiveResult) {
            return res.send({ result: false, error: 'Error detected in receive Hbar!' });
        }

        const nftDataFindResult = await NftData.findOne({ metadataCID: metadataCID });
        console.log('sendOffer log - 5: ', nftDataFindResult);

        // add to db
        const newGiftsInfo = new GiftsInfo({
            linkType: linkType,
            senderId: senderId,
            receiverId: receiverId,
            serialNum: nftSerialNum,
            metadataCID: metadataCID,
            imageUrl: nftDataFindResult.imageUrl,
            hbarAmount: amount,
        });

        const createResult = await newGiftsInfo.save();
        console.log("sendOffer log - 6 : ", createResult);
        if (!createResult)
            return res.send({ result: false, error: 'Add gift data to database is failed!' });

        return res.send({ result: true, data: createResult });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getGiftsInfo = async (req, res) => {
    console.log('getGiftsInfo log - 1 : ', req.query);
    try {
        const linkType = atob(req.query.linkType);
        const receiverId = atob(req.query.receiverId);

        console.log('getGiftsInfo log - 2 : ', linkType, receiverId);

        const giftInfo = await GiftsInfo.find({ linkType: linkType, receiverId: receiverId, description: '' }, { _id: 0 })
        return res.send({ result: true, data: giftInfo });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.getSingleGiftInfo = async (req, res) => {
    console.log('getSingleGiftInfo log - 1 : ', req.query);
    try {
        const serialNum = atob(req.query.serialNum);
        const giftInfo = await GiftsInfo.findOne({ serialNum: serialNum }, { _id: 0 });
        return res.send({ result: true, data: giftInfo });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.burnAndClaimGift = async (req, res) => {
    console.log('burnAndClaimGift log - 1 : ', req.body);
    try {
        const receiverId = atob(req.body.receiverId);
        const serialNum = atob(req.body.serialNum);
        const walletId = atob(req.body.walletId);

        console.log('burnAndClaimGift log - 2: ', receiverId, serialNum, walletId);

        const existCheck = await GiftsInfo.find({ receiverId: receiverId, serialNum: serialNum });
        if (existCheck.length === 0) {
            return res.send({ result: false, error: 'Gift is not existed!' });
        }

        
        const burnResult = await burnNft(serialNum);
        console.log('burnAndClaimGift log - 3: ', burnResult);
        if (!burnResult) {
            return res.send({ result: false, error: 'Burn NFT failed!' });
        }
        
        const hbarAmount = existCheck[0].hbarAmount;

        const sendResult = await sendHbar(walletId, hbarAmount);
        console.log('burnAndClaimGift log - 4: ', sendResult);
        if (!sendResult) {
            return res.send({ result: false, error: 'Send Gift failed!' });
        }

        await GiftsInfo.deleteOne({ serialNum: serialNum });

        return res.send({ result: true, data: 'success' });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.claimNft = async (req, res) => {
    console.log('claimNft log - 1 : ', req.body);
    try {
        const receiverId = atob(req.body.receiverId);
        const serialNum = atob(req.body.serialNum);
        const walletId = atob(req.body.walletId);

        console.log('claimNft log - 2: ', receiverId, serialNum, walletId);

        const existCheck = await GiftsInfo.find({ receiverId: receiverId, serialNum: serialNum });
        console.log('claimNft log - 3: ', existCheck);
        if (existCheck.length === 0) {
            return res.send({ result: false, error: 'Gift is not existed!' });
        }

        const checkAssociate = await associateCheck(walletId);
        console.log('claimNft log - 4: ', checkAssociate);
        if (!checkAssociate) {
            return res.send({ result: false, error: 'Please associate 0.0.1506656!' });
        }

        const sendResult = await sendNft(walletId, serialNum);
        console.log('claimNft log - 5: ', sendResult);
        if (!sendResult) {
            return res.send({ result: false, error: 'Send NFT failed!' });
        }

        await GiftsInfo.updateOne({ serialNum: serialNum }, { description: 'NftClaimed!' });

        return res.send({ result: true, data: 'success' });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}

exports.receiveNft = async (req, res) => {
    console.log('receiveNft log - 1 : ', req.body);
    try {
        const walletId = atob(req.body.walletId);
        const serialNum = atob(req.body.serialNum);

        const receiveResult = await receiveAllowanceNft(walletId, serialNum);
        console.log('receiveNft log - 2: ', receiveResult);
        if (!receiveResult) {
            return res.send({ result: false, error: 'Receive NFT failed!' });
        }

        return res.send({ result: true, data: 'success' });
    } catch (error) {
        return res.send({ result: false, error: 'Error detected in server progress!' });
    }
}