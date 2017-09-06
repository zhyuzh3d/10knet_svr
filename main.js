const Koa = require('koa');
const Router = require('koa-router');
const qn = require('./apis/qn.js');

const app = new Koa();
var router = new Router();

//自定义模块，赋予到global，自动将mod.apis添加到路由
let myMods = {
    qn,
};

//模块初始化，生成路由，启动服务器
async function modInit(name, mod) {
    var initRes = mod.init ? await mod.init() : true;
    if(!initRes) {
        console.log(`Mod ${name} init failed:${initRes}.\n`);
        return false;
    } else {
        global['$' + name] = mod;
        if(mod.apis) {
            for(k in mod.apis) {
                router.get(`/${name}/${k}`, mod.apis[k]);
            };
        };
        return true;
    };
};

async function init() {
    for(k in myMods) {
        await modInit(k, myMods[k]);
    };
    app.listen(3300);
};

app.use(router.routes());
app.use(router.allowedMethods());

//启动服务器
init();
console.log(`Server is running on port 3300...`);


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
