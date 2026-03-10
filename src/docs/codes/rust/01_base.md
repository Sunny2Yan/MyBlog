# 了解入门

## Install

`rustup` 是一个管理 Rust 版本和相关工具的命令行工具，这里通过 `rustup` 安装 Rust.

```bash
# linux
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
# 注：Linux需要安装GCC、Ubuntu需要安装build-essential包，MacOS需要安装C编译器(xcode-select --install)

# 速度慢时添加清华镜像源
export RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup
export RUSTUP_UPDATE_ROOT=https://mirrors.tuna.tsinghua.edu.cn/rustup/rustup

# windows
RUSTUP_HOME  D:\Rust\.rustup  # 新建环境变量
CARGO_HOME   D:\Rust\.cargo
%RUSTUP_HOME%  # 将环境变量添加到 PATH
%CARGO_HOME%

3 (Don't install the prerequisites)
2 (Customize installation)
x86_64-pc-windows-gnu
stable
default
y (Modify PATH variable)
1 (Proceed with installation)
```

1. `rustc --version` 查看是否安装成功；
2. 查看是否在系统变量中：Linux（`echo $PATH`）、CMD（`echo %PATH%`）、PowerShell（`echo $env:Path`）;
3. 更新：`rustup update`；
4. 卸载：`rustup self uninstall`。

::: info 补充 
1. 安装 Rust 的同时也会在本地安装⼀个⽂档服务，⽅便离线阅读：运⾏ `rustup doc` 在浏览器打开本地⽂档。
2. IDE推荐使用 VSCode，推荐插件有：
 - `rust-analyzer`：Rust 语⾔的插件；
 - `Even Better TOML`：⽀持 .toml ⽂件完整特性；
 - `Error Lens`：更好的获得错误展示；
 - `CodeLLDB`：Debugger 插件；
 - `One Dark Pro`：好看的 VSCode 主题
:::

## Rust

Rust 源文件以 `.rs` 扩展名结尾。若文件名包含多个单词，应使用下划线来分隔单词（如 `hello_world.rs`），而不是 `helloworld.rs`。

```rust
// main.rs
fn main() {
    println!("Hello, world!");
}
```

1. Rust 的缩进风格使用 4 个空格，而不是 1 个制表符（tab）；
2. `println!` 表示调用了一个 Rust 宏（macro），如果调用函数，则是 `println`（没有`!`）；
3. 以分号结尾（`;`），表示一个表达式的结束和下一个表达式的开始；

```bash
# Linux
rustc main.rs  # 使用 Rust 编译器编译
./main         # 运行程序

# Windows
rustc main.rs
.\main.exe
```

## Cargo

Cargo 是 Rust 的项目和包管理器，可以构建代码、下载依赖库并编译这些库。不需要安装，Rust自带的，可以使用 `cargo --version` 查看是否安装 Cargo。

```bash
cargo new Project  # 新建名为 Project 的目录和项目，并在此目录下初始化一个 git 仓库。
cargo init Project  # Project目录已经存在的情况下使用

# .
# ├── .git
# ├── .gitignore
# │── Cargo.toml  # TOML (Tom's Obvious, Minimal Language) 格式为 Cargo 配置文件的格式
# │── Cargo.lock  # 根据 toml ⽂件⽣成的项⽬依赖详细清单。初始化项目不会生成，每次执行会更新
# └── src
#     └── main.rs
```

::: info 补充
Cargo 期望源文件存放在 *src* 目录中，项目根目录只存放 README、license 信息、配置文件和其他跟代码无关的文件。
:::

```bash
# 运行项目（运行完成后，会在根目录下创建 Cargo.lock 文件，记录项目依赖的实际版本）

# Linux
cargo build  # 在 Pro'j 目录下执行，会创建可执行文件 target/debug/Project
./target/debug/hello_cargo  # 运行项目 

# Windows
cargo build
.\target\debug\hello_cargo.exe

cargo run  # 编译并运行
cargo check  # 快速检查代码确保其可以编译，不生成可执行文件
```

::: info 补充
默认以 debug 模式编译，**编译速度会⾮常快，但运⾏速度就慢**；使用 `cargo build --release` 或 `cargo run --release` 可以编译为最终版本，**编译慢但运行快**。
:::

## Toml定义项目依赖

```toml
[package]  # 项目信息
name = "project"  # 项目名
version = "0.1.0"  # 项⽬默认是 0.1.0
edition = "2024"  # Rust ⼤版本

[dependencies]  # 定义项目依赖
rand = "0.3"  # 版本号定义
hammer = { version = "0.5.0"}  # 版本说明定义
color = { git = "https://github.com/bjz/color-rs" }  # 源代码定义
geometry = { path = "crates/geometry" }  # 本地文件定义
```

## Rust 注释
Rust 代码文件中，通常有 3 种注释：
- 行注释
- 文档注释
- 模块注释


```rust
// 1. 行注释使用 `//`
// 这是一个单行注释
// 多行注释也是双斜杠

// 2. 文档注释使用 `///`，用于函数或结构体（字段）的说明，置于要说明的对象上方。文档注释内可使用markdown语法。
/// ```
/// let five = 5;
///
/// assert_eq!(6, add_one(5));
/// # fn add_one(x: i32) -> i32 {
/// #     x + 1
/// # }
/// ```

// 3. 模块注释使用 `//!`，用于说明模块的功能，一般置于模块文件的头部。模块注释内也可使用markdown语法。
//! # The Rust Standard Library
//!
//! The Rust Standard Library provides the essential runtime
//! functionality for building portable Rust software.
```

::: info 补充
注：文档注释和模块注释用于生成 html 文档，使用命令 `rustdoc main.rs` 或 `cargo doc` 即可。
:::
