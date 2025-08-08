# Ray 集群

Ray 集群由一系列计算节点组成，其中两类关键的节点：头节点（Head）和工作节点（Worker）。这些节点可以部署在虚拟机、容器或者是裸金属服务器上。

![](/imgs/codes/ray/ray_cluster.jpeg)

- Driver：用于执行程序的入口点。在运行时通常不应该执行大规模计算，而是负责将 Task 和 Actor 调度到具备足够资源的 Worker 上；
- Worker：每个计算节点上运行着一个或多个 Worker 进程，这些进程负责执行计算任务。Worker 进程可以是无状态的，即可以反复执行 Task 对应的任务；也可以是有状态的 Actor，即执行远程类的方法。默认情况下，Worker 的数量等于其所在计算节点的 CPU 核心数。
- Raylet：每个计算节点上运行着一个 Raylet。每个计算节点可能运行多个 Worker 进程，但每个计算节点上只有一个 Raylet 进程，或者说 Raylet 被多个 Worker 进程所共享。Raylet 主要包含两个组件：一个是调度器（Scheduler），它负责资源管理和任务分配；另一个是基于共享内存的对象存储（Shared-memory Object Store），它负责本地数据存储，各个计算节点上的 Object Store 共同构成了 Ray 集群的分布式对象存储。
- Global Control Service（GCS）：GCS 是 Ray 集群的全局元数据管理服务，负责存储和管理诸如哪个 Actor 被分配到哪个计算节点等元数据信息。这些元数据是被所有 Worker 共享的。

之前在 Python 代码中使用 ray.init() 方式，仅在本地启动了一个单机的 Ray 集群。实际上，Ray 集群包括 head 和 worker，应该分别启动。先在 head 启动：

```bash
ray start --head --port=6379
```

还可以使用 `ray up` 集群启动命令，它接收 yaml 文件作为参数，在 yaml 文件里定义好头节点地址、工作节点地址。

```yaml
cluster_name: default

provider:
    type: local
    head_ip: YOUR_HEAD_NODE_HOSTNAME
    worker_ips: [WORKER_NODE_1_HOSTNAME, WORKER_NODE_2_HOSTNAME, ... ]
```

```bash
ray up example.yaml
```

可以使用 `ray status` 命令查看启动的 Ray 集群的状态。

## 资源管理

Ray 可以管理计算资源，包括：num_cpus、num_gpus、memory（内存的70%）。在启动时可以只注册部分资源：

```bash
ray start --num-cpus=32 --num-gpus=4
```

为了更好地控制资源，建议在定义 Task 或 Actor 时指定所需的计算资源数量。在使用 ray.remote() 修饰函数或类时，
可以通过传递 num_cpus 和 num_gpus 参数来指定 Task 和 Actor 所需的计算资源。
或者调用 task.options() 或 actor.options() 来指定某个具体计算任务所需的资源。

```python
@ray.remote(num_cpus=4)
def func():
    ...

@ray.remote(num_cpus=16, num_gpus=1)
class Actor:
    pass

# 等价于
func.options(num_cpus=4).remote()
```

其他资源可以使用 `--resources={"special_hardware": 1}` 来管理这些计算资源。如：
- TPU：`resources={"TPU": 2}`;
- NPU：`resources={"NPU": 2}`;
- ARM：`resources={"arm64": 1}`.

