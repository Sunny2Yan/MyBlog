# Model Architecture

[source](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison)

## 1. DeepSeek V3
在DeepSeek V3 中引入的两种关键架构技术，提高了其计算效率：
- Multi-Head Latent Attention (MLA)
- Mixture-of-Experts (MoE)

### 1.1 MLA
以往的 GQA 采用一个 K-V pair 对应一组 query，来降低 K-V Cache，其性能与标准 MHA 相当。
多头潜在注意力 (MLA) 提供了一种不同的内存节省策略，它不像 GQA 那样共享键值头，而是将键值张量压缩到低维空间，然后再将它们存储在键值缓存中。(注：query也会被压缩，但仅在训练期间，而不是推理期间)
在推理时，这些压缩的张量会被投影回其原始大小，然后再使用，这增加了额外的矩阵乘法，但减少了内存使用量。

![](/imgs/notes/llm/model_architecture/deepseek.png)

在 DeepSeek V2 中对 GQA 和 MLA分别同 MHA 作对比，GQA 的性能不如 MHA，而 MLA 的性能优于 MHA，这可能就是 DeepSeek 团队选择 MLA 而非 GQA 的原因。

![](/imgs/notes/llm/model_architecture/deepseek_mla.png)

### 1.2 MoE
MoE 的核心思想是用多个专家层替换 Transformer 模块中的每个前馈模块，其中每个专家层本身也是一个前馈模块。这意味着我们将单个前馈模块替换为多个前馈模块

由于每次只有少数专家处于活跃状态，因此 MoE 模块通常被称为稀疏模块，
DeepSeek-V3 每个 MoE 模块有 256 位专家，总共 6710 亿个参数。然而，在推理过程中，每次只有 9 位专家处于活动状态（1 位共享专家加上 8 位由路由器选择的专家）。这意味着每个推理步骤仅使用 370 亿个参数

![](/imgs/notes/llm/model_architecture/deepseek_moe.png)

DeepSeek-V3 的 MoE 设计的一个显著特点是使用了一个共享专家。这是一个始终对每个 token 保持活跃的专家。与无共享专家相比，共享专家可以提升模型整体性能。

![]()

## 2. OLMo 2

