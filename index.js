// This secret is used to create the JWT
if (!process.env.SECRET)
    process.env.SECRET = "vU$Y/+[D;:<XraqlZ/q`lIe~`;\"u2=^H_GEk,@xGY:K4(CMF,'|TSFZAAFM-As)";

module.export = require('./src');
