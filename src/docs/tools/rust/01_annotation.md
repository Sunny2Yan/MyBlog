# Rust 注释
Rust 代码文件中，通常有 3 种注释：
- 行注释
- 文档注释
- 模块注释

## 1. 行注释
行注释使用 `//`。
```rust
// 这是一个单行注释
// 多行注释也是双斜杠
```

## 2. 文档注释
文档注释使用 `///`，用于函数或结构体（字段）的说明，置于要说明的对象上方。文档注释内可使用markdown语法。
```rust
/// ```
/// let five = 5;
///
/// assert_eq!(6, add_one(5));
/// # fn add_one(x: i32) -> i32 {
/// #     x + 1
/// # }
/// ```
```

## 3. 模块注释
模块注释使用 `//!`，用于说明模块的功能，一般置于模块文件的头部。模块注释内也可使用markdown语法。
```rust
//! # The Rust Standard Library
//!
//! The Rust Standard Library provides the essential runtime
//! functionality for building portable Rust software.
```

**注：文档注释和模块注释用于生成 html 文档，使用命令 `rustdoc main.rs` 或 `cargo doc` 即可。**