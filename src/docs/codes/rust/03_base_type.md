# 基本类型

Rust 是静态类型（statically typed）语言，即在编译时就必须知道所有变量的类型，如果不确定使用什么类型可以使用泛型类型来抽象代替。

基本类型是一个最小化原子类型，无法解构为其它类型

## 数值类型
1. 整型（default `i32`）：
   - 有符号整型：`i8`、`i16`、`i32`、`i64`、`i128`（数字为 bit）、`isize`；
   - 无符号整型：`u8`、`u16`、`u32`、`u64`、`u128`（数字为 bit）、`usize`;
2. 浮点型（default `f64`）：
   - 单精度浮点：`f32`
   - 双精度浮点：`f64`（所有浮点型都是有符号的）；
   - NaN（not a number）：数学上为定义的数值，如对负数开平方的结果。可以使用 `is_nan()` 判定

::: warning 补充
1. isize 和 usize 是两种与平台指针大小一致的整数类型。即，它们的位数会随着系统架构变化（32 位或 64 位）
- isize：常用于指针偏移值。
- usize：常用于数组/切片索引、内存大小、长度等。如数组指针用i32会报错

2. 在 debug 模式编译时，整型溢出会报错； 在 release 模式下，整型溢出按补码循环溢出；
3. 浮点型是近似表达，不可以作为 HashMap 的 key，也不能用作严格等于；
:::

```rust
fn scalar_type(){
    let sum = 5 + 10;  // addition
    let difference = 95.5 - 4.3;  // subtraction
    let product = 4 * 30;  // multiplication
    let quotient = 56.7 / 32.2;  // division

    let truncated = -5 / 3;  // 结果为 -1
    let remainder = 43 % 5;  // remainder
    
    let one_million: i64 = 1_000_000;  // 添加 _ 增加可读性
    
    let addition = sum + product;  // 同类型才能做运算

 }
```

3. 位运算

| 运算符    | 说明                        |
|:---------|:----------------------------|
| & 位与	| 相同位置均为1时则为1，否则为0 |
| \| 位或   | 相同位置只要有1时则为1，否则为0 | 
| ^ 异或	 | 相同位置不相同则为1，相同则为0 | 
| ! 位非	 | 把位中的0和1相互取反，即0置为1，1置为0 |
| << 左移   | 所有位向左移动指定位数，右位补0 |
| >> 右移   | 所有位向右移动指定位数，带符号移动（正数补0，负数补1） |

位运算如果超出整型的位数范围，不论 debug 模式还是 release 模式，都会报错 overflow 错误

```rust
fn main() {
    let a: u8 = 2;  // 0b_0000_0010
    let b: u8 = 3;  // 0b_0000_0011

    println!("{:08b}", a & b);  // 00000010
    println!("{:08b}", a | b);  // 00000011
    println!("{:08b}", a ^ b);  // 00000001
    println!("{:08b}", !a);  // 11111101
    println!("{:08b}", a << b);  // 00010000
    println!("{:08b}", a >> b);  // 00000000
}
```

4. 序列(Range)
`.rev()` 表示反转

```rust
fn main() {
   for i in 1..=5 {  // 1..5 ==> 1,2,3,4
       println!("{}",i);  // 1,2,3,4,5
   }
   
   for i in 'a'..='z' {
       println!("{}",i);  // a,b,c...x,y,z
   }
}
```

5. `As` 类型转换
As 用来进行类型转换，常用于将原始类型转换为其他原始类型。也可以将指针转换为地址、地址转换为指针以及将指针转换为其他指针等

```rust
let a = 3.1 as i8;  // 3
```

5. 有理数和复数
有理数和复数未包含在标准库中。下面为复数定义的两种方式：

```rust
use num::complex::Complex;

 fn main() {
   let a = Complex { re: 2.1, im: -1.2 };
   let b = Complex::new(11.1, 22.2);
   let result = a + b;

   println!("{} + {}i", result.re, result.im)  // 13.2 + 21i
 }
```

## 字符、布尔、单元类型

1. 字符类型：
   - 用单引号声明 `char` 字面量，`char` 类型的大小为 4-bit（Unicode）；
   - 双引号声明字符串字面量；

```rust
fn main() {
    let c = 'z';
    let z = 'ℤ';
    let g = '国';
    let heart_eyed_cat = '😻';
}
```

2. 布尔型：
   - `true`，`false`，`bool` 类型的大小为 1-bit

```rust
fn main() {
    let t = true;
    let f: bool = false;

    if f {
        println!("hello world.");
    }
}
```

3. 单元类型：
   - `()`，单元类型内存占用为 0-bit

::: warning 单元类型
所有未返回的函数，实际都返回了单元类型。如 `fn main()`，Rust 中没有返回值的函数只有 发散函数( diverging functions )（-> !）
:::

## 语句和表达式

- 语句（statement）：执行一些操作但是不返回值。如 `let a = 8;` 是语句，但其中的 `8` 是表达式
- 表达式（expression）：会在求值后返回一个值。如 `x + y`

::: tip 注意
语句要以分号结尾，但表达式不能以分号结尾。
:::

```rust
fn main(){
   let y = if x % 2 == 1 { "odd" } else { "even" };  
   // 这里是一个三元表达式 ==> y = "old" if x % 2 == 1 else "even"
}
```

## 函数
函数用 `fn` 关键字来声明新函数。返回值时要在箭头（`->`）后声明它的类型。

- 函数名和变量名都使用蛇形命名法(snake case)。如 `fn add_two() {}`；
- 函数的位置可以任意，只要有定义即可；
- 每个函数参数都需要标注类型；
- 函数没有返回值，就会返回一个单元类型 `()`；

```rust
fn main() {
    let x = plus_or_minus(5);

    println!("The value of x is: {}", x);
}

fn plus_or_minus(x:i32) -> i32 {
    if x > 5 {
        return x - 5  // 提前返回都需要 return 
    }

    x + 5
}
```