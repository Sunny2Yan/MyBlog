# 高级类型

## 交叉类型

交叉类型指的是通过组合多个现有类型创建而来的新的类型，新的类型具有现有类型的所有属性。

- 组合类型：使用 `&` 操作符表示，如：`type typeAB = typeA & typeB;`。表示同时具备 `typeA` 和 `typeB`的所有属性；
- 联合类型：使用 `|` 操作符表示，如：`type varName = typeA | typeB;`。定义一个可以保存 `typeA` 或 `typeB` 类型的值。

```typescript
// 定义两个接口
interface Identity {
  id: number;
  name: string;
}

interface Contact {
  email: string;
  phone: string;
}

// 定义交叉类型
type Employee = Identity & Contact;

let e: Employee = {  // Employee类型中包含了 Identity 和 Contact 中的所有属性
  id: 100,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '(408)-897-5684',
};

// 定义联合类型
type PersonInfo = Identity | Contact;

let p1: PersonInfo = {
  // 这里必须满足 Identity 的所有属性
  id: 101,
  name: 'Jane Smith'
};

let p2: PersonInfo = {
  // 这里必须满足 Contact 的所有属性
  email: 'jane.smith@example.com',
  phone: '123-456-7890'
};
```

::: warning 注意：
1. 交叉类型中存在相同类型的属性，但它们的类型不同，编译器会报错；
2. 类型交叉中的类型的顺序并不重要。
3. 联合类型必须满足某一个类型的全部属性
:::

## 类型保护

1. `typeof`： 获取变量类型；
2. `instanceof`：判断对象是否是某个类或构造函数的实例；
3. `in`：判断对象上是否存在某个属性；
4. 用户自定义保护类型：使用 `arg is aType` 判断某个参数是否是某个类型

```typescript
// 1. typeof 获取变量类型
type alphanumeric = string | number;

function add(a: alphanumeric, b: alphanumeric) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + b;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.concat(b);
  }

  throw new Error(
    'Invalid arguments. Both arguments must be either numbers or strings.',
  );
}

// 2. instanceof 判断 partner 是否为 Customer 或 Supplier 的实例
class Customer {
  isCreditAllowed(): boolean {
    // ...
    return true;
  }
}

class Supplier {
  isInShortList(): boolean {
    // ...
    return true;
  }
}

type BusinessPartner = Customer | Supplier;

function signContract(partner: BusinessPartner): string {
  let message: string;
  if (partner instanceof Customer) {
    message = partner.isCreditAllowed()
      ? 'Sign a new contract with the customer'
      : 'Credit issue';
  }

  if (partner instanceof Supplier) {
    message = partner.isInShortList()
      ? 'Sign a new contract the supplier'
      : 'Need to evaluate further';
  }

  return message;
}

// 3. in 判断 isCreditAllowed 是否为 partner 中的属性
function signContract(partner: BusinessPartner): string {
  let message: string;
  if ('isCreditAllowed' in partner) {
    message = partner.isCreditAllowed()
      ? 'Sign a new contract with the customer'
      : 'Credit issue';
  } else {
    // must be Supplier
    message = partner.isInShortList()
      ? 'Sign a new contract the supplier '
      : 'Need to evaluate further';
  }
  return message;
}

// 4. 直接类型判断
function isCustomer(partner: any): partner is Customer {
  return partner instanceof Customer;
}
```

## 类型转换

1. `as` 类型转换：`let a: typeA; let b = a as typeB;`；
2. `<>` 类型转换：`let a: typeA; let b = <typeB>a;`；


```typescript
// 传统意义上的类型转换
let a: string = "6";  // string
let b = Number(a);
console.log(typeof b);  // number

// as 类型转换
let input = document.querySelector('input["type="text"]');
console.log(input.value);  // document.querySelector() 方法返回 Element 类型，不存在 value，报错
let enteredText = (input as HTMLInputElement).value;
console.log(enteredText);  // HTMLInputElement 类型中存在 value
// 注意：HTMLInputElement 类型扩展自 HTMLElement 类型，HTMLElement 类型扩展自 Element 类型。把 HTMLElement 类型转换成 HTMLInputElement 类型被称为向下转换

// <> 类型转换
let input2 = <HTMLInputElement>document.querySelector('input[type="text"]');
console.log(input2.value);
```

## 类型断言

类型断言是让 TypeScript 编译器把某个值的类型视为特定的类型，使用 `as` 或 `<>` 关键字来实现。

```typescript
// 定义一个函数，返回数字类型 或 字符串类型
function getNetPrice(
  price: number,
  discount: number,
  format: boolean,
): number | string {
  let netPrice = price * (1 - discount);
  return format ? `$${netPrice}` : netPrice;
}

let netPrice1 = getNetPrice(100, 0.05, true) as string;
console.log(netPrice1);  // >>> $95

let netPrice2 = <number>getNetPrice(100, 0.05, false);
console.log(netPrice2);  // >>> 95
```

::: warning 注意： 
React 等库中不能使用尖括号语法 <>，因此在进行类型断言的时候推荐使用 `as` 关键字。
:::
