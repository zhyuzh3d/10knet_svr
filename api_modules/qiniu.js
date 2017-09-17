const $qiniu = require('qiniu');
const $shortid = require('shortid');
const $config = require('../my_modules/config.js');

/**
 * 初始化函数
 * @param   {object}  app app
 * @returns {boolean} true
 */
function init(app) {
    app.listen(conf.Port);
    return true;
};

//设置参数
const conf = {
    Port: 19110,
    Uptoken_Url: "/uptoken",
    Domain: "http://qiniu-plupload.qiniudn.com/",
    UploadCallbackUrl: `http://${$config.domain}/api/qn/uploadCallback`,
    BucketName: $config.qiniu_BucketName,
    BucketDomain: $config.qiniu_BucketDomain,
    ACCESS_KEY: $config.qiniu_ACCESS_KEY,
    SECRET_KEY: $config.qiniu_SECRET_KEY,
    UpTokenExpires: 3600, //token有效时间10小时
    uploadTags: {
        none: true,
        page: true,
        file: true,
        share: true,
    },
};
let mac = new $qiniu.auth.digest.Mac(conf.ACCESS_KEY, conf.SECRET_KEY);



//API--用户上传文件后七牛回调接口
const uploadCallback = {
    tip: '',
    validator: {
        //对请求合法性检查可以放在这里，参照七牛文档
    },
    handler: async function(ctx) {
        //限制文件大小和类型可以放在这里,超过限制的可以在这里删除它
    },
};


//API--获取随机上传token的接口，允许匿名上传
const uploadTokenRand = {
    tip: '',
    validator: {
        token: /^(undefined|.{3,32})$/,
        tag: /^(undefined|.{3,32})$/,
        fileName: /^(undefined|([\S\s]{1,64}\.\w{1,6}))$/
    },
    handler: async function(ctx) {
        var fkey = $shortid.generate();
        if(ctx.xdata.fileName) fkey += '/' + ctx.xdata.fileName;

        var url = conf.BucketDomain + '/' + fkey;
        var upToken = genUploadToken(fkey, {
            url: $qiniu.util.urlsafeBase64Encode(url),
            accToken: ctx.xdata.token,
            tag: ctx.xdata.tag,
        });

        var data = {
            domain: conf.BucketDomain,
            token: upToken,
            key: fkey, //前端需要使用这个key上传到七牛
            url: url, //上传成功后的文件地址
        };

        ctx.body = { code: 1, data: data };
    },
};


/**
 * 发送上传许可的token，可以指定文件名或随机文件名
 * @param   {string} key          可选，文件名
 * @param   {object} callbackBody 回调的数据字段
 * @returns {string} token
 */
function genUploadToken(key, callbackBody) {
    //指定文件名或传入随机文件名'YHDDKK/temp.jpg'
    let scope = key ? (conf.BucketName + ':' + key) : conf.BucketName;

    //自定义回调字段，将callbackBodyUri传进来的参数序列化
    var cbstr = `{"key":"$(key)"`;
    cbstr += `,"hash":"$(etag)"`;
    cbstr += `,"fsize":$(fsize)`;
    cbstr += `,"bucket":"$(bucket)"`;
    if(callbackBody) {
        for(var attr in callbackBody) {
            var val = callbackBody[attr];
            if(val) {
                if(val.constructor != String) val = JSON.stringify(val); //避免'"xxx"'情况
                cbstr += `,"${attr}":$("x:${val}")`; //自定义变量x:开始
            };
        };
    };
    cbstr += `}`;

    let options = {
        scope: scope,
        expires: conf.UpTokenExpires,
        callbackBody: cbstr,
        callbackUrl: conf.UploadCallbackUrl,
        callbackBodyType: 'application/json',
    };

    let putPolicy = new $qiniu.rs.PutPolicy(options);
    return putPolicy.uploadToken(mac);
};


//输出
module.exports = {
    init: init,
    apis: {
        uploadTokenRand,
        uploadCallback,
    },
    fns: {},
    conf,
};
