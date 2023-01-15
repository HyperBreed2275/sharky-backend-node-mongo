exports.dayToMillisec = (dayValue_d) => {
    console.log('dayToMillisec log - 1 : ', dayValue_d);
    return dayValue_d * 3600 * 24 * 1000;
}

exports.changeToRealHbarBalance = (balance_c) => {
    console.log('changeToRealHbarBalance log - 1 : ', balance_c);
    return parseFloat(balance_c) / 100000000;
}