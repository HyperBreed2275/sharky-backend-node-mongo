module.exports = (mongoose) => {
    const dbModel = mongoose.model(
        'loanInfo',
        mongoose.Schema(
            {
                accountId: { type: String, default: '0.0.0' },
                tokenId: { type: String, default: '0.0.0' },
                serialNum: { type: String, default: '' },
                imageUrl: { type: String, default: '' },
                billPrice: { type: String, default: '' },
                duration: { type: String, default: '' },
                remainTime: { type: String, default: '' },
                description: { type: String, default: '' }
            },
            { timestamps: true }
        )
    );
    return dbModel;
};
