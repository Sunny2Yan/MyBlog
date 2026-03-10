#  枚举与模式匹配

## 1. 枚举（enumerations）
枚举出所有可能的值，这些值称为枚举的成员。

```rust
fn main() {
    enum IpAddr {
        V4(String),  // (String)定义枚举类型，可以不加
        // V4(u8, u8, u8, u8)  数字表示
        V6(String),
    }

    let home = IpAddr::V4(String::from("127.0.0.1"));  // :: 获取枚举值
    let loopback = IpAddr::V6(String::from("::1"));
}

// 1.可以将任意类型的数据放入枚举成员中：字符串、数字类型、结构体、甚至包含另一个枚举
struct Ipv4Addr {}
struct Ipv6Addr {}

enum IpAddr {
    V4(Ipv4Addr),
    V6(Ipv6Addr),
}

// 2.多类型枚举
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

// 3.在枚举上定义方法
impl Message {
    fn call(&self) {
        // 在这里定义方法体
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```

#### `Option<T>` 枚举类型

Rust 没有其他语言中的空值功能，**空值**（*Null* ）是一个值，它代表没有值。

```rust
let absent_number: Option<i32> = None;  // 有值的话是 i32

enum Option<T> {  // 要么有值要么没值
    None,
    Some(T),
}

// 例子
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;  // 报错，y可能没有值
```

## 2. match 控制流结构

Rust 的 match 控制流类似于python中的 case，都需要覆盖所有可能性，但 match 的返回值可以是任意类型。

```rust
enum Coin {  // 枚举
    Penny,
    Nickel,
    Dime,
    Quarter,
}

// 输入硬币，返回它的面板值
fn value_in_cents(coin: Coin) -> u8 {
    match coin {  // 匹配（按顺序往下匹配）
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }  // 没有逗号
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

#### 绑定值模式

```rust
#[derive(Debug)] // 这样可以立刻看到州的名称
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),  //
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        }
    }
}

fn main() {
    value_in_cents(Coin::Quarter(UsState::Alaska));
}
```

#### 匹配 `Option<T>` 和 `Some<T>`

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),  // 匹配分支必须包含所有可能性
    }
}

let five = Some(5);  // Some(i) 与 Some(5) 匹配
let six = plus_one(five);  // plus_one中 x=Some(5), 与 Some(i) 匹配
let none = plus_one(None);
```

#### 通配模式与 `_`占位符

```rust
let dice_roll = 9;
match dice_roll {
    3 => add_fancy_hat(),  // 骰子摇到3，得到一顶帽子
    7 => remove_fancy_hat(),  // 骰子摇到7，失去一顶帽子
    other => move_player(other),  // 其他数值只在棋盘上移动（通配分支放到最后）
    // _ => move_player(other),  等价于上面的other
    // _ => (),  其他数值无事发生
}

fn add_fancy_hat() {}
fn remove_fancy_hat() {}
fn move_player(num_spaces: u8) {}
```

## 3. `if let` 控制流

if let 是match的语法糖

```rust
// case 1
let config_max = Some(3u8);
match config_max {
    Some(max) => println!("The maximum is configured to be {}", max),
    _ => (),
}

// 用 if let 重写 case 1，减少代码量
let config_max = Some(3u8);
if let Some(max) = config_max {
    println!("The maximum is configured to be {}", max);
}

// case 2
let mut count = 0;
match coin {
    Coin::Quarter(state) => println!("State quarter from {:?}!", state),
    _ => count += 1,
}

// 用 if let 重写 case 2
let mut count = 0;
if let Coin::Quarter(state) = coin {
    println!("State quarter from {:?}!", state);
} else {
    count += 1;
}
```