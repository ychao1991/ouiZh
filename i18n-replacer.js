const fs = require('fs');
const path = require('path');

// 读取i18n tokens文件
const tokensData = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18ntokens.json'), 'utf8'));

tokensData.forEach(tokenItem => {
    const filePath = path.join(__dirname, tokenItem.filepath);
    let fileContent = fs.readFileSync(filePath, 'utf8');

    // 处理单引号字符串的特殊情况
    const escapedDefString = tokenItem.defString
        .replace(/\\/g, '\\\\')  // 转义反斜杠
        .replace(/'/g, "\\'")   // 转义单引号
        .replace(/"/g, '\\"')   // 转义双引号
        .replace(/\n/g, '\\n')  // 处理换行符
        .replace(/\r/g, '\\r')   // 处理回车符
        .replace(/\t/g, '\\t'); // 处理制表符

    // 改进的正则表达式，处理单引号和双引号情况
    const regex = new RegExp(
        `<OuiI18n[^>]*token=(['"])${tokenItem.token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\1[^>]*>`,
        'g'
    );

    fileContent = fileContent.replace(regex, match => {
        // 替换default属性，智能处理引号类型
        const quoteType = match.includes("default='") ? "'" : '"';
        return match.replace(
            new RegExp(`default=${quoteType}[^${quoteType}]*${quoteType}`),
            `default=${quoteType}${escapedDefString}${quoteType}`
        );
    });

    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`已更新: ${tokenItem.filepath} - ${tokenItem.token}`);
});

console.log('i18n token更新完成');
