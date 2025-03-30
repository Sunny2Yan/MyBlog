# 常见集合

Rust 标准库中包含一系列被称为 **集合（collections）**的数据结构，这些集合指向的数据是储存在堆上的，意味着数据的数量不必在编译时就已知，并且还可以随着程序的运行增长或缩小

-   **vector**：允许储存一系列数量可变的值；
-   **字符串（string）**：字符的集合；
-   **哈希 map（hash map）**：允许将值与一个特定的键（key）相关联。

## 1. Vector

```rust
// 1. vector的创建
let v: Vec<i32> = Vec::new();  // 使用泛型实现
let v = vec![1, 2, 3];  // 使用宏实现，默认整形

// 2. vector的增加、删除
let mut v = Vec::new();
v.push(5);  // 更新向量表
v.pop()    // 删除最后一个元素

// 3. vector的读取
let v = vec![1, 2, 3, 4, 5];
let third: &i32 = &v[2];          // 索引（元素的引用）读取
let third: Option<&i32> = v.get(2);  // get方法读取，不会产生溢出报错

// 4. vector的遍历
let v = vec![100, 32, 57];  // 不可变vector
for i in &v {
    println!("{i}");  // zhi'nen
}

let mut v = vec![100, 32, 57];  // 可变vector
for i in &mut v {
    *i += 50;  // 为了修改可变引用所指向的值，必须使用解引用运算符（*）获取值
}
```

vector 只能储存相同类型的值，由于枚举的成员都被定义为相同的枚举类型，所以当需要在 vector 中储存不同类型值时，可以定义并使用一个枚举。

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

## 2. String

`String` 是一个 `Vec<u8>` 的封装

```rust
// 1. string的创建
let mut s = String::new();
let data = "initial contents";  // 定义字面值
let s = data.to_string();

let s = "initial contents".to_string();  // 该方法也可直接用于字符串字面值

let s = String::from("initial contents");  // 简单创建，与上面作用相同

// 2. string的增加
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
s.push('l');  // push()只能添加单独的字符

let s3 = s1 + &s2;  // 注意 s1 被移动了，不能继续使用

// 当想要级联多个字符串，+ 就显得笨重
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{s1}-{s2}-{s3}");

// 3. string 索引（Rust 不允许使用索引获取）
let s1 = String::from("hello");
let h = s1[0];  // 报错，rust没有字符串索引；UTF-8占一个字节，Unicode 占两个字节

// 4. string遍历
for c in "Зд".chars() {
    println!("{c}");
}
```

## 3. Hash Map

```rust
// 1. hash map的创建
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);  // {'Blue': 10}
scores.insert(String::from("Yellow"), 50);

// 2. hash map的读取
let team_name = String::from("Blue");
let score = scores.get(&team_name).copied().unwrap_or(0);
// .copied()表示去引用，.unwrap_or(0)表示没有取0

// 3. hash map的遍历
for (key, value) in &scores {
     println!("{key}: {value}");
}

// 4. hash map的更新
scores.insert(String::from("Blue"), 25);  // 直接覆盖
scores.entry(String::from("Blue")).or_insert(25); 
// entry() 表示值可能存在也可能不存在；
// or_insert() 在键对应的值存在时就返回这个值的可变引用，如不存在则将参数作为新值插入并返回新值的可变引用

use std::collections::HashMap;

let text = "hello world wonderful world";
let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}
println!("{:?}", map);
```

hash map的所有权

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);
// 这里 field_name 和 field_value 不再有效，使用它们出现编译错误！
```

