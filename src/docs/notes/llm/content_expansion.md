# Context Expansion

## 1. Position Interpolation
[Paper](https://arxiv.org/abs/2306.15595); [Code](/docs/codes/models/01_context_expansion.md##position-interpolation)

语言模型通常使用固定的上下文长度进行预训练，对于 RoPE position embedding 直接外推在大于 L 的序列上表现不佳。
本方法旨在通过少量数据微调，也能使模型在超出上下文长度的序列上表现良好。

$$
f'(x, m)=f(x, \frac{mL}{L'})
$$

即将新的长度按比例压缩到原来窗口内，压缩后更加“拥挤”，因此需要微调。

## 2. NTK-aware
[Code](/docs/codes/models/01_context_expansion.md##dynamic-ntk)

动态NTK的核心是：高频外推、低频内插。位置 n 的旋转位置编码本质上是 $\beta$ 进制编码，即，RoPE 的构造基础就是 Sinusoidal 位置编码：

$$
[cos(\frac{0}{\beta^0}), sin(\frac{1}{\beta^0}), cos(\frac{2}{\beta^1}), sin(\frac{3}{\beta^1}), \cdots, cos(\frac{n-1}{\beta^{d/2-1}}), sin(\frac{n}{\beta^{d/2-1}})], \beta=10000^{2/d}
$$

其中，最低频是 $\frac{n}{\beta^{d/2−1}}$ 项，引入参数 $\lambda$ 变为 $\frac{n}{(\beta\lambda)^{d/2−1}}$ ，使其与内插一致，即：

$$
\frac{n}{(\beta\lambda)^{d/2−1}} = \frac{n/k}{\beta^{d/2−1}}
$$

解得 $\lambda=k^{2/(d−2)}$，code直接修改base `base = base * k ** (dim / (dim-2))`

## 3. rerope

按照高频外推、低频内插的思想，设定一个窗口大小w，在窗口内使用大小为1的位置间隔，在窗口外使用大小为1/k的位置间隔，即:

$$
[0, 1, \cdots, w, w+\frac{1}{k}, w+\frac{2}{k}, \cdots, w+\frac{L-1-w}{k}]
$$

其中，需要w小于训练长度。当 $k\rightarrow \infty$ 时，有：

$$
[0, 1, \cdots, w, w, w, \cdots, w]
$$

## 4. YaRN
[Paper](https://arxiv.org/abs/2309.00071); [Code](/docs/codes/models/01_context_expansion.md##yarn)

用下面公式重新定义 PI：

$$
f'(x_m, m, \theta_d) = f(x_m, \frac{mL}{L'}, \theta_d)
$$
其中，$\theta_d=10000^{-2d/|D|}$ 表示频率。定义 $s = \frac{L'}{L}$，表示 scale factor，于是可以进一步重写上式：

$$
f'(x_m, m, \theta_d) = f(x_m, g(m), h(\theta_d))
$$
即：对于 PI，$g(m)=m/s; h(\theta_d)=\theta_d$。当引入新的插值时，只需要修改 $g(m)$ 和 $h(\theta_d)$ 即可。

定义 $\lambda_d$ 表示 ROPE Embedding的第 d 个维度的波长，描述在第 d 维上，RoPE Embedding完成一次完整旋转($2\pi$)所需的 token 长度。即：

$$
\lambda_d = \frac{2\pi}{\theta_d} = 2\pi b^{-2d/|D|}
$$
对于那些不考虑各维度的波长的方法（如：PI、NTK-aware），称为 blind 插值，而其他方法考虑波长的方法（如：YARN），称为 targeted 插值。

::: tip 补充知识
对于函数 $y = A sin(Bx + C) + D$：
- 振幅：A
- 周期：$T = \frac{2\pi}{B}$，表示完成往复运动一次所需要的时间；
- 频率：$f = \frac{1}{T}$，表示单位时间内完成周期性变化的次数；
- 波长：$v=uT$，$u$ 为波速。表示波在一个振动周期内传播的距离，此处指embedding空间中一个完整周期的长度。
:::

### 4.1 NTK-aware
对于上面改写后的公式有：

$$
\begin{aligned}
g(m) &= m \\
h(\theta_d) &= b'^{-2d/|D|} \\
where~b'&=b \cdot s^{\frac{|D|}{|D|-2}}
\end{aligned}
$$
该方法在扩展非微调模型的上下文大小方面表现比 PI 更好。但有一个主要缺点：它不仅仅是做插值，还有一些维度被外推到 out-of-bound，
因此使用 NTK-aware 进行微调产生的结果不如PI。此外，由于 out-of-bound，理论上 scale factor s 不能准确地描述真实的上下文扩展尺度。

### 4.2 NTK-by-parts
定义 $\lambda$ 为某个周期函数的波长。在RoPE中，给定上下文长度 L，存在某些维度 d 的波长 $\lambda$ 会大于预训练中所见的最大上下文长度（$\lambda > L$）。
那它们的周期性变化没完整展开，就意味着绝对位置信息可以保留；相反，当波长很短时（周期性变化太快），模型只能获取相对位置的信息。此时，
对 RoPE 的所有维度做缩放（乘 scale factor s 或更换 base b′），所有 token 在旋转后的角度会变小，那么两个向量的点积会变大（如：
token1与token2夹角10度，token1与token10夹角30度，都缩放10倍后，cos1与cos3基本相同，没有区分度），因此会让 token 间的相对位置变得不明显，
即破坏大模型的相对位置信息。

为了解决这个问题，选择对高频率的维度不插值，对低频率的维度进行插值。即：
- 波长 $\lambda$ 远小于上下文长度 L，不插值;
- 波长 $\lambda$ 等于或大于上下文长度 L，做插值并避免任何外推（但与 NTK-aware 不同）；
- 中间的部分维度使用 NTK-aware 插值。

为此，在原始上下文长度 L 和波长 $\lambda$ 之间引入比率 $r = \frac{L}{\lambda}$。在第 d 个 hidden state 中:
$$
r(d) = \frac{L}{\lambda_d} = \frac{L}{2\pi b'^{\frac{2d}{|D|}}}
$$

为了定义上述插值策略的边界，引入了两个额外的参数 $\alpha, \beta$。即，对所有 hidden 得维度 d： 
- 若 $r(d) < \alpha$（低频），通过 scale s 线性插值（如： PI）；
- 若 $r(d) > \beta$（高频）， 完全不插值；
- 其他情况，使用 NTK-aware 插值方法。

$$
\gamma(r) = 
\begin{cases}
0, & r < \alpha \\
1, & r > \beta \\
\frac{r - \alpha}{\beta - \alpha}, & otherwise
\end{cases}
$$

这种方式叫做“NTK-by-parts”（分步NTK）。即：
$$
\begin{aligned}
g(m) &= m \\
h(\theta_d) &= (1 - \gamma(r(d))) \frac{\theta_d}{s} + \gamma(r(d)) \theta_d
\end{aligned}
$$

其中，$\alpha, \gamma$ 由实验获取，一般 llama 模型中 $\alpha=1, \beta=32$

### 4.3 Dynamic NTK

模型在前向推理过程中，序列长度从1逐步增加至 max_seq_len，其中序列长度在每步后增加1都有两种插值方式：
- 按 scale factor $s = \frac{L′}{L}$ 来插值：当序列长度大于 L' 时，模型在序列长度小于 L 时会退化；
- 按 scale factor $s = \max(1, \frac{L′}{L})$ 来插值：对于短序列不插值，对于长序列渐进插值，更温和地过渡，避免突变和性能崩溃。

在自回归生成任务中，每次前向传播时只计算最新的 token，其它 token 的 key-value 向量会被缓存（kv-caching）。
有些实现方式会 cache RoPE 后的结果，如果使用 Dynamic Scaling 插值，就会出现错误，应该在位置编码前做 kv-caching。

原因：序列变长后，缩放因子会发生变化，新编码的query。

举例：当生成到第 3000 个 token 时，$s = \frac{3000}{2048} = 1.46$，这时缓存旧 token 的 kv 是被 $s\neq1$ 旋转过，
这与现在的 RoPE(s=1.46) 的 query 对不上。

### 4.4 YaRN
通过观察发现：在注意力机制中引入温度能够降低困惑度，即，将计算修改为如下：
$$
softmax(\frac{q_m^Tk_n}{t\sqrt{|D|}})
$$

即，将 $q_m$ 和 $k_n$ 缩放一个常数因子 $\sqrt{1/t}$。对于 LLaMA 和 Llama 2 模型有：
$$
\sqrt{\frac{1}{t}} = 0.1\ln(s) + 1
$$

## 5. LongROPE


## 6. llama3