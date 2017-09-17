//载入各个api模块，自动初始化，自动将apis加入到路由;
//每个api模块提供初始化async函数、多个api对象、公用函数；
//{init(app),apis:{apiname:{info,validator,method,handler},...},fns:{}}
//每个api将被赋值到global[_name]上以便于公开调用
//模块示例参见api_modules/test.js

const $koaRouter = require('koa-router');

let theApp;
let krouter = new $koaRouter();

/**
 * 初始化所有模块,将mods生成路由/api/name/
 * @param   {object}  app  koa app
 * @param   {object}  mods 包含所有模块的对象{}
 * @returns {boolean} true
 */
async function init(app, mods) {
    theApp = app;
    for(k in mods) {
        await initMod(k, mods[k]);
    };
    app.use(krouter.routes());
    app.use(krouter.allowedMethods());
    return true;
};

/**
 * 初始化单个模块
 * @param   {string}  name 模块名称
 * @param   {object}  mod  {init,apis:{apiname:{},...},fns:{}}
 * @returns {boolean} true
 */
async function initMod(name, mod) {
    mod.init ? await mod.init(theApp) : true;
    if(mod.apis) {
        for(k in mod.apis) {
            if(!mod.method) mod.method = 'all';
            mod.method = mod.method.toLocaleLowerCase();

            var apiObj = mod.apis[k];
            let path = `/api/${name}/${k}`;

            //添加单个api接口
            krouter[mod.method](path, genHandler(path, mod.method, apiObj));

            //自动添加api-info接口
            if(apiObj.info !== undefined) {
                const infoPath = path + '-info';
                let infoApi = genInfoApiObj(apiObj);
                krouter.get(infoPath, genHandler(infoPath, 'get', infoApi));
            };
        };
    };
};


/**
 * 生成单个api处理函数，合并validator和handler函数;遇到异常直接返回错误
 * @param   {string}   path   api路径/api/test/demo
 * @param   {string}   method get/post/all
 * @param   {object}   apiObj {info,validator,method,handler}
 * @returns {function} async函数
 */
function genHandler(path, method, apiObj) {
    const handler = async(ctx, next) => {
        console.log(`[zrouter]${method.toUpperCase()}:${path}.`); //测试输出
        try {
            apiObj.validator && await validate(ctx, apiObj);
            if(apiObj.handler) {
                await apiObj.handler(ctx, next);
            } else {
                ctx.body = `[zrouter]${method.toUpperCase()}:${path}:handler not found.`
            };
        } catch(err) {
            ctx.body = {
                code: 0,
                tip: err.message,
                data: {},
            };
            console.log(`[zrouter]Api handler failed:`, err);
        };
    };
    return handler;
};


/**
 * 生成单个api-info对象，转化validator每个值为字符串，否则不能传递出去
 * @param   {object}   apiObj {info,validator,method,handler}
 * @returns {function} async函数
 */
function genInfoApiObj(apiObj) {
    var valiInfo = {};
    if(apiObj.validator) {
        for(k in apiObj.validator) {
            valiInfo[k] = String(apiObj.validator[k]);
        };
    };
    const infoApiObj = {
        handler: async(ctx, next) => {
            var infoRes = {
                info: apiObj.info,
                validator: valiInfo,
            };
            ctx.body = infoRes;
        }
    };
    return infoApiObj;
};


/**
 * 每个实例默认的认证方法，使用validator每个key的表达式进行验证，遇到非法即抛出异常；
 * 如果validator是个async(ctx, apiObj)函数，那么直接调用这个函数，不做其他处理
 * 支持url参数和body参数，验证通过后记入ctx.xdata
 * @param {object} apiObj {info,validator,method,handler}
 * @param {object} ctx    ctx
 * @throws {Error} err
 */
async function validate(ctx, apiObj) {
    if(apiObj.validator.constructor == Function) {
        apiObj.validator(ctx, apiObj);
    } else if(apiObj.validator.constructor == Object) {
        for(var key in apiObj.validator) {
            var inputValue = ctx.query[key] || (ctx.request.body && ctx.request.body[key]);
            var vali = apiObj.validator[key];
            var legal = true;
            if(vali.constructor == RegExp) {
                legal = vali.test(inputValue);
            } else {
                legal = await vali(inputValue, ctx); //验证函数需要返回真假值
            };

            if(!legal) {
                throw new Error(`数据格式错误:${key}`);
                break;
            } else {
                if(!ctx.xdata) ctx.xdata = {};
                ctx.xdata[key] = inputValue;
            };
        };
    };
};


//输出
module.exports = {
    init,
    krouter,
};
