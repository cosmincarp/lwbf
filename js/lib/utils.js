var LBFUtils = {
    toHex: function(number)
    {
        hexString = number.toString(16);
        while(hexString.length < 2)
        {
            hexString = "0" + hexString;
        }
        return hexString.toUpperCase();
    }
};