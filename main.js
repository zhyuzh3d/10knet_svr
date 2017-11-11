//服务端主程序入口文件,引入的模块都以$开头驼峰式以便识别
const $koa = require('koa');
const $koaBodyParser = require('koa-bodyparser');
const cors = require('koa-cors');

const $config = require('./my_modules/config.js');
const $zrouter = require('./my_modules/zrouter.js');

//所有路由模块,将被zrouter自动载入
const qiniu = require('./api_modules/qiniu.js');
const test = require('./api_modules/test.js');
let apis = {
    qiniu,
    test,
};

//创建服务器程序，载入路由
const app = new $koa();
app.use(cors());
(async function init() {
    app.use($koaBodyParser());
    await $zrouter.init(app, apis);
    app.listen($config.port);
    console.log(`[main]Server is running on port ${$config.port}.`);
})();

//支持控制台重启核退出命令,不区分大小写
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    var cmd = process.stdin.read();
    if(cmd) {
        cmd = cmd.toLowerCase().substr(0, cmd.length - 1);
    } else {
        return;
    };
    if(cmd == 'exit' || cmd == 'x') {
        process.stdout.write(`Server stoped...\n\n`);
        process.exit();
    } else {
        process.stdout.write(`Unknown cmd:${cmd}.\n`);
    };
});
