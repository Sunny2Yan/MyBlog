# Attention

## 1. Standard Attention 

Attention 理解：给定一个 Query，计算它与多个 Key 的相似度，并根据这些相似度加权对应的 Value（即，每个输出是若干个 Value 的加权平均，而权重来自 Query 与各 Key 的相似度）。

Transformer 中标准的 Attention（Scaled Dot-Product Attention）定义为：
$$
\mathrm{attn} = \mathrm{softmax}(\frac{QK^T}{\sqrt{d}})V
$$
其计算复杂度为（[seq_len, hidden_size] * [hidden_size, seq_len]）**O(n^2)**。

::: tip
为什么需要进行 scaling（即，除以 $\sqrt{d}$）：

假设 $Q$，$K$ 的各个分量是相互独立的随机变量，服从标准正态分布，即均值为 0，方差为 1（论文的解释）。则 $Q \cdot K$ 点积的期望与方差：
$$
\begin{aligned}
\text{Var}(Q \cdot K) &= \text{Var} \left( \sum_{i=1}^{d_k} Q_i K_i \right) \\
&= \sum_{i=1}^{d_k} \text{Var} (Q_i K_i) \\
&= d_k \cdot \text{Var}(Q_i K_i) \\
&= d_k
\end{aligned}
$$
因此，点积的方差随维度 $d_k$ 增大而线性增加，从而导致后续 softmax 输出极端分布（类似 one-hot），梯度无法传播。

在加入缩放因子后：
$$
\text{Var}\left(\frac{QK^T}{\sqrt{d_k}} \right) = \sum_{i=1}^{d_k} \text{Var} \left(\frac{Q_i K_i}{\sqrt{d_k}} \right) = 1
$$
使 softmax 的值更加平稳，有利于模型学习。


因此，进行 scaling 可以有效避免因 softmax 饱和，而导致的梯度消失/爆炸问题。
:::

![](/imgs/notes/llm/attention/gqa.png)

### 1.1 Multi-Head Attention

多头的目的：单一注意力可能只能关注一个模式，多头让模型在多个子空间并行学习注意力，有助于捕捉不同特征。

方法：将输入分别线性变换成 $H$ 个头，每个头分别计算 attention，然后再拼接结果：
$$
\text{MHA}(X) = \text{Concat}(\text{head}_1, \dots, \text{head}_H)W^O
$$

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, hidden_size, num_attention_heads, head_dim):
        super().__init__()
        assert hidden_size % num_attention_heads == 0, "embed_dim must be divisible by num_heads"
        self.head_dim = head_dim

        # 线性层：分别用于 Q, K, V
        self.q_proj = nn.Linear(hidden_size, num_attention_heads * head_dim)
        self.k_proj = nn.Linear(hidden_size, num_attention_heads * head_dim)
        self.v_proj = nn.Linear(hidden_size, num_attention_heads * head_dim)
        self.o_proj = nn.Linear(num_attention_heads * head_dim, hidden_size)

    def forward(self, hidden_states, attention_mask=None): 
        batch_size, seq_len, hidden_size = hidden_states.shape()  # (B, S, H)
        # (B, S, num_heads, head_dim)，分别对每个head做attention
        hidden_shape = (batch_size, seq_len, -1, self.head_dim)
        query_states = self.q_proj(hidden_states).view(hidden_shape).transpose(1, 2)
        key_states = self.k_proj(hidden_states).view(hidden_shape).transpose(1, 2)
        value_states = self.v_proj(hidden_states).view(hidden_shape).transpose(1, 2)
        
        scaling = self.head_dim ** -0.5
        attn_weights = torch.matmul(query_states, key_states.transpose(2, 3)) * scaling
        if attention_mask is not None:
            causal_mask = attention_mask[:, :, :, : key_states.shape[-2]]
            attn_weights = attn_weights + causal_mask
        
        attn_weights = nn.functional.softmax(attn_weights, dim=-1, dtype=torch.float32).to(query.dtype)
        attn_output = torch.matmul(attn_weights, value_states)
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.reshape(batch_size, seq_len, -1).contiguous()
        attn_output = self.o_proj(attn_output)
        
        return attn_output, attn_weights
```

### 1.2 Multi-Query Attention
[Paper](https://arxiv.org/pdf/1911.02150)

在推理时，由于是预测下一个token，则下一个step的输入就包含了上一个step的内容，只是末尾多了一个token。
那么下一个step的计算也应该包含上一个step的计算，于是 KV_Cache=[(k_0,v_0), (k_1,v_1), ...]。
对于输入长度为 S，层数为 L，hidden_size为 H 的模型，**需要缓存的参数量为：$2*S*L*H$**。

为了减少计算和降低显存消耗 
MQA 只需要保存 1 份 K/V，即需要缓存的参数量为：$2*S*L*\text{head\_dim}$，显存开销降低到 num_heads 倍

推理加速（特别是在长文本 / 大模型场景）：
多组 K/V 意味着每个 Q 都要做 dot-product + softmax + 加权求和
MQA 只需要计算一次 K/V → 显著加快推理速度

Multi-Head Attention 在推理过程中反复加载 KV Cache，导致内存开销大。
Multi-Query Attention在所有注意力头上共享一个 key 和 value

```python
self.q_proj = nn.Linear(hidden_size, num_attention_heads * head_dim)
self.k_proj = nn.Linear(hidden_size, head_dim)  # 此处head数量发生变化
self.v_proj = nn.Linear(hidden_size, head_dim)  # 此处head数量发生变化
self.o_proj = nn.Linear(num_attention_heads * head_dim, hidden_size)
```

### 1.3 Grouped-Query Attention
[Paper](https://arxiv.org/pdf/2305.13245)


```python
self.q_proj = nn.Linear(hidden_size, num_attention_heads * head_dim)
self.k_proj = nn.Linear(hidden_size, num_key_value_heads * head_dim)  # 此处head数量发生变化
self.v_proj = nn.Linear(hidden_size, num_key_value_heads * head_dim)  # 此处head数量发生变化
self.o_proj = nn.Linear(num_attention_heads * head_dim, hidden_size)
```





![](/imgs/notes/llm/attention/f_a_1.png)

给定输入序列 $Q, K, V \in \mathbb{R}^{N \times d}$，其中 $𝑁$是序列长度、$𝑑$ 是 head dimension，通过下面公式计算 attention 输出 $O \in \mathbb{R}^{N \times d}$：
$$
\begin{aligned}
S &= QK^{T} \in \mathbb{R}^{N \times N} \\
P &= \mathrm{softmax}(S) \in \mathbb{R}^{N \times N} \\
O &= PV \in \mathbb{R}^{N \times d} \\
\end{aligned}
$$

![](/imgs/notes/llm/attention/f_a_2.png)

缺点：由于 SRAM 空间较小，这样直接大量的读写导致 Attention 运算速度较慢，而且会有内存碎片化问题。

#### Backward
给定输入序列 $Q, K, V \in \mathbb{R}^{N \times d}$，输出 $O \in \mathbb{R}^{N \times d}$，输出的梯度 $dO$，来计算输入的梯度 $dQ, dK, dV \in \mathbb{r}^{N \times B}$：

![](/imgs/notes/llm/attention/f_a_3.png)




## 2. Flash Attention V1

#### Kernel fusion
从 HBM 加载输入，执行所有计算步骤（矩阵乘法、softmax、可选的掩码和 dropout、矩阵乘法），然后将结果写回 HBM。而不是从HBM反复读写。

#### Recomputation
向前的时候 P 和 S 都不会存起来，在向后的时候，再计算一次向前把P和S再算出来然后执行向后，求 QKV 的梯度，即共执行了2次前进1次后向。

#### Tiling
对于一个向量 $x \in \mathbb{R}^B$，softmax 计算如下：
$$
m(x) := \max_{i} x_i, ~~~~
f(x) := [e^{x_1-m(x)}, \cdots, e^{x_B-m(x)}],~~~~
l(x) := \sum_{i}f(x)_i, ~~~~
softmax(x) := \frac{f(x)}{l(x)}
$$
对于向量 $x^{(1)}, x^{(2)} \in \mathbb{R}^B$，$x=[x^{(1)}, x^{(2)}] \in \mathbb{R}^{2B}$，计算 softmax 如下：
$$
\begin{aligned}
m(x) &= m(x^{(1)}, x^{(2)}) = \max(m(x^{(1)}), m(x^{(2)})), ~~~~
f(x) = [e^{m(x^{(1)}) - m(x)}f(x^{(1)}), e^{m(x^{(2)}) - m(x)}f(x^{(2)})], \\
l(x) &= l([x^{(1)}, x^{(2)}]) = e^{m(x^{(1)}) - m(x)}l(x^{(1)}) + e^{m(x^{(2)}) - m(x)}l(x^{(2)}), ~~~~
softmax(x) = \frac{f(x)}{l(x)}
\end{aligned}
$$

注意：减 $m(x)$，是为了数值稳定，结果保持不变

### 前向算法：
![](/imgs/notes/llm/attention/f_a_4.png)
注意：$B_r$ 中的 $\min()$ 是为了防止 $B_r \times B_c > M/4$。矩阵分割只按行分割，列数保持不变。

### 后向算法：


## 3. Flash Attention V2
FlashAttention 仍不如优化的矩阵乘法 (GEMM) 操作快，仅达到理论最大 FLOP/s 的 25-40%。导致效率低下是由于不同线程块和 GPU 上的扭曲之间的次优工作分区，导致低占用或不必要的共享内存读取/写入。

1. 调整算法以减少非矩阵乘法FLOPs数量

在 Flash Attention 中：
$$
O^{(2)} = diag(l^{(1)} / l^{(2)})^{-1} O^{(1)} + diag(l^{(2)})^{-1} e^{S^{(2)} - m^{(2)}} V^{(2)}
$$

$$
\tilde{O}^{(2)} = diag(l^{(1)})^{-1} O^{(1)} + e^{S^{(2)} - m^{(2)}}V^{2}
$$

2. 并行计算注意力，即使是单个头部，也跨不同的线程块以增加占用率
3. 每个线程块内，将工作分配给线程束以减少通过共享内存的通信


## MLA