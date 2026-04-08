# 类

```typescript
class Person {
  ssn: string;
  firstName: string;
  lastName: string;

  // 构造器，类似于 python 中的 __init__() 方法
  constructor(ssn: string, firstName: string, lastName: string) {
    this.ssn = ssn;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

let person = new Person('171-28-0926', 'John', 'Doe');  // 通过 new 实例化类
console.log(person.getFullName());
```

## 类的访问修饰符

- private：属性和方法只在当前类中可见；
- public：允许在任何位置访问类的属性和方法；
- protected：允许一个类的属性和方法在当前类或者当前类的子类中被访问。

```typescript
class Person {
  protected ssn: string;
  private firstName: string;
  public lastName: string;

  constructor(ssn: string, firstName: string, lastName: string) {
    this.ssn = ssn;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// 可以简化，直接在构造函数中添加属性字段。上面等价于
class Person {
  constructor(
      protected ssn: string, 
      private firstName: string, 
      public lastName: string) {
    this.ssn = ssn;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

let person = new Person('153-07-3130', 'John', 'Doe');
console.log(person.firstName);  // 类外访问私有属性，报错
```

## 类的只读属性

TypeScript 中使用 `readonly` 关键字，可以将类属性变为只读模式，不可更改。

```typescript
class Person {
  constructor(readonly birthDate: Date) {
    this.birthDate = birthDate;
  }
}

let person = new Person(new Date(1990, 12, 25));
person.birthDate = new Date(1991, 12, 25);  // 只读属性不可更改，报错
```

## `getter` 与 `setter` 方法

- getter 方法以 get 关键字开头，用于返回属性的值；
- setter 方法以 set 关键字开头，用于更新属性的值，常用作属性检查。

```typescript
class Person {
  constructor(
      private age: number, 
      private firstName: string, 
      private lastName: string) {
    this.age = age;
    this.firstName = firstName;
    this.lastName = lastName;
  }
  
  public get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  public set fullName(name: string) {
    let parts = name.split(' ');
    if (parts.length != 2) {
      throw new Error('Invalid name format: first last');
    }
    this.firstName = parts[0];
    this.lastName = parts[1];
  }
}
```

## 类继承

TypeScript 的类继承采用 `class <sub_class> extends <parent_class> {..}` 的方式，并在子类的构造函数中使用 `super` 字段继承父类属性。

```typescript
// 定义父类
class Person {
  constructor(private firstName: string, private lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  describe(): string {
    return `This is ${this.firstName} ${this.lastName}.`;
  }
}

// 子类继承
class Employee extends Person {
  constructor(firstName: string, lastName: string, private jobTitle: string) {
    // call the constructor of the Person class:
    super(firstName, lastName);  // 继承父类属性
    this.jobTitle = jobTitle;
  }
  
  // 方法重载
  describe(): string {
    return super.describe() + `I'm a ${this.jobTitle}.`;
  }
}

let employee = new Employee('John', 'Doe', 'Front-end Developer');
console.log(employee.getFullName());  // >>> John Doe
console.log(employee.describe());  // >>> This is John Doe.I'm a Front-end Developer.
```

## 静态属性和方法

静态属性/方法是类所有实例之间共享的属性/方法。要声明静态属性/方法，可以使用 static 关键字。访问静态属性，可以使用 className.propertyName 语法。

```typescript
// 静态属性
class Employee1 {
  static headcount: number = 0;  // 实例计数，每创建一个实例就会加1

  constructor(
    private firstName: string,
    private lastName: string,
    private jobTitle: string,
  ) {
    Employee1.headcount++;
  }
}

// 静态方法
class Employee2 {
  private static headcount: number = 0;

  constructor(
    private firstName: string,
    private lastName: string,
    private jobTitle: string,
  ) {
    Employee2.headcount++;
  }

  public static getHeadcount() {
    return Employee2.headcount;
  }
}

let john1 = new Employee1('John', 'Doe', 'Front-end Developer');
let jane1 = new Employee1('Jane', 'Doe', 'Back-end Developer');
console.log(Employee1.headcount);  // >>> 2

let john2 = new Employee2('John', 'Doe', 'Front-end Developer');
let jane2 = new Employee2('Jane', 'Doe', 'Back-end Developer');
console.log(Employee2.getHeadcount);  // >>> 2
```

## 抽象类

抽象类不能直接实例化。要声明一个抽象类，可以使用 abstract 关键字，如 `abstract class Employee {...}`。

```typescript
abstract class Employee {
  constructor(private firstName: string, private lastName: string) {}
  abstract getSalary(): number;  // 抽象方法
  
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  compensationStatement(): string {
    return `${this.fullName} makes ${this.getSalary()} a month.`;
  }
}

// 继承类 1
class FullTimeEmployee extends Employee {
  constructor(firstName: string, lastName: string, private salary: number) {
    super(firstName, lastName);
  }
  
  // 实现抽象类中的抽象方法
  getSalary(): number {
    return this.salary;
  }
}

// 继承类 2
class Contractor extends Employee {
  constructor(
    firstName: string,
    lastName: string,
    private rate: number,
    private hours: number,
  ) {
    super(firstName, lastName);
  }
  
  // 实现抽象类中的抽象方法
  getSalary(): number {
    return this.rate * this.hours;
  }
}

let employee = new Employee('John', 'Doe');  // 抽象类不能实例化，报错
let john = new FullTimeEmployee('John', 'Doe', 12000);
let jane = new Contractor('Jane', 'Doe', 100, 160);

console.log(john.compensationStatement());  // John Doe makes 12000 a month.
console.log(jane.compensationStatement());  // Jane Doe makes 16000 a month.
```