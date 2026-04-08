# 原始类型

TypeScript 中的变量类型需要注释，如下:

```typescript
let variableFirstName: type;
let variableSecondName: type = value;
const constantName: type = value;

// example
let name: string = 'John';
let age: number = 25;
let active: boolean = true;
```

如果没有为变量添加类型注释，编译器会自动推断变量的类型：

```typescript
let counter = 0;  // <==> let counter: number = 0;
let items = [1, 2, 3, null];  // <==> let items: (number | string)[] = [1, 2, 3, null];
```

在使用时，应该尽可能的使用**类型推断**。

## 数字类型

数字类型要么是浮点数，那么是大整数，浮点数的类型是 `number` 而大数字的类型是 `bigint`。

```typescript
// 浮点数类型 number
let price = 9.95;  // 十进制数
let bin = 0b100;  // 二进制数，前面添加 0b
let octal: number = 0o10;  // 八进制数，前面添加 0o
let hexadecimal: number = 0xa;  // 十六进制数。前面添加 0x

// 大数字类型 bigint (> 2^53 – 1)
let big: bigint = 9007199254740991n;  // 末尾添加 n
```

## 字符串类型

TypeScript 可以使用双引号 `"` 或单引号 `'` 包裹字符串，也可以使用反引号 `` ` `` 包裹字符的模板。

```typescript
let firstName: string = 'John';
let title: string = "Web Developer";
let description = `This TypeScript string can
span multiple
lines
`;

let profile: string = `I'm ${firstName}.
I'm a ${title}`;
```

## 布尔类型

```typescript
let pendingTrue: boolean = true;
let pendingFalse: boolean = false;
```

## `null` 类型

`null` 表示空值。

```typescript
let x = [1, 2, null];
console.log(x);
```

## `undefined` 类型

`undefined` 表示声明但未赋值的变量类型

```typescript
const json = `{"latitude": 10.11, "longitude":12.12}`;
const currentLocation = JSON.parse(json);

console.log(currentLocation.x);  // >>> undefined

let x : [string?];  // 等价于 string | undefined
```

## `symbol` 类型