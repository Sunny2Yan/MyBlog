# Ray 分布式
ray 使用多进程，并行在多个CPU核心上，或节点上执行。

## 1. 分布式函数（Task）
被 Ray 加速的函数可以被运行在远程的 Ray 集群上，被称为远程函数（Remote Function）又被称为任务（Task）。 Remote Function 是无状态的，即：
执行只依赖函数的输入和输出，不依赖函数作用域之外的中间变量。

在使用 Ray 时，函数定义需要增加 `@ray.remote` 装饰器，调用时需要使用 `func_name.remote()` 的形式。
注意，`func_name.remote()` 返回值是 `ray.ObjectRef` 类型的对象，它不是一个具体的值，而是一个 Future（尚未完成但未来会完成的计算），需要使用 `ray.get()` 函数获取该调用的实际返回值。

执行方式：
1. 原生 Python 函数 func_name() 的调用是同步执行的，需要等待结果返回才进行后续计算，即这个调用是阻塞的。
2. Ray 函数 func_name.remote() 是异步执行的，不需要等待这个函数的计算真正执行完，Ray 就立即返回了一个 ray.ObjectRef，函数的计算是在后台某个计算节点上执行的。ray.get(ObjectRef) 会等待后台计算结果执行完将结果返回，它是一种阻塞调用。

注意：当不需要计算时，使用 ray.shutdown() 将 Ray 关闭，否则 Ray 进程会一直在后台运行。

::: code-group
```python [python]
def generate(n):
    res = []
    for i in range(n):
        if i < 2:
            res.append(i)
 
        res.append(generate(i-1) + generate(i-2))
 
    return len(res)

generate(20)
```

```python [ray]
import ray
import logging

if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)
 
 
@ray.remote
def generate_2(n):
    res = []
    for i in range(n):
        if i < 2:
            res.append(i)
 
        res.append(generate(i-1) + generate(i-2))
 
    return len(res)

ray.get(generate_2.remote(20))
ray.shutdown()
```
:::

## 2. 分布式对象存储（Object）
Ray 分布式计算中涉及共享数据可被放在分布式对象存储（Distributed Ojbect Store）中，被放置在分布式对象存储中的数据被称为远程对象（Remote Object）中。
可以使用 ray.get() 和 ray.put() 读写这些 Remote Object。

底层实现：
Ray 集群的每个计算节点都有一个基于共享内存的对象存储，Remote Object 的数据会存储在集群某个或者某些计算节点的对象存储中，所有计算节点的共享内存共同组成了分布式对象存储。

当某个 Remote Object 的数据量较小时（<= 100 KB），它会被存储在计算节点进程内存中；当数据量较大时，它会被存储在分布式的共享内存中；当集群的共享内存的空间不够时，数据会被外溢（Spill）到持久化的存储上，比如硬盘或者S3。

### 2.1 Remote Object的读写
- `ray.put()` 把某个计算节点中的对象数据进行序列化，并将其写入到 Ray 集群的分布式对象存储中，返回一个 RefObjectID，RefObjectID 是指向这个 Remote Object 的指针。我们可以通过引用这个 RefObjectID，在 Remote Function 或 Remote Class 中分布式地使用这个数据对象。
- `ray.get()` 使用 RefObjectID 把数据从分布式对象存储中拉取回来，并进行反序列化。

![](/imgs/codes/ray/object_store.svg)

```python
import ray
import torch
import logging
 
 
if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)
 
 
torch.manual_seed(42)
 
tensor_obj_ref_list = [ray.put(torch.randn(size=(i, 8, 8), dtype=torch.float)) for i in range(1, 16)]
print(tensor_obj_ref_list[0], len(tensor_obj_ref_list))
# >> ObjectRef(00ffffffffffffffffffffffffffffffffffffff0100000001e1f505) 15
 
val = ray.get(tensor_obj_ref_list[0])
print(val.size(), val)
# >> torch.Size([1, 8, 8])
 
ray.shutdown() 
```

### 2.2 Remote Ojbect 中的数据的修改
Remote Ojbect 中的数据是不可修改的（Immutable），即无法对变量原地更改。
需要使用新数据时，应使用 Remote Function 或者 Remote Class 对 Remote Object 进行转换操作，生成新的 Remote Object。

```python
# python
a = torch.rand(size=(1, 8, 8))
a[0] = torch.ones(8, 8)
print(a)  # a 改变

# ray
@ray.remote
def transform_tensor(tensor: torch.tensor) -> torch.tensor:
    return torch.transpose(tensor, 0, 1)

transformed_object_list = [transform_tensor.remote(t_obj_ref) for t_obj_ref in tensor_obj_ref_list]
transformed_object_list[0].size()
```

### 2.3 Remote Object 在 Task、Actor 之间传参
Remote Object 可以通过 RefObjectID 在 Task、Actor 之间传递。

1. 直接传递

在 Task 或者 Actor 的函数调用时将 RefObjectID 作为参数传递进去
x_obj_ref 是一个 RefObjectID ，`echo()` 这个 Remote Function 将自动从 x_obj_ref 获取 x 的值。
这个自动获取值的过程被称为自动反引用（De-referenced）

2. 复杂数据结构

如果 RefObjectID 被包裹在一个复杂的数据结构中，Ray 并**不会自动获取 RefObjectID 对应的值**，即 De-referenced 并不是自动的。

复杂数据结构包括：
- RefObjectID 被包裹在一个 dict 中，比如：`.remote({"obj": x_obj_ref})`
- RefObjectID 被包裹在一个 list 中，比如：`.remote([x_obj_ref])`

```python
import ray

ray.init(logging_level=logging.ERROR)

@ray.remote
def echo(x):
    print(f"current value of argument x: {x}")
    return x

x = list(range(5))
x_obj_ref = ray.put(x)
print(x_obj_ref)  
# >> ObjectRef(00ffffffffffffffffffffffffffffffffffffff0100000010e1f505)

# 调用 echo 函数时，才能将 RefObjectID 传递进去
x_get = ray.get(echo.remote(x_obj_ref))  # 通过ID取值
print(x_get)  
# >> [0, 1, 2, 3, 4]

x_get = ray.get(echo.remote(x))  # 也可以直接取值
print(x_get)  
# >> [0, 1, 2, 3, 4]

y_dict = ray.get(echo.remote({"obj": x_obj_ref}))
print(y_dict)  # 无法取到值
# >> {'obj': ObjectRef(00ffffffffffffffffffffffffffffffffffffff0100000010e1f505)}

y_list = ray.get(echo.remote([x_obj_ref]))
print(y_list)  # 无法取到值
# >> [ObjectRef(00ffffffffffffffffffffffffffffffffffffff0100000010e1f505)]

ray.shutdown()
```

## 3. 分布式类（Actor）

Task 是将一个无状态的函数扩展到 Ray 集群上进行分布式计算，但实际的场景中，经常需要进行有状态的计算。
最简单的有状态计算包括维护一个计数器，每遇到某种条件，计数器加一。 这类有状态的计算对于给定的输入，不一定得到确定的输出。
单机场景我们可以使用 Python 的类（Class）来实现，计数器可作为类的成员变量。Ray 可以将 Python 类拓展到集群上，即远程类（Remote Class），又被称为行动者（Actor）。

### 3.1 Actor
Ray 的 Remote Class 也使用 ray.remote() 来装饰。在使用时 Class 和方法都需要加 `.remote()`。

```python
import ray
import logging

if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)

@ray.remote
class Counter:
    def __init__(self):
        self.value = 0

    def increment(self):
        self.value += 1
        return self.value

    def get_counter(self):
        return self.value

counter = Counter.remote()  # class 需要加 .remote()
obj_ref = counter.increment.remote()  # method 也需要加 .remote()
print(ray.get(obj_ref))  # >> 1

# 不同 Actor 实例的成员函数调用可以被并行化执行
counters = [Counter.remote() for _ in range(10)]
results = ray.get([c.increment.remote() for c in counters])
print(results)
# >> [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  # 并行执行的

# 同一个 Actor 的成员函数调用是顺序执行的，5次操作共享状态数据 value
results = ray.get([counters[0].increment.remote() for _ in range(5)])
print(results)
# >> [2, 3, 4, 5, 6]

ray.shutdown()
```

### 3.2 Actor 编程模型

Actor 编程模型的基本要素是 Actor 实例，即每个 Actor 对象都是唯一的。
可以把单个 Actor 实例理解成单个带地址信息的进程。每个 Actor 都拥有地址信息，这样就可以从别的 Actor 向这个 Actor 发送信息，
一个 Actor 可以有一个地址，也可以有多个地址，多个 Actor 可以共享同一个地址，拥有多少个地址主要取决于想以怎样的方式收发数据。
多个 Actor 共享同一个地址，就像公司里有一个群组邮箱，群组包含了多个人，有个对外的公共地址，向这个群组发邮件，群组中的每个人都可以收到消息。

拥有地址和内存空间，Actor 可以做以下事情：

- 存储数据，比如状态数据
- 从别的 Actor 接收消息
- 向别的 Actor 发送消息
- 创建新的 Actor

Actor 存储的状态数据只能由 Actor 自己来管理，不能被其他 Actor 修改。
如果想修改 Actor 里面存储的状态数据，应该向 Actor 发送消息，Actor 接收到消息，并基于自己存储的数据，做出决策：决定修改状态数据，或者再向其他 Actor 发送消息。

为了保证 Actor 编程模型分布式环境下状态的一致性，对同一个 Actor 多次发送同样请求，多次请求是顺序执行的。

Actor 编程模型是消息驱动的，给某个 Actor 发送消息，它就会对该消息进行响应，修改自身的状态或者继续给其他 Actor 发送消息。
Actor 编程模型不需要显式地在多个进程之间同步数据，因此也没有锁的问题以及同步等待的时间。Actor 编程模型可被用于大量异步操作的场景。

可以用 ActorClass.options() 给这些 Actor 实例设置一些选项，起名字，设置 CPU、GPU 计算资源等

::: code-group
```python
import ray
import logging
from typing import Dict, List, Tuple


if ray.is_initialized:
    ray.shutdown()
ray.init(logging_level=logging.ERROR)


@ray.remote
class Ranking:
    def __init__(self, minimal_score: float = 60.0):
        self.minimal = minimal_score
        self.board = dict()

    def add(self, name: str, score: float) -> Dict[str, float]:
        try:
            score = float(score)
            if score < self.minimal:
                return
            if name in self.board:
                self.board[name] = max(score, self.board[name])
            else:
                self.board[name] = score
            self.board = dict(sorted(self.board.items(), key=lambda item: item[1]))
            return self.board
        except Exception as e:
            print(f"The data type of score should be float but we receive {type(score)}.")
            return self.board

    def top(self, n: int = 1) -> List[Tuple[str, float]]:
        n = min(n, len(self.board))
        results = list(self.board.items())[:n]
        return results

    def pop(self) -> Dict[str, float]:
        if len(self.board) <= 0:
            raise Exception("The board is empty.")
        else:
            _, _ = self.board.popitem()
        return self.board

ranking = Ranking.remote()
math_ranking = Ranking.remote(minimal_score=80)
chem_ranking = Ranking.options(name="Chemistry").remote()

# 获取名为 Chemistry 的 Actor Handle
cr = ray.get_actor("Chemistry")
print(cr)
# >> Actor(Ranking, adb85f4726a192bf8222be3301000000)

ranking.add.remote("Alice", 90)
ranking.add.remote("Bob", 60)
print(ray.get(ranking.top.remote(3)))
# >> [('Bob', 60.0), ('Alice', 90.0)]

ray.get(ranking.pop.remote())

ray.shutdown()
```

```python
from ray.util import ActorPool

@ray.remote
class PoolActor:
    def add(self, operands):
        (a, b) = operands
        return a + b

    def double(self, operand):
        return operand * 2

# 将创建的 Actor 添加至 ActorPool 中
a1, a2, a3 = PoolActor.remote(), PoolActor.remote(), PoolActor.remote()
pool = ActorPool([a1, a2, a3])

# 如果想调用 ActorPool 中的 Actor，可以使用 map(fn, values) 和 submit(fn, value) 方法。
# 这两个方法相似，所接收的参数是一个函数 fn 和参数 value 或者参数列表 values。
# map() 的 values 是一个列表，让函数并行地分发给多个 Actor 去处理；
# submit() 的 value 是单个值，每次从 ActorPool 中选择一个 Actor 去执行。
# fn 是一个 Lambda 表达式。这个 Lambda 表达式有两个参数：actor 和 value，actor 就是定义的单个 Actor 的函数调用，value 是这个函数的参数。
# 匿名函数 fn 的第一个参数是 ActorPool 中的 Actor，第二个参数是函数的参数。

pool.map(lambda a, v: a.double.remote(v), [3, 4, 5, 4])
pool.submit(lambda a, v: a.double.remote(v), 3)
pool.submit(lambda a, v: a.double.remote(v), 4)

ray.shutdown()
```
:::