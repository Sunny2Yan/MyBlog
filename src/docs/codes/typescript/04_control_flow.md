# 控制流语句

## 条件语句

```typescript
// 1. if 语句
let counter = 0;

if (counter < 10) {
  counter++;
}

console.log(counter); // >>> 1

// 2. if ... else 语句
if (counter < 0) {
  counter++;
} else {
  counter = 10;
}

console.log(counter);  // >>> 10

// 3. 三元运算符
counter < 0 ? counter++ : (counter = 10);

// 4. if ... else if ... else 语句
let discount: number;
let itemCount = 11;

if (itemCount > 0 && itemCount <= 5) {
  discount = 5; // 5% discount
} else if (itemCount > 5 && itemCount <= 10) {
  discount = 10; // 10% discount
} else {
  discount = 15; // 15%
}

console.log(`You got ${discount}% discount. `);  // >>> You got 15% discount.
```

## switch case 语句

```typescript
let targetId = 'btnDelete';

switch (targetId) {
  case 'btnUpdate':
    console.log('Update');
    break;
  case 'btnDelete':
    console.log('Delete');
    break;
  case 'btnNew':
    console.log('New');
    break;
}
```

## for 循环语句

```typescript
for (let i = 0; i < 10; i++) {
  console.log(i);
}

// () 中的三个表达式都是可循的。上面等价于下面写法
let i = 0;
for (; i < 10; i++) {
  console.log(i);
}

// 也等价于下面写法
let i = 0;
for (;;) {
  console.log(i);
  i++;
  if (i > 9) break;
}
```

## while 与 do...while 循环

```typescript
let counter = 0;

while (counter < 5) {
  console.log(counter);
  counter++;
}

// 等价于下面写法
let i = 0;

do {
  console.log(i);
  i++;
} while (i < 5);
```

## break 与 continue

```typescript
let products = [
  { name: 'phone', price: 700 },
  { name: 'tablet', price: 900 },
  { name: 'laptop', price: 1200 },
];

for (var i = 0; i < products.length; i++) {
  if (products[i].price == 700) continue;
  console.log(products[i]);
  if (products[i].price == 900) break;
}
// >>> { name: 'tablet', price: 900 }
```