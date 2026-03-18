# 所有权和借用

计算机的内存回收有以下三种方式：
- **垃圾回收机制(GC)**：在程序运行时不断寻找不再使用的内存，如：Java、Go
- **手动管理内存的分配和释放**：在程序中，通过函数调用的方式来申请和释放内存，如：C++
- **通过所有权来管理内存**：编译器在编译时会根据一系列规则进行检查，如 Rust

::: tip 补充知识
**栈**：
栈按照后进先出读取数据，栈中的数据都必须占用已知且固定大小的内存空间；

**堆**：
存储未知大小或者可能变化的数据。向堆上放入数据时，操作系统在堆的某处找到一块足够大的空位，把它标记为已使用，并返回一个表示该位置地址的指针，该过程被称为在堆上分配(allocating)内存。
接着，该指针会被推入栈中（指针的大小是已知且固定），后续使用过程中，将通过栈中的指针，来获取数据在堆上的实际内存位置，进而访问该数据。

因此，在栈上分配内存比在堆上分配内存要快。
:::

代码在调用一个函数时，传递给函数的参数（包括指针和函数的局部变量）被依次被压入栈中，当函数调用结束时，这些值将被从栈中按照相反的顺序依次移除。
堆上的数据若不及时释放，将会产生内存泄漏，即数据将永远无法被回收。Rust 中使用所有权系统来管理内存，防止内存泄漏。在运行时，所有权系统的任何功能都不会减慢程序。 其所有权规则如下：

1. Rust 中的每一个值都有一个所有者（owner）；
2. 值在任一时刻有且只有一个所有者；
3. 当所有者（变量）离开作用域，这个值将被丢弃。

## 所有权（ownership）

### 1.1 变量的作用域

```rust
{                      // s 在这里无效，它尚未声明
    let s = "hello";   // 从此处起，s 是有效的
    // 使用 s
}                      // 此作用域已结束，s 不再有效
```

当变量离开作用域，Rust 调用一个特殊的函数 `drop`，即，Rust 在结尾的 `}` 处自动调用 `drop`。

### 1.2 String 类型

1. 字符串字面值被硬编码到程序代码中，是不可变的。如 `let s = "hello"` 类型为 `&str`；
2. 动态字符串类型 `String` 被分配到堆上，可以动态伸缩。使用 `from` 函数基于字符串字面值来创建 `String`，如下：

```rust
let mut s = String::from("hello");
s.push_str(", world!"); // push_str() 在字符串后追加字面值

println!("{}", s); // 将打印 `hello, world!`
```

### 1.3 变量与数据交互方式：移动

```rust
// example 1:
let x = 5;
let y = x;

// example 2: 
let s1 = String::from("hello");
let s2 = s1;
```

对于示例一：
先将 5（i32） 绑定到 x 上；接将 x 的值自动copy给 y。由于整个过程发生在栈上，不涉及内存释放，因此未发生所有权的转移，最终 x=5, y=5；

对于示例二：

`String` 是一个复杂类型，由三部分组成：
    - 堆指针：指向真实存储字符串内容的堆内存
    - 字符串容量：堆内存分配空间的大小
    - 字符串长度：当前已经使用的空间大小

首先在堆上分配一块空间存储字符串，并将三个值赋给 `s1`

<img src="/imgs/codes/rust/3-1.png" style="zoom:20%;" />

当 `s1` 赋值给 `s2` 时，`String` 的三个值被复制了，即从栈上拷贝了它的指针、长度和容量。但并没有复制指针指向的堆上数据。如下图：

<img src="/imgs/codes/rust/3-2.png" style="zoom:50%;" />

于是两个数据指针指向了同一位置，这就引入一个问题：当 `s2` 和 `s1` 离开作用域，都会尝试释放相同的内存。即 **二次释放（double free）**错误。
为了确保内存安全，在 `let s2 = s1;` 之后，Rust 认为 `s1` 不再有效，因此 Rust 不需要在 `s1` 离开作用域后清理任何东西。

<img src="/imgs/codes/rust/3-3.png" style="zoom:50%;" />

```rust
let s1 = String::from("hello");
let s2 = s1;

println!("{}, world!", s1);  // 报错，s1不存在了
```

::: warning 
- 对于上述拷贝指针、长度和容量而不拷贝数据是其他语言中的**浅拷贝（shallow copy）**，而在 Rust 中是**移动（move）**，是将 `s1` 移动到 `s2` 中。

- **Rust 不会自动创建数据的 “深拷贝”**。因此，任何自动的复制可以被认为对运行时性能影响较小。
:::

### 1.4 变量与数据交互的方式：克隆

对于确实需要**深度复制** `String` 中堆上的数据，而不仅仅是栈上的数据时，可以使用 `clone` 函数。

```rust
let s1 = String::from("hello");
let s2 = s1.clone();  // 将堆上的数据复制了
println!("s1 = {}, s2 = {}", s1, s2);
```

Rust 有一个叫做 `Copy` trait 的特殊注解，如果一个类型实现了 `Copy` trait，那么旧的变量在将其赋值给其他变量后仍然可用。

::: warning 
任何基本类型的组合可以 Copy ，不需要分配内存或某种形式资源的类型是可以 Copy 的。如下是一些 Copy 的类型：

- 整数类型，如 u32；
- 布尔类型；
- 浮点数类型，如 f64；
- 字符类型，char
- 元组，当且仅当其包含的类型也都是 Copy 的时候。如，(i32, i32) 是 Copy 的，但 (i32, String) 不是；
- 不可变引用 &T，但可变引用 &mut T 是不可以 Copy的。
:::

### 1.5 所有权与函数

将值传递给函数与给变量赋值的原理类似。向函数传递值可能会移动或者复制，就像赋值语句一样。

```rust
fn main() {
    let s = String::from("hello");  // s 进入作用域
    takes_ownership(s);         // s 的值移动到函数里，之后不再有效

    let x = 5;                // x 进入作用域
    makes_copy(x);            // x 应该移动函数里，但 i32 是 Copy 的，后面可继续使用 x
} // 这里，x 先移出了作用域，然后是 s。但因为 s 的值已被移走，

fn takes_ownership(some_string: String) {  // some_string 进入作用域
    println!("{}", some_string);
}  // 这里，some_string 移出作用域并调用 `drop` 方法，占用的内存被释放

fn makes_copy(some_integer: i32) {  // some_integer 进入作用域
    println!("{}", some_integer);
}  // 这里，some_integer 移出作用域。
```

对于返回值也可以转移所有权：

```rust
fn main() {
    let s1 = gives_ownership();       // gives_ownership 将返回值转移给 s1
    let s2 = String::from("hello");    // s2 进入作用域
    let s3 = takes_and_gives_back(s2);  // s2 被移动到 takes_and_gives_back 中，并将返回值移给 s3
}  // 这里，s3 移出作用域并被丢弃。s2 也移出作用域，但已被移走。s1 离开作用域并被丢弃

fn gives_ownership() -> String {       // gives_ownership 会将返回值移动给调用它的函数
    let some_string = String::from("yours");  // some_string 进入作用域。
    some_string                     // 返回 some_string 并移出给调用的函数
}

fn takes_and_gives_back(a_string: String) -> String {  // a_string 进入作用域
    a_string  // 返回 a_string 并移出给调用的函数
}
```

变量的所有权总是遵循相同的模式：**将值赋给另一个变量时移动它。当持有堆中数据值的变量离开作用域时，其值将通过 `drop` 被清理掉，除非数据被移动为另一个变量所有**。

每一个函数中都获取所有权并接着返回所有权有些啰嗦。Rust 对此提供了一个不用获取所有权就可以使用值的功能，叫做 **引用**（*references*）。

## 2. 引用与借用

Rust 中将创建一个引用的行为称为 **借用**（*borrowing*），当使用完毕，必须还回去。

### 2.1 引用与解引用
**引用**（*reference*）一个指针类型，指向了对象存储的内存地址。引用后的变量必须使用解引用运算符解出引用所指向的值。具体使用如下：

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);  // 必须解引用获取值
}
```

这里的 `&` 符号就是 **引用**，它允许使用值但不获取其所有权。与使用 `&` 引用相反的操作是 **解引用**（*dereferencing*），其运算符为 `*`。

### 2.2 不变引用

```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);  // 创建一个指向值 s1 的引用，但是并不拥有它
    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {  // s 是 String 的引用
    s.len()
}  // 这里，s 离开了作用域。但因为它并不拥有引用值的所有权，所以什么也不会发生
```

`&s1` 语法是创建一个 **指向** `s1` 的引用，但是并不拥有它。因为并不拥有这个值，所以当引用停止使用时，它所指向的值也不会被丢弃。
同理，函数形参使用 `&` 来表明参数 `s` 的类型是一个引用。

<img src="/imgs/codes/rust/3-4.png" style="zoom:50%;" />


当变量 `s` 停止使用时并不丢弃引用指向的数据，因为 `s` 并没有所有权。由于原始变量 `s1` 不可变，创建的引用 `s` 值也是不可变的。

### 2.3 可变引用（*mutable reference*）

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);  // &mut 表示创建可变引用
}

fn change(some_string: &mut String) {  // &mut 表示 some_string 是 String 的可变引用
    some_string.push_str(", world");
}
```

**可变引用同时只能存在一个**

如果有一个对该变量的可变引用，就不能再创建对该变量的引用。如下创建两个 `s` 的可变引用的代码会失败：

```rust
// 错误写法：
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s;
println!("{}, {}", r1, r2);  // 不能在同一时间多次将 s 作为可变变量借用，报错。

// 改写为如下：
let mut s = String::from("hello");

{
    let r1 = &mut s;
}  // r1 在这里离开了作用域，所以可以创建一个新的引用
let r2 = &mut s;
```

**可变引用与不可变引用不能同时存在**

```rust
// 错误写法：
let mut s = String::from("hello");

let r1 = &s;    // 没问题
let r2 = &s;    // 没问题
let r3 = &mut s;  // 大问题

println!("{}, {}, and {}", r1, r2, r3);  // 不能在拥有不可变引用的同时拥有可变引用。报错

// 改写为如下：
let mut s = String::from("hello");

let r1 = &s;  // 没问题
let r2 = &s;  // 没问题
println!("{} and {}", r1, r2);  // 此位置之后 r1 和 r2 不再使用

let r3 = &mut s;  // 没问题
println!("{}", r3);
```

**悬垂引用(Dangling References)**

悬垂引用也叫做 **悬垂指针**（*dangling pointer*），意思为指针指向某个值后，这个值被释放掉了，而指针仍然存在，其指向的内存可能不存在任何值或已被其它变量重新使用。
在 Rust 中编译器确保引用永远也不会变成悬垂状态：当拥有一些数据的引用，编译器确保数据不会在其引用之前离开作用域。

```rust
// 创建一个悬停指针(错误案例)
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String {  // dangle 返回一个字符串的引用
   let s = String::from("hello");  // s 是一个新字符串
   &s  // 返回字符串 s 的引用
}  // 这里 s 离开作用域并被丢弃。其内存被释放。只剩下一个悬停指针

// 改写如下：
fn no_dangle() -> String {
    let s = String::from("hello");
    s  // 直接返回值，不返回引用
}
```

 `s` 是在 `dangle` 函数内创建的，当 `dangle` 的代码执行完毕后，`s` 将被释放。当返回它的引用时，这个引用会指向一个无效的 `String`。

::: warning **引用规则**:
- 在任意给定时间，**要么只能有一个可变引用，要么只能有多个不可变引用**；
- 引用必须总是有效的。
:::
