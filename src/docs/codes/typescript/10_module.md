# 模块

TypeScript 中的模块只在自己的作用域中执行，即当在一个模块中声明变量，函数，类或接口等，它们在模块外部是不可见的。
只有使用 export 语句显式地把它们导出。

## 模块的导入、导出

```typescript
// Validator.ts 文件
export interface Validator {  // 只有添加 export 字段，才能在其他文件中导入此接口
  isValid(s: string): boolean;
}

// 等价于上面接口，不推荐，新版本会报错
interface Validator {
  isValid(s: string): boolean;
}

export { Validator };
// export { Validator as StringValidator };  // 可以对接口重命名

// EmailValidator.ts 文件
import { type Validator } from './Validator';
// import { Validator as StringValidator } from './Validator';  // 导入模块时也可以重命名

export class EmailValidator implements Validator {
  isValid(s: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(s);
  }
}

// index.ts
import { EmailValidator } from './EmailValidator';

let email = 'john.doe@typescripttutorial.net';
let validator = new EmailValidator();
let result = validator.isValid(email);

console.log(result);  // >>> true
```

## 导入、导出类型

```typescript
// Types.ts
export type alphanumeric = string | number;

// index.ts
import type { alphanumeric } from './Types';
```

## 全部导入

`import * from 'module_name';`

## 重新导出

```typescript
// Validator.ts 文件
export interface Validator {
  isValid(s: string): boolean;
}

// ZipCodeValidator.ts
import { type Validator } from './Validator';

export class ZipCodeValidator implements Validator {
  isValid(s: string): boolean {
    const numberRegexp = /^[0-9]+$/;
    return s.length === 5 && numberRegexp.test(s);
  }
}

// FormValidator.ts 在新文件中重新导出。目的统一出口
export * from './EmailValidator';
export * from './ZipCodeValidator';
```

## 默认导出

TypeScript 允许每个模块都有一个默认的导出，要将导出标记为默认的导出，可以使用 `default` 关键字实现。

```typescript
// ZipCodeValidator.ts
import type { Validator } from './Validator';

export default class ZipCodeValidator implements Validator {
  isValid(s: string): boolean {
    const numberRegexp = /^[0-9]+$/;
    return s.length === 5 && numberRegexp.test(s);
  }
}

// index.ts
import ZipCodeValidator from './ZipCodeValidator';

let validator = new ZipCodeValidator();
let result = validator.isValid('95134');

console.log(result);
```