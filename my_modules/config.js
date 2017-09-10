const $xconfig = require('../../xconfig.js');

var config = {
    port: 3300,
    domain: 'web.10knet.com',
    qiniu_BucketName: '10knet-web',
    qiniu_BucketDomain: 'web.10knet.com',
};
config = Object.assign(config, $xconfig);

module.exports = config;
