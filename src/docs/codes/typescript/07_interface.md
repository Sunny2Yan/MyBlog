# 接口

TypeScript 中的接口为类型检查提供显式的名称。

```typescript
// 函数的参数是person，带有两个参数。代码难以阅读
function getFullName1(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

let person = {
  firstName: 'John',
  lastName: 'Doe',
};

console.log(getFullName1(person));  // >>> John Doe

// 使用接口，增强阅读
interface Person {
  firstName: string;
  lastName: string;
}

function getFullName2(person: Person) {
  return `${person.firstName} ${person.lastName}`;
}

let john = {
  firstName: 'John',
  lastName: 'Doe',
};

console.log(getFullName2(john));  // >>> John Doe

let jane = {
  firstName: 'Jane',
  middleName: 'K.',
  lastName: 'Doe',
  age: 22
};

let fullName = getFullName2(jane);
console.log(fullName);  // >>> Jane Doe
```

## 接口属性

```typescript
// 可选属性
interface Person {
  firstName: string;
  middleName?: string;
  lastName: string;
}

// 只读属性
interface Person {
  readonly ssn: string;
  firstName: string;
  lastName: string;
}
```

## 函数类型

接口除了描述对象的属性外，还可以描述函数类型。需要将接口赋值成以下形式：

- 包含类型的参数列表
- 包含返回类型

```typescript
interface StringFormat {
  (str: string, isUpper: boolean): string;
}

let format: StringFormat;
format = function (str: string, isUpper: boolean) {  // 这里的函数参数不需要和上面相同
  return isUpper ? str.toLocaleUpperCase() : str.toLocaleLowerCase();
};

console.log(format('hi', true));  // >>> HI

// 可以不需要全部参数
let lowerCase: StringFormat;
lowerCase = function (str: string) {
  return str.toLowerCase();
};

console.log(lowerCase('Hi', false));
```

## 类类型

接口的主要用途是定义不相关类之间的约定。

```typescript
interface Json {
  toJson(): string;
}

// 继承 json 类
class Person implements Json {
  constructor(private firstName: string, private lastName: string) {}
  toJson(): string {
    return JSON.stringify(this);
  }
}

let person = new Person('John', 'Doe');
console.log(person.toJson());
```