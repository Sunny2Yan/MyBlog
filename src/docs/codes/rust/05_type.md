# 类型

## 1. 变量类型
- 变量(variables)：当变量不可变时，一旦值被绑定一个名称上，就不能改变这个值。可以在变量名前添加 mut 来使其可变；
- 常量(constants)：声明常量使用 const 关键字，且必须注明值的类型。Rust 对常量的命名约定是在单词之间使用全大写加下划线；
- 隐藏(Shadowing)：定义一个与之前变量同名的新变量，则称第一个变量被第二个隐藏。

```rust
let x = 5; // 不可变变量
let mut y = 5;  // 可变变量
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;  // 常量
let x = x + 1;  // 这个变量x隐藏了上面的x，此时不需要mut（mut是可改变变量值，而隐藏是创建新的变量）

// 隐藏与mut的区别：
let spaces_1 = "   ";
let spaces_1 = spaces_1.len();  // 4

let mut spaces_2 = "   ";
// spaces_2 = spaces_2.len();  // 报错，不能改变变量类型

// 注：对于声明后未使用的变量，Rust 会给出警告，因为这可能会是个 BUG，可以使用下划线开头避免警告，如 `_x`。
```

## 2. 数据类型
Rust 的数据类型(data type)分为两类：标量(scalar)和复合(compound)。
Rust 是静态类型（statically typed）语言，即在编译时就必须知道所有变量的类型，如果不确定使用什么类型可以使用泛型类型来抽象代替。

### 2.1 标量类型
- 整型：有符号：`i8`、`i16`、`i32`、`i64`、`i128`（数字为 bit），无符号：`u8`、`u16`、`u32`、`u64`、`u128`（数字为 bit），默认是 `i32`;
- 浮点型：`f32`、`f64`，默认是 `f64`（所有浮点型都是有符号的）；
- 布尔型：`true`，`false`，
- 字符类型：用单引号声明 `char` 字面量，双引号声明字符串字面量，`char` 类型的大小为 4-bit（Unicode）

```rust
fn scalar_type(){
    let sum = 5 + 10;  // addition
    let difference = 95.5 - 4.3;  // subtraction
    let product = 4 * 30;  // multiplication
    let quotient = 56.7 / 32.2;  // division

    let truncated = -5 / 3;  // 结果为 -1
    let remainder = 43 % 5;  // remainder

    let x = true;
    let y: bool = false; // with explicit type annotation

    let num: f64 = len(sum) as f64;  // as: 类型转换
 }
```

### 2.2 复合类型
- 元组(tuple)：元组长度固定，元组中的每个元素的类型不必相同，用 `tup` 声明元组类型；
- 数组(array)：数组长度固定，数组中的每个元素的类型必须相同，
- vector 类型是标准库提供的允许增长和缩小长度的类似数组的集合类型，一般不确定长度的用 vector；

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
    
    // 2.2.3 vector类型
    
}
```

### 2.3 字符串类型
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