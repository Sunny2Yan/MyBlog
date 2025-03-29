import path from 'node:path'
import fs from 'node:fs'

// 文件根目录
const DIR_PATH = path.resolve('./src')
// 白名单,过滤不是文章的文件和文件夹
const WHITE_LIST = ['index.md', '.vitepress', 'node_modules', '.idea', 'assets']

// 判断是否是文件夹
const isDirectory = (filePath) => fs.lstatSync(filePath).isDirectory()
// 取差值
const intersections = (arr1, arr2) => Array.from(new Set(arr1.filter((item) => !new Set(arr2).has(item))))
// const intersections = (arr1, arr2) => arr1.filter((item) => !arr2.includes(item));

async function processFile(absPath) {
    try {
        const data = await fs.promises.readFile(absPath, 'utf8');
        const firstLine = data.split('\n')[0].trim();
        return firstLine.startsWith('# ') ? firstLine.substring(2).trim() : path
            .basename(absPath).replace(/(^\d+\.)|(\.md$)/g, '');
    } catch (err) {
        console.error(`读取文件出错: ${absPath}`, err);
        return null;
    }
}

processFile.sync = (absPath) => {
    try {
        const data = fs.readFileSync(absPath, 'utf8');
        const firstLine = data.split('\n')[0].trim();
        return firstLine.startsWith('# ') ? firstLine.substring(2).trim() : path.basename(absPath).replace(/(^\d+\.)|(\\.md$)/g, '');
    } catch (err) {
        console.error(`读取文件出错: ${absPath}`, err);
        return null;
    }
};


// 把方法导出直接使用
 function getList(params, basePath, pathname) {
    // 存放结果
    const res = []
    // 开始遍历params
    for (let file in params) {
        // 拼接目录
        const dir = path.join(basePath, params[file])
        // 判断是否assets文件夹
        if (dir.endsWith('.assets')) {
            continue
        }
        // 判断是否是文件夹
        const isDir = isDirectory(dir)
        if (isDir) {
            // 如果是文件夹,读取之后作为下一次递归参数
            const files = fs.readdirSync(dir)
            res.push({
                text: params[file],  //.replace(/^\d+\./g, ''),
                collapsed: true,
                items: getList(files, dir, `${pathname}/${params[file]}`),
            })
        } else {
            // 获取名字
            const name = path.basename(params[file])
            // 排除非 md 文件
            const suffix = path.extname(params[file])
            if (suffix !== '.md') {
                continue
            }
            const fileAbsPath = path.join(DIR_PATH, pathname, name);
            const headingText = processFile.sync(fileAbsPath);
            res.push({
                text: headingText, //name.replace(/(^\d+\.)|(\.md$)/g, ''),
                link: `${pathname}/${name}`,
            })
        }
    }
    return res
}

export const set_sidebar = (pathname) => {
    // 获取pathname的路径
    const dirPath = path.join(DIR_PATH, pathname)
    if (!fs.existsSync(dirPath)) {
        console.error(`路径不存在: ${dirPath}`);
        return [];
    }
    // 读取pathname下的所有文件或者文件夹
    const files = fs.readdirSync(dirPath)
    // 过滤掉
    const items = intersections(files, WHITE_LIST)
    return getList(items, dirPath, pathname)
}