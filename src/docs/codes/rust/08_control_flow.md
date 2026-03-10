# 控制流

## 1. `if` 条件控制

```rust
let x = 5;

// 1.let语句可以使用if表达式，但数据类型必须相同
let number = if x == 5 { 10 } else { 15 };

// 2.普通条件语句
if number % 3 == 0 {
    println!("number is divisible by 3");
} else if number % 2 == 0 {
    println!("number is divisible by 2");
} else {
    println!("number is not divisible by 3, or 2");
}

// 3.if let 语句
let x = Some(5);
if let Some(y) = x {
    println!("{}", y);      // 这里输出为：5
}
// <==>
let x = Some(5);
match x {
    Some(y) => println!("{}", y),
    None => ()
}
```

## 2. `match` 控制
Rust 的 match 控制流类似于python中的 case，都需要覆盖所有可能性，但 match 的返回值可以是任意类型。

```rust
let x = 5;
match x {
    1 => {
        println!("one")
    },
    3 => println!("three"),
    5 => println!("five"),
    _ => println!("something else"), // 其他值
}
```

## 3. `for` 循环
for循环可以使用 `.enumerate()` 函数，同python中的功能。

```rust
let a = [10, 20, 30, 40, 50];
for element in a {  // a 是一个 iter
    println!("the value is: {element}");
}
```
**注：序列 `1..5`表示 `range(1, 5)`，`1..=5`表示 `range(1, 5)`。`.rev()` 表示反转**

## 4. `while` 循环
```rust
let mut number = 3;
while number != 0 {
    println!("{number}!");
    number -= 1;
}
```

## 5. `loop` 无限循环
`loop` 循环是死循环，等价于python中的 `while True`，但Rust中使用 while True会发生编译错误。

```rust
loop {
    println!("again!");  // 一直输出again!
}

let mut counter = 0;
let result = loop {
    counter += 1;
    if counter == 10 {
        break counter * 2;  // break后再将counter值乘2
    }
};
```

## 6. `label`
break 或 continue 默认会作用于当前层的循环，当想要 break 或 continue 作用于一个外层循环，可以使用label来指定 break 或 continue 语句的作用域。

```rust
'outer: for x in 0..10 {
    'inner: for y in 0..10 {
        if x % 2 == 0 { continue 'outer; } // continues the loop over x
        if y % 2 == 0 { continue 'inner; } // continues the loop over y
        println!("x: {}, y: {}", x, y);
    }
}
```