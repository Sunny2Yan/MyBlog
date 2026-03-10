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