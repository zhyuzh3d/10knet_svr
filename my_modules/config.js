const $xconfig = require('../../xconf/secret/xconfig.js');

var config = {
    port: 3100,
    domain: '10knet.com',
    qiniu_BucketName: '10knet-up',
    qiniu_BucketDomain: 'up.10knet.com',
};
config = Object.assign(config, $xconfig);

module.exports = config;
