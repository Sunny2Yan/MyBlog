# Gate Attention

[Paper](https://arxiv.org/abs/2505.06708)

通过一种简单的修改：

在 Scaled Dot Product Attention（SDPA）之后增加一个针对每个注意力头的 sigmoid 门控能够持续提升性能。这种修改还能**增强训练稳定性、容忍更大的学习率，并改善扩展性能**。 其有效性归因于两个关键因素：
1. 在 softmax 注意力中的低秩映射上引入非线性；
2. 应用依赖查询的稀疏门控分数来调制 SDPA 的输出。

值得注意的是，这种稀疏门控机制能够缓解 “attention sink” 问题，并提升长上下文外推性能。


## 方法
![](/imgs/notes/papers/gate_attn/gate_1.png)
门机制被公式化为：
$$Y' = g(Y, X, W_\theta, \sigma) = Y \cdot \sigma(XW_\theta)$$

其中，$Y$ 表示待调制（数值或特征被另一个信号动态调整或控制）的输入，$X$ 是用于计算门控得分的另一个输入，$W_\theta$ 表示门控模块的可学习参数，$\sigma$ 表示激活函数（如：Sigmoid 函数），$Y′$ 表示是经过门控处理后的输出。
门控得分 $\sigma(XW_\theta)$ 充当了一种动态滤波器，通过有选择地保留或抹除 $Y$ 中的特征，从而精确调控信息的流动。

下面将探究了注意力层中门控机制的若干变体。主要聚焦以下五个关键方面：  
1. Positions：探究不同位置施加门控机制的效果：
   - 在Q、K、V投影之后添加，对应于图中的位置 G2、G3、G4；
   - 在 SDPA 输出之后添加，对应图中位置 G1；
   - 在最终多头注意力拼接输出之后添加，对应图中位置 G5。
2. Granularity：探究不同水平的门控分数粒度：  
   - Headwise：单个**标量**门控分数对整个注意力头的输出进行调制；
   - Elementwise：门控分数为与 $Y$ 维度相同的**向量**，实现细粒度的逐维调制。
3. Head Specific or Shared：探究对不同head采样不同的门控分数，还是共享分数：  
   - Head-Specific：每个注意力头拥有专属的门控分数，实现对每个头进行独立调制；  
   - Head-Shared：$W_\theta$ 及门控分数在各头之间共享。
4. 乘性或加性：对于门控分数与Y的结合方式，我们考虑：  
   - 乘法门控：门控后的输出计算为 $Y′ = Y \cdot \sigma(X\theta)$；  
   - 加法门控：门控后的输出计算为 $Y′ = Y + \sigma(X\theta)$。
5. 激活函数：测试 SiLU 和 Sigmoid 两种。

## 实验

模型：MoE 模型（15B-2.54B，即 15A2B）和 Dense 模型（1.7B）
数据：3.5T token，context 长度为 4096。 
优化器：使用带有默认值的 AdamW 优化器。

注：由于门控引入的参数和浮点运算量很小，门控带来的运行时延迟低于 2%。

### MoE 模型

15A2B MoE 模型：使用 128 个专家，采用 top-8 softmax gate、fine-grained experts（即，DeepSeek MoE）、global-batch LBL 以及 z-loss。注意力使用 GQA。

实验设置：learning rate 从 0 warm up 1000 个 step 到 2e-3，然后按余弦衰减至 3e-5。global batch size 为 1024，总优化 10 万个 step。

![](/imgs/notes/papers/gate_attn/gate_2.png)

### Dense 模型

由于门控机制引入了新的参数，为了保持参数规模不变，这里适当缩小了 FFN 的宽度。

实验设置：之前的研究证实，增加网络深度、采用大学习率以及增大批量大小，能够显著提升模型性能（如：在 400B token 上训练的 1.7B 参数模型，采用 lr 为 4e-3，batch size 为 1024。而此时在 3.5T token 上训练，lr 为 4.5e-3，batch size 为 2048）。

注：可以观察到使用门控机制能够显著降低训练过程中损失值突增的现象。

![](/imgs/notes/papers/gate_attn/gate_3.png)

SDPA逐元素门控是增强注意力机制的最有效方法，该门控机制能够支持更大批量和更高学习率下的稳定训练。

## Gate Attention 有效性的原因分析

主要结论如下：（1）增强非线性的门控操作始终能带来性能提升（第4.1节）；（2）最有效的SDPA逐元素G1门控，能够为SDPA输出引入强输入依赖的稀疏性（第4.2节），从而有效缓解“注意力坍塌”现象。

### 非线性提升了注意力机制中低秩映射的表达能力。


### Gating 引入了输入依赖的稀疏性。


