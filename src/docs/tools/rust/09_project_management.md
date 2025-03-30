# Cargo 项目管理
模块系统（the module system）：

-   **包（Packages）**：Cargo 的一个功能，它允许构建、测试和分享 crate。
-   **Crates** ：一个模块的树形结构，它形成library库或二进制项目。
-   **模块（Modules）**和 **use**：允许控制作用域和路径的私有性。
-   **路径（path）**：一个命名例如结构体、函数或模块等项的方式

## 1. 包和 Crate

crate 是 Rust 在编译时最小的代码单位，crate 可以包含模块，模块可以定义在其他文件，然后和 crate 一起编译。crate 有两种形式：

-   二进制项：可以被编译为可执行程序，如一个命令行程序或者一个服务器。其中必须有一个 `main` 函数来定义当程序被执行的时候所需要做的事情。前面创建的 crate 都是二进制项；
-   库：没有 `main` 函数，也不会编译为可执行程序，只提供一些诸如函数之类的东西，使其他项目也能使用。

*crate root* 是一个源文件，Rust 编译器以它为起始点，并构成你的 crate 的根模块；

*包*（*package*）是提供一系列功能的一个或者多个 crate。一个包会包含一个 *Cargo.toml* 文件，阐述如何去构建这些 crate。Cargo 就是一个包含构建你代码的二进制项的包。Cargo 也包含这些二进制项所依赖的库。其他项目也能用 Cargo 库来实现与 Cargo 命令行程序一样的逻辑。

**包中可以包含至多一个库 crate(library crate)；可以包含任意多个二进制 crate(binary crate)，但是必须至少包含一个 crate**（无论是库的还是二进制的）。

库 `Package` 是一个项目工程，而包只是一个编译单元，真实项目例子如下：

```
// Project(package)
├── Cargo.toml
├── Cargo.lock
├── src
│   ├── main.rs  // package 包含 binary crate（可以多个）
│   ├── lib.rs   // package 包含 library crate（只有一个）
│   └── bin
│       └── main1.rs  //（binary crate）
│       └── main2.rs
├── tests
│   └── some_integration_tests.rs
├── benches
│   └── simple_bench.rs
└── examples
    └── simple_example.rs
```
- cargo.toml: 存储项目的所有信息，需要自己编写；
- cargo.lock: 根据toml文件生成的项目依赖详细清单文件，不需要修改。
-   唯一库包：`src/lib.rs`
-   默认二进制包：`src/main.rs`，编译后生成的可执行文件与 `Package` 同名
-   其余二进制包：`src/bin/main1.rs` 和 `src/bin/main2.rs`，它们会分别生成一个文件同名的二进制可执行文件
-   集成测试文件：`tests` 目录下
-   基准性能测试 `benchmark` 文件：`benches` 目录下
-   项目示例：`examples` 目录下

```toml
[package]
name = "hello_world"
version = "0.1.0"
authors = ["fuying"]

[dependencies]  # 导入外部包，具体在crates.io
typemap = "0.3"
plugin = "0.2*"
hammer = { version = "0.5.0" }
color = { git = "https://github.com/bjz/color-rs" }  # 通过git导入
geometry = { path = "crates/geometry" }  # 本地导入

[[test]]  # 集成测试
name = "testtime"
path = "tests/testtime.rs"

[[example]]
name = "timeout"
path = "examples/timeout.rs"

[[bin]]
name = "bin1"
path = "bin/bin1.rs"
```
examples 和 bins 需要通过 `cargo run —example NAME` 或者 `cargo run —bin NAME` 来运行。

## 2. 定义模块控制作用域与私有性

模块的工作方式：

1.   **从 crate 根节点开始**：当编译一个 crate 时，编译器首先在 crate 根文件（库 crate 是*src/lib.rs*，二进制 crate 是*src/main.rs*）中寻找需要被编译的代码；
2.   **声明模块**：在 crate 根文件中，可以声明一个新模块；如用 `mod garden` 声明一个叫做 `garden`的模块。编译器会在下列路径中寻找模块代码：
    -   内联，在大括号中，当`mod garden`后方不是一个分号而是一个大括号
    -   在文件 *src/garden.rs*
    -   在文件 *src/garden/mod.rs*
3.   **声明子模块**：在除了 crate 根节点以外的其他文件中，可以定义子模块。如 `src/garden.rs` 中定义了 `mod vegetables;`。编译器会在以父模块命名的目录中寻找子模块代码：
    -   内联，在大括号中，当`mod vegetables`后方不是一个分号而是一个大括号
    -   在文件 *src/garden/vegetables.rs*
    -   在文件 *src/garden/vegetables/mod.rs*
4.   **模块中的代码路径**：如果模块是 crate 的一部分，则可以在隐私规则允许的前提下，从同一个 crate 内的任意地方，通过代码路径引用该模块的代码。如 garden vegetables 模块下的`Asparagus`类型可以在`crate::garden::vegetables::Asparagus` 被找到；
5.   **私有 vs 公用**：一个模块里的代码**默认对其父模块私有**。为了公有化，可以在声明时使用 `pub mod` 替代 `mod`。为了使一个公用模块内部的成员公用，应当在声明前使用 `pub`；
6.   **`use` 关键字**：在一个作用域内，`use` 关键字创建一个成员的快捷方式，用来减少长路径的重复。在任何可以引用`crate::garden::vegetables::Asparagus`的作用域，通过 `use crate::garden::vegetables::Asparagus;` 来创建一个快捷方式，然后就可以在作用域中只写`Asparagus`来使用该类型。（同 python 的 import）

```
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

```rust
// main.rs
use crate::garden::vegetables::Asparagus;

pub mod garden;  // 告诉编译器应该包含在src/garden.rs文件中的代码

fn main() {
    let plant = Asparagus {};
    println!("I'm growing {:?}!", plant);
}

// garden.rs
pub mod vegetables;  // 即，在src/garden/vegetables.rs中的代码也应该被包括
```

模块可以嵌套，组成模块树;

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

其模块树结构为：

```
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

## 3. 引用模块项目的路径

-   **绝对路径**（*absolute path*）是以 crate 根（root）开头的全路径；对于外部 crate 的代码，是以 crate 名开头的绝对路径，对于对于当前 crate 的代码，则以字面值 `crate` 开头。
-   **相对路径**（*relative path*）从当前模块开始，以 `self`、`super` 或当前模块的标识符开头。

绝对路径和相对路径都后跟一个或多个由双冒号（`::`）分割的标识符。在 Rust 中，默认所有项（函数、方法、结构体、枚举、模块和常量）对父模块都是私有的。即，**父模块中的项不能使用子模块中的私有项，但是子模块中的项可以使用他们父模块中的项**。

```rust
// src/lib.rs
mod front_of_house {
    pub mod hosting {  // 公有模块
        pub fn add_to_waitlist() {}  // 也需要公有化
    }
}

pub fn eat_at_restaurant() {  // 对外公有化
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();  // crate表示当前crate，外部crate需要名称
    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

注：**为什么 `front_of_house` 不需要公有化**？ 因为 `eat_at_restaurant` 函数与 `front_of_house` 定义于同一模块中（即，`eat_at_restaurant` 和 `front_of_house` 是兄弟），可以从 `eat_at_restaurant` 中引用 `front_of_house`。

### 3.1 super 开始的相对路径

```rust
// src/lib.rs
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();  // super允许引用父模块中的已知项
    }

    fn cook_order() {}
}
```

### 3.2 公有的结构体和枚举

在一个结构体的前面使用了 `pub` ，则这个结构体会变成公有的，但是这个结构体的字段仍然是私有的，可以公有化每个字段。与之相反，将枚举设为公有，则它的所有成员都将变为公有。

```rust
// 1.结构体 src/lib.rs
mod back_of_house {
    pub struct Breakfast {   // 公有化结构体
        pub toast: String,  // 公有化字段
        seasonal_fruit: String,
    }
    // impl定义关联函数，来定义结构体成员方法
    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    let mut meal = back_of_house::Breakfast::summer("Rye");  // 访问公有字段
    meal.toast = String::from("Wheat");
    println!("I'd like {} toast please", meal.toast);
    // meal.seasonal_fruit = String::from("blueberries");  // 报错，私有字段不能访问
}

// 2.枚举 src/lib.rs
mod back_of_house {
    pub enum Appetizer {  // 只需公有化枚举，字段全部公有
        Soup,
        Salad,
    }
}

pub fn eat_at_restaurant() {
    let order1 = back_of_house::Appetizer::Soup;
    let order2 = back_of_house::Appetizer::Salad;
}
```

## 4. 使用 `use` 将路径引入作用域

对于上节，无论是绝对路径，还是相对路径都很长，可以使用 `use` 关键字创建一个短路径，然后在作用域中的任何地方使用这个短的名字

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;  // 使用use将hosting模块引入作用域
// use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();   // 习惯性用法，
    // add_to_waitlist();  // 也对，但不是习惯性用法
}

// 错误示例
mod customer {
    pub fn eat_at_restaurant() {
        hosting::add_to_waitlist();  // 报错，use没有引入此模块中，作用域不对
    }
}
```

使用 `use` 引入结构体、枚举和其他项时，习惯是指定它们的完整路径。

```rust
use std::collections::HashMap;  // 引入 hash map 模块

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}

// 引入相同名称的项到作用域
use std::fmt;
use std::io;

fn function1() -> fmt::Result {}  // 1.习惯性写法
fn function2() -> io::Result<()> {}


use std::fmt::Result;
use std::io::Result as IoResult;  // 2.取别名，也是习惯性写法

fn function1() -> Result {}
fn function2() -> IoResult<()> {}
```

使用 `use` 关键字，将某个名称导入当前作用域后，此名称只能在此作用域中使用，作用域之外还是私有的。此时需要将 `pub` 和 `use` 合起来使用，称为 “**重导出（re-exporting）**”：不仅将一个名称导入了当前作用域，还允许别人把它导入自己的作用域。

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

### 4.1 使用外部包

首先需要在 *Cargo.toml* 文件中加入 `rand = "0.8.5"`，告诉了 Cargo 要从 [crates.io](https://crates.io/) 下载 `rand` 和其依赖；其次将 `rand` 定义引入项目包的作用域 `use rand::Rng`。

引入多个相同包或模块的项时，可以简化（同python）：

```rust
// 简化1
use std::cmp::Ordering;
use std::io;

use std::{cmp::Ordering, io};

// 简化2
use std::io;
use std::io::Write;

use std::io::{self, Write};

// 简化3（glob运算符 *，常用于test）
use std::collections::*;  // 引入路径下的所有公有项
```

## 5. 模块拆分为多个文件

将不同的模块定义到单独的文件中可以使代码更容易阅读。

```rust
// src/front_of_house.rs
pub mod hosting {
    pub fn add_to_waitlist() {}
}

// src/lib.rs
mod front_of_house;  // sheng加载的文件

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

