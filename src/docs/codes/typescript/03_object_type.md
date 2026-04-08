# 对象类型

TypeScript 中的 object 类型表示所有不是原始类型的值。即 `number`、`bigint`、`string`、`boolean`、`null`、`undefined`、`symbol`。

```typescript
let employee: object;

employee = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  jobTitle: 'Web Developer',
};

console.log(employee);

// 也可以直接定义
let employee2: {
  firstName: string;
  lastName: string;
  age: number;
  jobTitle: string;
} = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  jobTitle: 'Web Developer',
};
```

TypeScript 还有另外一种 Object 类型。object 类型代表所有的非原始类型的值，而 Object 类型描述的是所有对象具有的功能。
例如，Object 类型具有可以被任何对象访问的 toString() 和 valueOf() 方法。

TypeScript 还存在空类型，使用 `{}` 表示，空类型描述一个本身没有任何属性的对象。如下：

```typescript
let vacant: {} = {};

console.log(vacant.toString());  // >>> [object Object]
```

## 数组类型

TypeScript 中的 `array` 是一个有序的数据列表.

```typescript
let skills: string[] = ["test1", "test2"];

skills[0] = 'Problem Solving';
skills.push('Software Design');

// 混合类型（两种方式都可以）
let scores1 = ['Programming', 5, 'Software Design', 4];

let scores2: (string | number)[];
scores2 = ['Programming', 5, 'Software Design', 4];
```

TypeScript 中的数组可以使用 JavaScript 中数组的所有方法，如 `forEach()`, `map()`, `reduce()` 和 `filter()`等。
```typescript
let series1 = [1, 2, 3];
console.log(series1.length); // >>> 3

let series2 = [1, 2, 3];
let doubleIt = series2.map((e) => e * 2);
console.log(doubleIt);  // >>> [ 2, 4, 6 ]
```

## 元组类型

```typescript
let skill: [string, number];
skill = ['Programming', 5];
console.log(skill);  // >> [ 'Programming', 5 ]
```

元组可以通过使用问号 `?` 后缀来指定可选元素：
```typescript
let bgColor, headerColor: [number, number, number, number?];
bgColor = [0, 255, 255, 0.5];
headerColor = [0, 255, 255];
```

## 枚举类型

枚举类型的语法定义为：`enum name {constant1, constant2, ...};`。

```typescript
// 默认枚举的成员变量值为 0, 1, 2, ...
enum Example1 {
  eg1,
  eg2,
}
console.log(Example1.eg1);  // 0

// 指定成员变量值
enum Example2 {
  eg1 = 1,
  eg2,
}
console.log(Example2.eg2);  // 2
```

## `any` 类型

在声明变量时没有指定类型，TypeScript 会推断类型为 `any`。

```typescript
let result;  // <==> let result: any;
```

## `void` 类型

`void` 类型表示不返回任何值的函数的返回类型。

```typescript
function log(message: string): void {
  console.log(message);
}

log("Hello, TypeScript!");
```

## `never` 类型

never 类型是不包含值的类型，通常表示总是抛出错误的函数的返回类型。

```typescript
function raiseError(message: string): never {
  throw new Error(message);
}

function reject() {
  return raiseError('Rejected');
}

reject()  // 直接报错
```

## 联合类型

```typescript
let result: number | string;

function add(a: number | string, b: number | string) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.concat(b);
  }
  throw new Error('Parameters must be numbers or strings');
}
console.log(add("5", "10"));  // 510
```

## 类型别名

使用 `type alias = existingType;` 为类型常见别名。通常为联合类型常见别名。

```typescript
type alphanumeric = string | number;

let input: alphanumeric;
input = 100; // valid
input = 'Hi'; // valid
input = false; // Compiler error
```

## 字符串字面量类型

字符串字面量类型允许你定义一种类型，它只接受一个指定的字符串字面量。

```typescript
let mouseEvent: 'click' | 'longpress';

mouseEvent = 'click';  // click
mouseEvent = 'longpress';  // longpress
mouseEvent = 'mouseover';  // compiler error
```