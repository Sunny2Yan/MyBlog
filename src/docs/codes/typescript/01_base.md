# 入门了解

TypeScript 是 JavaScript 的超集，是建立在 JavaScript 之上的编程语言。TypeScript 代码会被编译器编译成原生 JavaScript 代码再运行。

TypeScript **不教“如何编程”，只教“如何类型安全”**。它增加了类型系统来避免一些由 JavaScript 中的动态类型引发的问题。

## 安装

### `node.js` + `pnpm` 方式
1. 安装 [node.js](https://nodejs.org/zh-cn)

`node.js` 是 JavaScript 的后端运行环境，`npm` 是 `node.js` 的包管理工具，`pnpm` 是 `npm` 更快、更省空间的替代，推荐使用 `pnpm`。

```bash
# 1. 安装 node.js 推荐使用 nvm 管理node，可以多个项目对应多个版本 node 不冲突
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash  # 安装 nvm
\. "$HOME/.nvm/nvm.sh"  # 代替重启 shell

nvm install 24  # 安装node
node -v  # 验证

# 2. 安装 pnpm
corepack enable pnpm
pnpm -v

# 3. 安装 typescript
pnpm install -g typescript
tsc -v
```


::: tip 彻底删除 `node`
```bash
which node
rm -rf ...

which npm
rm -rf ...  # rm -rf ~/.npm

which pnpm
rm -rf ...
```
:::

2. 运行 `Hello World`

```typescript
// app.ts

let message: string = 'Hello, World!';
console.log(message);
```

运行代码
```bash
tsc app.ts  # 将代码文件编译成 app.js 文件
node app.js  # 执行文件

# 直接执行文件
ts-node app.ts  # 需要安装 ts-node: pnpm install -g ts-node
```

### `bun` 方式（推荐）

Bun 是用于运行 JavaScript 和 TypeScript 应用程序的集成工具包。

1. 安装 [bun](https://www.bunjs.cn/)

```bash
# 安装
curl -fsSL https://bun.sh/install | bash
bun -v

# 更新
bun upgrade
# 卸载
rm -rf ~/.bun  
```

2. 运行 `Hello World`

```typescript
// app.ts

let message: string = 'Hello, World!';
console.log(message);
```

运行代码
```bash
bun run app.ts
```

3. `bun` 管理项目

```bash
bun init  # 初始化项目

# project/
# ├── .gitignore
# ├── bun.lock
# ├── node_modules
# ├── package.json
# ├── README.md
# └── tsconfig.json

# 可以在 package.json 中添加 "scripts": {"start": "bun run index.ts"}， 可以添加多条快捷命令
bun run start  # 添加后不需要在指定目标文件

bun add ...  # 将指定的包添加到 package.json 的 dependencies 中
bun remove ...  # 将指定的包从 package.json 的 dependencies 中移除

bun install ...  # 根据现有配置文件安装
bun update [package]  # 更新依赖中的所有或指定包

# bun pm 子命令集。上述是它的快捷方式
bun pm ls  # 列出所有包
bun pm cache dir  # 查看缓存位置
bun pm cache rm  # 清理缓存
bun pm why <pkg>  # 查看包来源
```