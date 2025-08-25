# Loss Function

## 1. Mean Squared Error

均方误差（MSE）的是求一个 batch 中 n 个样本的 n 个输出与期望输出的差的平方的平均值。具体为：
$$
\mathrm{L} = \frac{1}{2N} \sum_{i=1}^{N}(f(x_i) - y_i)^2
$$

只能用于回归问题，如 $y_i = wx_i +b$，有：
$$
\mathrm{L} = \frac{1}{2N} \sum_{i=1}^{N}(y_i - wx_i -b)^2
$$
其损失函数为**凸函数**，令导数为 0，可直接求出解析解。但它**无法用于分类问题**，如逻辑回归问题 $y_i = \frac{1}{1 + e^{-wx_i}}$，有：
$$
\mathrm{L} = \frac{1}{2N} \sum_{i=1}^{N}(y_i - \frac{1}{1 + e^{-wx_i}})^2
$$
其损失函数为**非凸**的，不能直接求解析解，易陷入局部最优解，使用梯度下降也很难得到全局最优解。

::: tip
**凸函数**：

设 $C$ 为实向量空间的凸子集，若实值函数 $f: C \rightarrow \mathbb{R}$ 对任意 $0 \leq t \leq 1$ 及任意 $\forall x,\,y \in C$，都有:
$$
f\left[x + t \cdot (y-x)\right] \leq f(x)+t \cdot \left[f(y) - f(x)\right]
$$
则 $f$ 称为凸函数。
:::

## 2. Cross-Entropy
对于一个二分类问题，y 取值 0， 1 服从伯努利分布，则有：
$$
\begin{aligned}
P(y=1|x; \theta) &= g(z); \\
P(y=0|x; \theta) &= 1-g(z)
\end{aligned}
$$
合并得到 $P(y|x; \theta) = g(x)^y(1-g(z))^{(1-y)}$。于是，对于一组相互独立的样本，其似然函数为：
$$
\mathrm{L}(\theta) = \prod_{i=1}^{N} P(y_i|x_i; \theta) = \prod_{i=1}^{N} g(z_i)^{y_i}(1-g(z_i))^{(1-y_i)}; \;\; y=0,1
$$
为了将连乘变成连加（便于求导），对两边同时取对数，有：
$$
\ln \mathrm{L}(\theta) = \sum_{i=1}^{N} y_i\ln g(z_i) + (1-y_i) \ln(1-g(z_i)); \;\; y=0,1
$$
由于，需要最大化似然函数，因此作为损失函数时，需要取负值：
$$
\mathrm{J}(\theta) = -\ln \mathrm{L}(\theta) = -\sum_{i=1}^{N} \left[ y_i\ln g(z_i) + (1-y_i) \ln(1-g(z_i)) \right]; \;\; y=0,1
$$
上式 $\mathrm{J}(\theta) = -\left[ y\ln \hat{y} + (1-y) \ln(1-\hat{y}) \right]$ 称为**二元交叉熵损失(BCE)**。令 $y=(y^1, y^2, \dots, y^C)$、$\hat{y}=(\hat{y}^1, \hat{y}^2, \dots, \hat{y}^C)^T$，有：
$$
\mathrm{J}(\theta) = -\sum_{i=1}^{C} y^i\ln \hat{y}^i = - y\ln(\hat{y})
$$

上式称为 **交叉熵(CE)** 损失，常写做 $H(P||Q)$。物理意义是：衡量模型预测 $\hat{y}$ 与标签 $y$ 分布之前的差异。
在分类任务中，标签 $y$ 是一个 one-hot 向量，因此 $\mathrm{L_{CE}}=-\ln \hat{y}^j |_{y^j=1}$，于是将其定义为 **负对数似然(NLL)** 损失：
$$
\mathrm{L_{NLL}}=-\ln p(y=k|x)|_{y^k=1}
$$

在实际使用中，常将 Softmax 和 Log 合并（防止数值不稳定，如概率很小时存在 ln(0)），即，$\mathrm{log_softmax}(z^i) = z^i - \ln\sum_{j}z^j$。下面是完全等价的：
```python
loss1 = F.cross_entropy(logits, target)

# log_softmax + NLLLoss
log_probs = F.log_softmax(logits, dim=1)
loss2 = F.nll_loss(log_probs, target)  # 只是取对应位置的数值，不是上面的公式（两步的整体是上面公式）
```

## 3. KL 散度

KL散度（Kullback-Leibler Divergence）又称 KL距离，是信息论中的一个衡量两个概率分布差异的指标。给定真实分布 $P$ 和预测分布 $Q$，定义：
$$
D_{KL}(P||Q) = \int_{x}p(x)\ln(\frac{p(x)}{q(x)}) dx = \sum_{i=1}^{C} P(i)\ln(\frac{P(i)}{Q(i)})
$$
其衡量了分布 $Q$ 拟合分布 P 的信息损失。下面介绍 KL 散度与交叉熵的关系。
::: tip
**熵（entropy）**：

熵（信息熵）是衡量一个分布自身的不确定性，具体定义为：
$$
H(P) = - \int_{x}p(x)\ln(p(x)) dx = - \sum_{i=1}^{C} P(i)\ln(P(i))
$$
:::

$$
\begin{aligned}
D_{KL}(P||Q) &= \sum_{i=1}^{C} P(i)\ln(\frac{P(i)}{Q(i)}) \\
&= \sum_{i=1}^{C} P(i) \left[\ln P(i) - \ln Q(i) \right] \\
&= \sum_{i=1}^{C} P(i)\ln P(i) - \sum_{i=1}^{C} P(i)\ln Q(i) \\
&= -H(P) + H(P||Q)
\end{aligned}
$$

于是有：交叉熵 = KL 散度 + 信息熵。由于一般在优化时，信息熵是一个常数，因此优化 KL 散度和优化 CE 损失是等价的。交叉熵优化更简单，常用于损失函数。

## 4. Softmax

softmax 函数是将置信度分数变成一个概率分布，定义为：
$$
\mathrm{Softmax}(z^i) = \frac{e^{z^i}}{\sum_{j=1}^{C} e^{z^j}}
$$
在实际使用中，为了保证数值稳定性，也就是防止 $e^{z^i}$ 太大导致溢出（overflow），常用下面写法（同上等价）：
$$
\mathrm{Softmax}(z^i) = \frac{e^{z^i - \max(z)}}{\sum_{j=1}^{C} e^{z^j - \max(z)}}
$$

::: tip
为什么要使用指数：

1. 输出概率始终为正；
2. 需要递增函数，即保证值越大，变换后的概率越大；
3. 拉开数值之间的差距。
:::

一般常用 Softmax + CrossEntropy 配合使用，由于 CE 中的对数和 Softmax 中的指数相消，求导友好。

## 5. PPL
困惑度（Perplexity, PPL）是一种评估语言模型好坏的指标。即，衡量了模型对语言的“困惑”程度。PPL 值就越大，模型越不确定。
直观理解：“困惑度为 3”，意味着模型平均每次在 3 个候选词中“困惑”地选择一个。

对于一个语言模型预测句子 $x=(x_1, x_2, \dots, x_T)$，其困惑度定义为:
$$
\mathrm{PPL}(x) = \exp\left(-\frac{1}{T} \sum_{t=1}^{T}\ln P(x_t|x_1, x_2, \dots, x_{t-1}) \right)
$$
即， $\mathrm{PPL} = e^{\mathrm{CrossEntropy}}$。

## 6. 余弦相似度

余弦相似度计算两向量夹角的余弦，判断两个向量的方向是否一致。当为 1 时，表示方向一致；当为 0 时，表示方向相反。
$$
\cos(\theta) = \frac{A \cdot B}{||A|| \cdot ||B||}
$$

