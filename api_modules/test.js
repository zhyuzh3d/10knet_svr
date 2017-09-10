//zrouter的示例
module.exports = {
    init: async(app) => {},
    apis: {
        'test': {
            info: 'api范例，仅供接口测试', //可选
            method: async function(ctx) { //处理业务流程，必须,否则出异常
                ctx.body = 'Just a api test.';
            },

            validator: { //可选
                uid: /^(undefined|\d{1,3})$/, //正则表达式验证，可选undefined
                name: function(ipt, ctx) { //函数验证必须返回真假，须返回真假值
                    return ipt == 'admin';
                }
            },
            validator_bak: function(ctx) { //手工处理异常
                if(ctx.query.uid != 3) throw Error('用户ID格式非法');
            },
        }
    }
};
