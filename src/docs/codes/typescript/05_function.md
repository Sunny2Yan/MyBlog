# 函数

TypeScript 中的函数语法为：
```typescript
function name(parameter: type, parameter: type, ...): returnType {
  // do something
}

// 示例
function add(a: number, b: number): number {
  return a + b;
}
```

## 函数类型

函数类型由参数类型和返回类型两个部分组成。示例如下：

```typescript

let add1: (x: number, y: number) => number;
add1 = function (x: number, y: number) {
  return x + y;
};

// 两者等价
let add2: (a: number, b: number) => number = function (x: number, y: number) {
  return x + y;
};
```

## 函数的可选参数

```typescript
function multiply(a: number, b: number, c?: number): number {
  if (typeof c !== 'undefined') {
    return a * b * c;
  }
  return a * b;
}
```

## 函数的默认参数

需要注意不能在函数类型中使用默认参数

```typescript
function applyDiscount(price, discount = 0.05) {
  return price * (1 - discount);
}
console.log(applyDiscount(100)); // 95

let promotion: (price: number, discount: number = 0.05) => number;  // 报错
```

## Reset 参数

Rest 参数允许函数接受零个或者多个指定类型的参数，它遵守下面的规则：
- 一个函数只有一个 Rest 参数；
- Rest 参数出现在参数列表的最后面；
- Rest 参数的类型是 数组类型。

```typescript
function fn(...rest: type[]) {
  //...
}

// 示例
function getTotal(...numbers: number[]): number {
  let total = 0;
  numbers.forEach((num) => (total += num));
  return total;
}
console.log(getTotal()); // 0
console.log(getTotal(10, 20)); // 30
console.log(getTotal(10, 20, 30)); // 60
```

## 函数重载

```typescript
// 1. 原始实现方法：联合类型不能精确地表示参数类型和返回值类型之间的关系
function add(a: number | string, b: number | string): number | string {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a + b;
  }
}

// 2。 函数重载方法
function add(a: number, b: number): number;  // 第一个函数重载告诉编译器参数都是数字时，返回数字
function add(a: string, b: string): string;  // 第一个函数重载告诉编译器参数都是字符串时，返回字符串
function add(a: any, b: any): any {
  return a + b;
}

```