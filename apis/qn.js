var qn = {
    apis: {},
    fns: {},
};

qn.apis.getUploadTokenRand = async(ctx, next) => {
    ctx.body = 'qn/getUploadTokenRand';
};

module.exports = qn;
