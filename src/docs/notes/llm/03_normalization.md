# Normalization

Batch Normalization 最早用于解决在深度学习中产生的 ICS（Internal Covariate Shift）的问题。

::: tip
Internal Covariate Shift 问题：若模型输入层数据分布发生变化，则模型在这波变化数据上的表现将有所波动，输入层分布的变化称为 Covariate Shift。
解决办法就是 Domain Adaptation。同理，网络中第 $L + 1$ 层的输入，也可能随着第 $L$ 层参数的变动，而引起分布的变动。
因此，在训练时每一层都要去适应这样的分布变化。

ICS 带来的问题：
1. 经过激活层时，容易陷入激活层的梯度饱和区，降低模型收敛速度（如：sigmoid、tanh）；
解决方法：使用非饱和的激活函数（如：ReLu等）
2. 需要采用较低的学习速率，同样也降低了模型收敛速度。
:::

## 1. Batch Normalization
[Paper](https://arxiv.org/pdf/1502.03167)

思路：对每一个batch进行操作，使得对于这一个batch中所有的输入数据，它们的每一个特征都是均值为0，方差为1的分布。
（单纯将输入限制为(0,1)分布也不合理，会降低数据的表达能力。因此需要加一个线性变换操作，让数据恢复其表达能力。）

- 图像中的数据维度：（B, C, H, W)；
- NLP中的数据为度：（B, S, E）。B 是 batch size、S 是 sequence length、E 是 token embedding dimension。

即，图像上是在 (B, HW) 平面上归一化，NLP中是在 (B, E) 平面上归一化，也就是一个batch内的同一个channel上所有数据作归一化。

### 1.1 训练中的 BN 

假设 batch size 为 B。在网络中某层中，记第 $i$ 个样本在该层第 $j$ 个神经元中经过线性变换后的输出为 $z_j^i$。
$$
\begin{aligned}
\mu_j &= \frac{1}{B} \sum_{i=1}^{B} z_j^i \\
\sigma_j^2 &= \frac{1}{B} \sum_{i=1}^{B} (z_j^i - \mu_j)^2 \\
\hat{z_j} &= \gamma_j \frac{z_j - \mu_j}{\sqrt{\sigma_j^2 + \epsilon}}  + \beta_j
\end{aligned}
$$

### 1.2 测试中的 BN

在训练中，batch 填充完才输入给模型做 BN。但在测试中没有 batch，每一条数据做一次推理，因此存在差异。

1. 使用训练集中的均值和方差作为测试集中均值和方差的无偏估计；
在训练模型时，保存每一组 batch 的每一个特征在每一层的 $\mu_{batch}$、$\sigma_{batch}^2$，就可以得出测试数据均值和方差的无偏估计：
$$
\begin{aligned}
\mu_{test} &= \mathbb{\mu_{batch}} \\
\sigma_{test}^2 &= \frac{B}{B-1} \mathbb{\sigma_{batch}^2} \\
BN(X_{test}) &= \gamma \frac{X_test - \mu_{test}}{\sigma_{test}^2 + \epsilon} + \beta
\end{aligned}
$$
此方法需要保存训练过程中，每一层、每一个、每一组的 $(\mu_{batch},\sigma_{batch}^2)$。因此会消耗大量存储空间。

2. Momentum：移动平均法(Moving Average)

假设 $\mu_t$ 是当前步骤求出的均值，$\bar{\mu}$ 是之前的训练步骤累积求得的均值（称为 running mean）。则：
$$
\bar{\mu} = p \bar{\mu} + (1-p)\mu_t
$$
其中，$p$ 是 momentum 的超参，表示模型在多大程度上依赖于过去的均值和当前的均值。因此可以不断更新整体数据的均值。同理，对于方差有：
$$
\bar{\sigma^2} = p \bar{\sigma^2} + (1-p) \bar{\sigma_t^2}
$$

这样就不需要保存所有的均值和方差结果，只需要保存 running mean 和 running variance 即可。

### 1.3 BN 的优势
- 通过解决ICS的问题，使得每一层神经网络的输入分布稳定，因此可以使用较大的学习率，加速模型收敛速度；
- 起到一定的正则作用，进而减少了dropout的使用。使用 BN 调整了数据的分布，可以尽量避免一些极端值造成的 overfitting 的问题；
- 使得数据不落入饱和性激活函数（如：sigmoid、tanh等）饱和区间，避免梯度消失的问题。

```python
def batch_norm(X, gamma, beta, running_mean, running_var, eps, momentum):
    if not torch.is_grad_enabled():  # 判断 train or prediction
        X_hat = (X - running_mean) / torch.sqrt(running_var + eps)
    else:
        assert len(X.shape) in (2, 4)
        if len(X.shape) == 2:  # fully connected layer
            mean = X.mean(dim=0)
            var = ((X - mean) ** 2).mean(dim=0)
        else:  # convolutional layer
            mean = X.mean(dim=(0, 2, 3), keepdim=True)  # 在第 0，2，3 维度上求均值
            var = ((X - mean) ** 2).mean(dim=(0, 2, 3), keepdim=True)
        X_hat = (X - mean) / torch.sqrt(var + eps)
        running_mean = (1.0 - momentum) * running_mean + momentum * mean
        running_var = (1.0 - momentum) * running_var + momentum * var
    Y = gamma * X_hat + beta  # Scale and shift
    
    return Y, running_mean, running_var


class BatchNorm(nn.Module):
    """
    :param num_features: outputs for fully connected layer or output channels for convolutional layer.
    :param num_dims: 2 for fully connected layer and 4 for convolutional layer.
    """
    def __init__(self, num_features, num_dims):
        super().__init__()
        if num_dims == 2:
            shape = (1, num_features)
        else:
            shape = (1, num_features, 1, 1)
        self.gamma = nn.Parameter(torch.ones(shape))
        self.beta = nn.Parameter(torch.zeros(shape))

        self.moving_mean = torch.zeros(shape)
        self.moving_var = torch.ones(shape)

    def forward(self, X):
        if self.moving_mean.device != X.device:
            self.moving_mean = self.moving_mean.to(X.device)
            self.moving_var = self.moving_var.to(X.device)

        Y, self.moving_mean, self.moving_var = batch_norm(
            X, self.gamma, self.beta, self.moving_mean,
            self.moving_var, eps=1e-5, momentum=0.1)
        return Y
```

## 2. Layer Normalization
[Paper](https://arxiv.org/pdf/1607.06450)

Layer Normalization用于解决 BN 无法很好地处理文本数据长度不一致的问题。

使用 BN 时，需要对不同数据的同一个位置的token向量计算均值、方差。当句子长短不一时，文本中的某些位置需要 padding，使得计算出来的 $\mu$、$\sigma$ 产生偏差。

图像上是在 (B, HW) 平面上归一化，NLP中是在 (E) 上归一化，即，在图片上是对所有 channel 内的 pixel 范围内归一化； 
在NLP上，是对一个句子的一个token的范围内进行归一化（即，token 级别归一化）。

$$
y = \gamma * \frac{x - \mu_{token}}{\sqrt{\sigma_{token} + \epsilon}} + \beta
$$

```python
class LayerNorm(nn.Module):
    def __init__(self, hidden_size, eps=1e-6):
        super().__init__()
        self.hidden_size = hidden_size
        self.eps = eps

        self.gamma = nn.Parameter(torch.ones(hidden_size))
        self.beta = nn.Parameter(torch.zeros(hidden_size))
        
    def forward(self, x):  # [B, S, H]
        mean = x.mean(dim=-1, keepdim=True)  # [B, S, 1]
        variance = x.var(dim=-1, keepdim=True, unbiased=False)  # [B, S, 1]

        x_normalized = (x - mean) / torch.sqrt(variance + self.eps)
        output = self.gamma * x_normalized + self.beta
        
        return output
```

## 3. Root Mean Square Normalization
[Paper](https://arxiv.org/pdf/1910.07467)

提出动机：LayerNorm 的计算量比较大，RSMNorm 性能与 LayerNorm相当（特定结构中），但可以节省 7%-64% 的运算。

与LayerNorm的区别：避免了计算均值和方差，仅计算均方根。

$$
\mathrm{RSM}(x) = \sqrt{\frac{1}{n} \sum_{i=1}^{n} x_i^2} \\
\mathrm{RSMNorm}(x) = w \cdot \frac{x}{\mathrm{RSM(x)} + \epsilon}
$$

```python
class RMSNorm(nn.Module):
    def __init__(self, hidden_size, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(hidden_size))
        self.variance_epsilon = eps

    def forward(self, hidden_states):
        input_dtype = hidden_states.dtype
        hidden_states = hidden_states.to(torch.float32)
        variance = hidden_states.pow(2).mean(-1, keepdim=True)
        hidden_states = hidden_states * torch.rsqrt(variance + self.variance_epsilon)
        return self.weight * hidden_states.to(input_dtype)
```

## 4. Deep Normalization
[Paper](https://arxiv.org/pdf/2203.00555)

DeepNorm 用于训练非常深（上百层）的 Transformer 模型，解决训练不稳定的问题，同时提高模型精度。

在 transformer 中 Pre-LN 结构: x + f(LN(x))；Post-LN结构: LN(x + f(x))。
训练深层网络时，容易出现梯度消失/爆炸或训练不稳定，特别是在 Post-LN 中尤为严重。

核心思想：不改变归一化方法（比如 LayerNorm、RMSNorm），而是改变残差连接的方式。

修改残差连接结构为：
$$
x_{l+1} = x_l + \alpha \mathrm{F}(x_l)
$$

然后在模型初始化时，将每层参数权重缩放为 $W_l = \beta \cdot W_L$

其中，DeepNorm 中的缩放因子 $\alpha = (2N)^{\frac{1}{4}}$、$\beta = (8N)^{-\frac{1}{4}}$，$N$ 为 layers 数量。


## 5. Norm 的位置选择

