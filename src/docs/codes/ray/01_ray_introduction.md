# Ray 介绍

Ray 是一个用于扩展 AI 和 Python 应用程序的统一框架。由一个 core distributed runtime 和一组用于简化 ML 计算的 AI libraries 组成。
为机器学习和大数据处理相关程序提供了用于并行处理的计算层。

![](/imgs/codes/ray/ray_padded.svg)

其中 Ray Core 包含：
- Tasks：面向函数的接口，用于定义一个函数，该函数可以在集群中分布式地执行；
- Actors：面向类的接口，用于定义一个类，该类可以在集群中分布式地执行；
- Objects：分布式的对象，对象不可变，用于在 Task 和 Actor 之间传递数据。

![](/imgs/codes/ray/ray_apis.svg)

Ray AI libraries 包含：
- Data：
- Train：
- Turn：
- Serve：
- RLlib：

Ray 的集群管理：

![](/imgs/codes/ray/ray_cluster.jpeg)

Ray 通常是以集群的方式部署在多台服务器上。Head node是主节点（也做Worker工作），Worker node是工作节点。


## installation

```bash
# 1. 最小安装（无Dashboard、Cluster Launcher）
pip install -U "ray"

# 2. 默认安装（仅作python使用）
pip install -U "ray[default]"

# 3. 机器学习使用
pip install -U "ray[data,train,tune,serve]"
pip install -U "ray[rllib]"  # 支持强化学习
```