# 复合类型


## 字符串与切片

### 1.1 字符串类型
- str: 不可变字符串类型
- String: 可变字符串；在堆上声明

注：Rust的字符串Slice操作实际上是切的bytes。若切片的位置正好是一个Unicode字符的内部，Rust会发生Runtime的panic

```rust
let x = "Hello";
let x:&'static str = "Hello";  // 同上等价

let mut y = String::from("hello");  // to_string()将str转成String
y.push_str(", world")

let z = &*y  // 将String类型变成str
```

### 1.2 切片（Slice）类型

*slice* 允许你引用集合中一段连续的元素序列，而不用引用整个集合。slice 是一类引用，所以它没有所有权。

```rust
// 找第一个单词的结尾索引
fn first_word(s: &String) -> usize {  // usize是一个无符号整数类型，大小可以根据系统自动调整
    let bytes = s.as_bytes();  // 转化为字节数组

    for (i, &item) in bytes.iter().enumerate() {  // 使用 iter 方法在字节数组上创建一个迭代器
        if item == b' ' {
            return i;  // 返回在该字符串中找到的第一个单词
        }
    }
    s.len()  // 如果未找到空格，则该返回字符串长度
}
```

此时，返回的是一个独立的 `usize`，它只在 `&String` 的上下文中才是一个有意义的数字。即它是一个与 `String` 相分离的值，无法保证将来它仍然有效。具体例子如下：

```rust
fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);  // 调用上面函数，word 的值为 5

    s.clear(); // 这清空了字符串，使其等于 ""
    // word 在此处的值仍然是 5，但是没有更多的字符串可以有效地应用数值 5。word 的值现在完全无效！
}   // 即 word 的索引与 s 中的数据不再同步
```

此时，Rust 为这个问题提供了一个解决方法，即**字符串切片**。

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];   // 也可以 &s[..5], 同 python s[:5]
    let world = &s[6..11];  // // 也可以 &s[6..], 同 python s[6:]
    let all = &s[..]
}
```

<img src="/imgs/tools/rust/3-5.png" style="zoom:50%;" />

于是可以使用切片来重写第一个函数：

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);

    s.clear(); // 错误。clear 清空 String，获取一个可变引用；println! 又使用了 word 中的不可变引用
    // 可以将上述函数改为 fn first_word(s: &str) -> &str {}, 且 s 为不可变。
    println!("the first word is: {}", word);
}
```

#### 其他类型切片

```rust
// 1.对数组切片
let a = [1, 2, 3, 4, 5];
let slice = &a[1..3];

assert_eq!(slice, &[2, 3]);
```


- 元组(tuple)：元组长度固定，元组中的每个元素的类型不必相同，用 `tup` 声明元组类型；
- 数组(array)：数组长度固定，数组中的每个元素的类型必须相同，vector 类型是标准库提供的允许增长和缩小长度的类似数组的集合类型，一般不确定长度的用 vector；

```rust
fn compound(){
    // 2.2.1 元组
    let tup: (i32, f64, u8) = (500, 6.4, 1);

    let tup = (500, 6.4, 1);
    let (x, y, z) = tup;  // 解构元组，注意(.)
    let x = tup.0;  // 索引访问
    // 注：不带任何值的元组有个特殊的名称，叫做 单元（unit） 元组，其对应类型写作()，表示空

    // 2.2.2 数组（长度固定，存在栈上）
    let a = [1, 2, 3, 4, 5];
    let months = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];
    let a: [i32; 5] = [1, 2, 3, 4, 5];  // ; 5表示元素数量
    let a = [3; 5];  // 初始值加分号再加元素个数 [3, 3, 3, 3, 3]

    let first = a[0];  // 索引访问
}
```

### 2.3 泛型数据类型

泛型是具体类型或其他属性的抽象替代。函数可以获取一些不同于 `i32` 或 `String` 这样具体类型的泛型参数，就像一个获取未知类型值的函数可以对多种具体类型的值运行同一段代码一样。

如函数同时接受 `i32` 和 `char` 类型，则需要为新类型参数取个名字，任何标识符都可以作为类型参数的名字，Rust 首选用 `T`。

```rust
// 1. 函数中使用泛型
fn largest<T>(list: &[T]) -> &T {  // <T>定义新的参数类型为T
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];

    let result = largest(&number_list);  // 接受i32类型
    println!("The largest number is {}", result);

    let char_list = vec!['y', 'm', 'a', 'q'];

    let result = largest(&char_list);  // 接受char类型
    println!("The largest char is {}", result);
}

// 2. 结构体中使用泛型
struct Point<T> {  // 同上面函数
    x: T,
    y: T,          // x, y必须是相同类型，否则报错
}

fn main() {
    let integer = Point { x: 5, y: 10 };
    let float = Point { x: 1.0, y: 4.0 };
}

// 推广
struct Point<T, U> {  // 定义两个抽象类型
    x: T,
    y: U,        // x, y可以不是相同类型
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}

// 3. 枚举中使用泛型
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}

// 4. 方法中使用泛型
struct Point<X1, Y1> {
    x: X1,
    y: Y1,
}

impl<X1, Y1> Point<X1, Y1> {  // 实例化结构体的方法
    fn mixup<X2, Y2>(self, other: Point<X2, Y2>) -> Point<X1, Y2> {
        Point {
            x: self.x,  // 返回字段x中的数据引用
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };
    let p3 = p1.mixup(p2);
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

注：编译时，编译器会根据具体的类型将泛型还原，因此泛型不会影响性能。

## 3. 函数
Rust 用 `fn` 关键字来声明新函数，函数名使用小写字母并用下划线分隔单词。Rust 返回值时不需要对返回值命名，但要在箭头（`->`）后声明它的类型。

```rust
// 1. 带参数
fn another_function(key: char, value: i32) {  // 参数类型必须指明
    println!("{key}: {value}");
}  // Rust 不关心函数定义所在的位置，只要函数被调用时出现在调用之处可见的作用域内就行

fn plus_one(x: i32) -> i32 {
    x + 1  // 没有分号，完整的语句不会返回值
}

fn add(x: i32) -> i32 {
    if x > 10 {
        return x * 2
    }
    x + 5
}

fn main() {
    println!("Hello, world!");
    var();
    scalar_type();
    compound();

    // 1. 带参数
    another_function('x', 5);

    // 2. 赋值
    let y = {  // 不能 y=x=3
        let x = 3;  // 语句需要 ;结尾
        x + 1     // 表达式不需要 ; 结尾
    };
    println!("The value of y is: {y}");

    // 3. 返回值
    let x = plus_one(5);
    println!("The value of x is: {x}");

    // 4. 提前返回要用 return
    let y = add(8);
    println!("The value of y is: {y}");
}
```



# 结构体

## 1. 结构体的定义与实例化

使用 `struct` 关键字定义结构体，结构体中每一部分数据的名字和类型，称为 **字段（field）**。

```rust
struct User {  // 类似于python中只包含参数的类
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,  // 最后一个字段也要逗号
}

fn main() {
    let user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };  // 结构体的一个实例

    user1.email = String::from("anotheremail@example.com");  // 结构体实例的一个属性

    let user2 = User {
        email: String::from("another@example.com"),
        ..user1  // 更新结构体，除 email，其他同 user1 相同
    };
}

// 定义函数使用结构体
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,
        email,
        sign_in_count: 1,
    }
}
```

结构体更新语法同 `=` 赋值，由于 user1 的 `username` 字段被移到 user2 中，因此**创建 user2 后不能再使用 user1**。若给 user2 的 `email` 和 `username` 都赋予新的 String 值，只使用 user1 的 `active` 和 `sign_in_count` 值，那么 user1 在创建 user2 后仍然有效。`active` 和 `sign_in_count` 的类型是实现 Copy trait 的类型。

#### 没有字段名的元组结构体

可以定义与元组类似的结构体，称为 **元组结构体（tuple structs）**，即没有具体的字段名，只有字段的类型。

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);
// 注意 black 和 origin 值的类型不同，定义的每一个结构体有其自己的类型，即使结构体中的字段可能有着相同的类型。
```

#### 没有字段的类单元结构体

可以定义一个没有任何字段的结构体称为 **类单元结构体（unit-like structs）**。类似于 `()`，即元组类型中的 unit 类型。

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

## 2. 结构体示例

```rust
// 计算长方形面积
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    println!("The area of the rectangle is {} square pixels.", area(&rect1));
    // 不可变借用，而不是拥有所有权
}

fn area(rectangle: &Rectangle) -> u32 {  // &借用不移动
    rectangle.width * rectangle.height
}
```

#### 通过派生 trait 增加实用功能

在调试程序时打印出结构体实例来查看其所有字段的值。

```rust
// 查看结构体的所有字段值
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {}", rect1);  // 报错，输出格式不明确（是否打印逗号？需要打印出大括号吗？...）
}

// 重写上面函数
#[derive(Debug)]  // 增加属性来派生 Debug trait，并使用调试格式打印 Rectangle 实例
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("rect1 is {:?}", &rect1);  // 1.rect1 is Rectangle { width: 30, height: 50 }
    println!("rect1 is {:#?}", &rect1);  // 2.按结构体格式输出
    dbg!(&rect1);  // 3.使用 dbg! 宏打印数值，比2更详细，包含文件名、行号信息
}
```

## 3. 方法语法

方法与函数不同，它是**在结构体（枚举、 trait 对象）的上下文中被定义，且第一个参数总是 `self`**，代表调用该方法的结构体实例。使用方法替代函数，其主要好处在于组织性，可以将某个类型实例能做的所有事情都一起放入 `impl` 块中。

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {  // impl 是 implementation 的缩写，表示与Rectangle关联
    // &self 实际上是 self: &Self 的缩写，Self 类型是 impl 块的类型的别名
    fn area(&self) -> u32 {  // self 表示 Rectangle 结构体
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!("The area of the rectangle is {} square pixels.", rect1.area());  // 使用方法
}
```

#### 多参数方法

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height  // && 且
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    let rect2 = Rectangle {
        width: 10,
        height: 40,
    };
    let rect3 = Rectangle {
        width: 60,
        height: 45,
    };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));
}
```

#### 关联函数

所有在 `impl` 块中定义的函数被称为 **关联函数（associated functions）**，它们与 `impl` 后面命名的类型相关。可以定义不以 `self` 为第一参数的关联函数（因此不是方法），因为它们并不作用于一个结构体的实例。

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn square(size: u32) -> Self {  // 关联函数，常用作返回结构体实例
        Self {  // Self 代指在 impl 关键字后出现的类型，这里是 Rectangle
            width: size,
            height: size,
        }
    }
}

fn main() {
    let sq = Rectangle::square(3);  // 使用结构体中的关联函数，同String::from()
}
```

每个 struct 允许拥有多个 impl 块。






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













