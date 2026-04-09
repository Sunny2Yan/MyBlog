# 泛型

TypeScript 中的泛型可以编写可重用的泛型函数，泛型类和泛型接口，其侧重于通用性。

## 泛型函数

按照惯例，常使用 `T` 作为类型变量，当然也可以使用其他字母，比如 `A`，`B` 和 `C` 等等。

```typescript
// 从一个数字数组中随机获取一个元素
function getRandomNumberElement(items: number[]): number {
  let randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

// 从一个字符串数组中随机获取一个元素
function getRandomStringElement(items: string[]): string {
  let randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

// 使用 any 类型构造上面两函数的通用函数
function getRandomAnyElement(items: any[]): any {
  let randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

let numbers = [1, 5, 7, 4, 2, 9];
let colors = ['red', 'green', 'blue'];

console.log(getRandomNumberElement(numbers));  // >>> 9
console.log(getRandomStringElement(colors));  // >>> green
console.log(getRandomAnyElement(numbers));  // >>> 7
console.log(getRandomAnyElement(colors));  // >>> green
```

使用 `any` 类型无法强制指定返回元素的类型，即，不是类型安全的。若想要在保留类型的同时避免重复的代码，可以使用泛型：

```typescript
function getRandomElement<T>(items: T[]): T {
  let randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

let numbers = [1, 5, 7, 4, 2, 9];
// let randomEle = getRandomElement<number>(numbers);  // 可以指定输出类型
let randomEle = getRandomElement(numbers);  // 可以直接通过泛型推断
console.log(randomEle);
```

具有多个类型变量的泛型函数：

```typescript
function merge<U, V>(obj1: U, obj2: V) {
  return {
    ...obj1,
    ...obj2,
  };
}

let result = merge({ name: 'John' }, { jobTitle: 'Frontend Developer' });
console.log(result);  // >>> {name: "John", jobTitle: "Frontend Developer",}
```

## 泛型约束

- 使用 `extends` 关键字将类型参数约束为指定类型；
- 使用 `extends keyof` 约束类型为另外一个对象的属性集合。

```typescript
// 对于上面的函数可以受两个对象，但无法阻止传递一个非对象的参数
function merge<U, V>(obj1: U, obj2: V) {
  return {
    ...obj1,
    ...obj2,
  };
}

let result = merge({ name: 'John' }, 5);
console.log(result);  // >>> { name: "John", }，TypeScript 不会发出任何错误提示

// 为了表示约束，可以使用 extends 关键字。
function merge<U extends object, V extends object>(obj1: U, obj2: V) {
  return {
    ...obj1,
    ...obj2,
  };
}

let person = merge({ name: 'John' }, 25);  // 具有错误提示
```

泛型中使用形参：

```typescript
// 报错：Type 'K' cannot be used to index type 'T'.
function prop<T, K>(obj: T, key: K) {
  return obj[key];
}

// 可以在 K 上添加一个约束来确保它是 T 类型的键
function prop<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

let str = prop({ name: 'John' }, 'name');
console.log(str);  // >>> John
```

## 泛型类

泛型类构建为：`class className<T> { ... }`、`class className<K, T> { ... }`。

泛型约束可以应用于类中的泛型类型。如 `class className<T extends TypeA> { ... }`

```typescript
// 栈泛型类
class Stack<T> {
  private elements: T[] = [];

  constructor(private size: number) {}
  isEmpty(): boolean {
    return this.elements.length === 0;
  }
  isFull(): boolean {
    return this.elements.length === this.size;
  }
  push(element: T): void {
    if (this.elements.length === this.size) {
      throw new Error('The stack is overflow!');
    }
    this.elements.push(element);
  }
  pop(): T {
    if (this.elements.length == 0) {
      throw new Error('The stack is empty!');
    }
    return this.elements.pop();
  }
}

// 生成随机数
function randBetween(low: number, high: number): number {
  return Math.floor(Math.random() * (high - low + 1) + low);
}

let numbers = new Stack<number>(5);
// 入栈
while (!numbers.isFull()) {
  let n = randBetween(1, 10);
  console.log(`Push ${n} into the stack.`);
  numbers.push(n);
}
// 出栈
while (!numbers.isEmpty()) {
  let n = numbers.pop();
  console.log(`Pop ${n} from the stack.`);
}
```

## 泛型接口

泛型接口的语法为：泛型类型参数列表在尖括号 <> 中，接口名称之后。如`interface interfaceName<T> { ... }`、`interface interfaceName<U, V> { ... }`。

```typescript
// 1. 描述对象属性的泛型接口
interface Pair<K, V> {
  key: K;
  value: V;
}

let month: Pair<string, number> = {
  key: 'Jan',
  value: 1,
};

console.log(month);  // >>> {key: "Jan", value: 1,}

// 2. 描述方法的泛型接口
interface Collection<T> {
  add(o: T): void;
  remove(o: T): void;
}

// 使用 List<T> 泛型类来实现 Collection<T> 泛型接口
class List<T> implements Collection<T> {
  private items: T[] = [];

  add(o: T): void {
    this.items.push(o);
  }
  remove(o: T): void {
    let index = this.items.indexOf(o);
    if (index > -1) {
      this.items.splice(index, 1);
    }
  }
}

let list = new List<number>();
for (let i = 0; i < 10; i++) {
  list.add(i);
}
console.log(list);

// 3. 描述索引类型的泛型接口
interface Options<T> {
  [name: string]: T;  // ts 中的键值表示，[key: key_type]: value_type;
}

let inputOptions: Options<boolean> = {
  disabled: false,
  visible: true,
};
```