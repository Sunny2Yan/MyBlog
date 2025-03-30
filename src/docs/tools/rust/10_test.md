# 自动化测试

Rust 中的测试就是一个带有 `test` 属性注解的函数，为了将一个函数变成测试函数，需要**在 `fn` 行之前加上 `#[test]`**，并使用 `cargo test` 命令运行测试。

## 1. 编写测试

```rust
// 1.测试模块写法
#[cfg(test)]  // 测试模块
mod tests {
    #[test]  // 测试函数(每个测试函数都在一个线程中运行，不影响)
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }  // test tests::it_works ... ok

    #[test]
    fn another() {
        panic!("Make this test fail");
    }  // test tests::another ... FAILED
}

// 2.常用的测试宏
assert!  // 检查结果，结果为True->ok; False->FAILED  assert!(4==4) ok
assert_eq!  // 判断值相等，相等->ok; 不等->FAILED  assert_eq!(4, 4) ok
assert_ne!  // 判断值不等，不等->ok; 相等->FAILED  assert_ne!(4, 5) ok

// 3.自定义失败信息
assert!(string.contains("Carol"));
assert!(string.contains("Carol"),
        "Greeting did not contain name, value was `{}`", string
        );  // 添加输出info，FAILED才会输出

// 4.使用should_panic测试
#[cfg(test)]
mod tests {  // #[should_pamic]位于#[test]之后，不需要测试宏
    use super::*;

    #[test]
    #[should_panic]
    // #[should_panic(expected = "less than or equal to 100")]  // 添加输出info
    fn greater_than_100() {
        Guess::new(200);  // should_panic判断它是否会发生panic
    }
}

// 5.使用Result<T, E>测试
#[cfg(test)]
mod tests {  // 此时不能使用 #[should_panic]
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

## 2. 控制测试的运行

`cargo test` 在测试模式下同 `cargo run` 编译代码并运行生成的测试二进制文件。其产生的二进制文件的默认行为是**并发运行所有的测试**，并截获测试运行过程中产生的输出，阻止他们被显示出来。

```rust
// 1.并发/顺序（向文件写入时）
cargo test -- --test-threads=1  //  --: 分隔符；--test-threads: 参数 

// 2.显示输出
cargo test -- --show-output

// 3.运行部分测试函数
cargo test it_works  // 只运行 it_works()

// 4.过滤运行多个测试
cargo test it  // 运行以 it 开始的函数

// 5.忽略某些测试（#[ignore]）
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // 需要运行一个小时的代码
    }
}

cargo test                       // 运行it_works()
cargo test -- --ignored          // 运行expensive_test()
cargo test -- --include-ignored  // 运行全部
```

## 3.测试的组织结构

测试主要分为**单元测试**（*unit tests*）与 **集成测试**（*integration tests*）。单元测试小而更集中，在隔离的环境中一次测试一个模块，或者是测试私有接口；集成测试属于库的外部，其目的是测试库的多个部分能否一起正常工作。

### 3.1 单元测试（unit tests）

单元测试需要与要测试的代码共同存放在 *src* 目录下相同的文件中，规范是在每个文件中创建包含测试函数的 `tests` 模块，并使用 `cfg(test)` 标注模块。即，每个模块中都有单元测试。

```rust
// #[cfg(test)] 告诉 Rust 只在执行 cargo test 时才编译和运行测试代码，为了 cargo build 时节省编译时间

pub fn add_two(a: i32) -> i32 {
    internal_adder(a, 2)
}

fn internal_adder(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {  // rust 允许测试私有函数
        assert_eq!(4, internal_adder(2, 2));
    }
}
```

### 3.2 集成测试（integration tests）

```bash
adder
├── Cargo.lock
├── Cargo.toml
├── src
│   └── lib.rs
└── tests
    ├── common
    │   └── mod.rs
    └── integration_test.rs  # 每一个文件都是一个独立的crate，需要写入 use adder
```

对于集成测试，运行 `cargo test` 则会测试 *tests/* 目录下的所有文件，并输出单元测试、集成测试和文档测试。可以测试 *tests/* 下的指定目录 `cargo test --test integration_test`。

```rust
// tests/integration_test.rs
use adder;

#[test]
fn it_adds_two() {  // 此时不需要 #[cfg(test)]
    assert_eq!(4, adder::add_two(2));
}

// tests/common/mods.rs  集成测试中的子模块（主要写一些公共模块，但在测试中不显示）
pub fn setup() {
    // setup code specific to your library's tests would go here
}

mod common;  // 在其他测试文件中引用
common::setup();
```

如果项目是二进制 crate 并且只包含 *src/main.rs* 而没有 *src/lib.rs*，这样就不可能在 *tests* 目录创建集成测试并使用 `extern crate` 导入 *src/main.rs* 中定义的函数。只有库 crate 才会向其他 crate 暴露了可供调用和使用的函数；二进制 crate 只意在单独运行。

Rust 二进制项目使用简单的 *src/main.rs* 调用 *src/lib.rs* 中的逻辑，这样集成测试就可以通过 `extern crate` 测试库 crate 中的主要功能。