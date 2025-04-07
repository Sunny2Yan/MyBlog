# Context Expansion

## 1. Position Interpolation
#position-interpolation
[Paper](https://arxiv.org/pdf/2306.15595); [Code](/docs/codes/models/01_context_expansion.md)

$$
f'(x, m)=f(x, \frac{mL}{L'})
$$

即将新的长度按比例压缩到原来窗口内，压缩后更加“拥挤”，通常需要微调。

## 2. Dynamic NTK

动态NTK的核心是：高频外推、低频内插。位置 n 的旋转位置编码本质上是 $\beta$ 进制编码，即，RoPE 的构造基础就是 Sinusoidal 位置编码：

$$
[cos(\frac{0}{\beta^0}), sin(\frac{1}{\beta^0}), cos(\frac{2}{\beta^1}), sin(\frac{3}{\beta^1}), \cdots, cos(\frac{n-1}{\beta^{d/2-1}}), sin(\frac{n}{\beta^{d/2-1}})], \beta=10000^{2/d}
$$

其中，最低频是 $\frac{n}{\beta^{d/2−1}}$ 项，引入参数 $\lambda$ 变为 $\frac{n}{(\beta\lambda)^{d/2−1}}$ ，使其与内插一致，即：

$$
\frac{n}{(\beta\lambda)^{d/2−1}} = \frac{n/k}{\beta^{d/2−1}}
$$

解得 $\lambda=k^{2/(d−2)}$，code直接修改base `base = base * 8 ** (dim / (dim-2))`

## 3. rerope
按照高频外推、低频内插的思想，设定一个窗口大小w，在窗口内使用大小为1的位置间隔，在窗口外使用大小为1/k的位置间隔，即:

$$
[0, 1, \cdots, w, w+\frac{1}{k}, w+\frac{2}{k}, \cdots, w+\frac{L-1-w}{k}]
$$

其中，需要w小于训练长度。当 $k\rightarrow \infty$ 时，有：

$$
[0, 1, \cdots, w, w, w, \cdots, w]
$$

## 4. YARN


## 5. LongROPE


## 6. llama3