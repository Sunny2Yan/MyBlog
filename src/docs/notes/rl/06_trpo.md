# Trust Region Policy Optimization

[Paper](https://arxiv.org/pdf/1502.05477)

Based policy 的方法：**策略梯度算法** 和 **Actor-Critic 算法**，虽然简单、直观，但在实际应用过程中会遇到训练不稳定的情况。

Based policy方法的思路： 参数化 Agent 策略，并设计衡量策略好坏的目标函数，使用梯度上升的方法来最大化目标函数，使得策略最优。

对于 policy $\pi_\theta$，定义：
$$
J(\theta) = \mathbb{E}_{s_0} [V^{\pi_\theta}(s_0)] = \mathbb{E}_{\pi_\theta} \left[ \sum_{t=0}^\infty \gamma^t r(s_t, a_t) \right]
$$

其目标是找到 $\theta^* = \arg \max_\theta J(\theta)$。策略梯度算法主要沿着 $\nabla_\theta J(\theta)$ 方向迭代更新策略参数 $\theta$。
但是当策略网络是深度模型时，沿着策略梯度更新参数，可能由于步长太长，导致策略突然显著变差，进而影响训练效果（即对lr敏感）。


针对以上问题，**考虑在更新时找到一块信任区域（trust region），在这个区域上更新策略时能够得到某种策略性能的安全性保证**，这就是 TRPO 算法的主要思想。在理论上能够保证策略学习的性能单调性。


## 1. 策略目标

对于当前策略 $\pi_\theta$，考虑借助当前的 $\theta$ 找到一个更优的参数 $\theta'$，使得 $J(\theta') \geq J(\theta)$。
由于初始状态 $s_0$ 的分布和策略无关，因此上述策略 $\pi_\theta$ 下的优化目标 $J(\theta)$ 可以写成在新策略 $\pi_{\theta'}$ 的期望形式：
$$
\begin{aligned}
J(\theta) &= \mathbb{E}_{s_0} \left[ V^{\pi_\theta}(s_0) \right] \\
&= \mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t V^{\pi_\theta}(s_t) - \sum_{t=1}^\infty \gamma^t V^{\pi_\theta}(s_t) \right] \\
&= -\mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t \left( \gamma V^{\pi_\theta}(s_{t+1}) - V^{\pi_\theta}(s_t) \right) \right]
\end{aligned}
$$

基于以上等式，可以推导新旧策略的目标函数之间的差距：
$$
\begin{aligned}
J(\theta') - J(\theta) &= \mathbb{E}_{s_0} \left[ V^{\pi_{\theta'}}(s_0) \right] - \mathbb{E}_{s_0} \left[ V^{\pi_\theta}(s_0) \right] \\
&= \mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t r(s_t, a_t) \right] + \mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t \left( \gamma V^{\pi_\theta}(s_{t+1}) - V^{\pi_\theta}(s_t) \right) \right] \\
&= \mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t \left[ r(s_t, a_t) + \gamma V^{\pi_\theta}(s_{t+1}) - V^{\pi_\theta}(s_t) \right] \right]
\end{aligned}
$$

将时序差分残差定义为优势函数 $A$：
$$
\begin{aligned}
J(\theta') - J(\theta) &= \mathbb{E}_{\pi_{\theta'}} \left[ \sum_{t=0}^\infty \gamma^t A^{\pi_\theta}(s_t, a_t) \right] \\
&= \sum_{t=0}^\infty \gamma^t \mathbb{E}_{s_t \sim P_t^{\pi_{\theta'}}} \mathbb{E}_{a_t \sim \pi_{\theta'}(\cdot | s_t)} \left[ A^{\pi_\theta}(s_t, a_t) \right] \\
&= \frac{1}{1-\gamma} \mathbb{E}_{s \sim \nu^{\pi_{\theta'}}} \mathbb{E}_{a \sim \pi_{\theta'}(\cdot | s)} \left[ A^{\pi_\theta}(s, a) \right]
\end{aligned}
$$


最后一个等号的成立运用到了状态访问分布的定义：$\nu^\pi(s) = (1-\gamma)\sum_{t=0}^\infty \gamma^t P_t^\pi(s)$，所以只要能找到一个新策略，使得
$$
\mathbb{E}_{s \sim \nu^{\pi_{\theta'}}} \mathbb{E}_{a \sim \pi_{\theta'}(\cdot | s)} \left[ A^{\pi_\theta}(s, a) \right] \geq 0，
$$

就能保证策略性能单调递增，即 $J(\theta') \geq J(\theta)$。

但是直接求解该式是非常困难的，因为 $\pi_{\theta'}$ 是需要求解的策略，但又需要用它来收集样本。把所有可能的新策略都拿来收集数据，然后判断哪个策略满足上述条件的做法显然是不现实的。
于是 TRPO 做了一步近似操作，对状态访问分布进行了相应处理。具体而言，忽略两个策略之间的状态访问分布变化，直接采用旧的策略 $\pi_\theta$ 的状态分布，定义如下替代优化目标：
$$
L_\theta(\theta') = J(\theta) + \frac{1}{1-\gamma} \mathbb{E}_{s \sim \nu^{\pi_\theta}} \mathbb{E}_{a \sim \pi_{\theta'}(\cdot | s)} \left[ A^{\pi_\theta}(s, a) \right]
$$

当新旧策略非常接近时，状态访问分布变化很小，这么近似是合理的。其中，动作仍然用新策略 $\pi_{\theta'}$ 采样得到，我们可以用重要性采样对动作分布进行处理：
$$
L_\theta(\theta') = J(\theta) + \mathbb{E}_{s \sim \nu^{\pi_\theta}} \mathbb{E}_{a \sim \pi_\theta(\cdot | s)} \left[ \frac{\pi_{\theta'}(a | s)}{\pi_\theta(a | s)} A^{\pi_\theta}(s, a) \right]
$$

这样，就可以基于旧策略 $\pi_\theta$ 已经采样出的数据来估计并优化新策略 $\pi_{\theta'}$ 了。为了保证新旧策略足够接近，TRPO 使用了库尔贝克-莱布勒（Kullback-Leibler, KL）散度来衡量策略之间的距离，并给出了整体的优化公式：
$$
\begin{aligned}
& \max_{\theta'} \ L_\theta(\theta') \\
& \text{s.t. } \ \mathbb{E}_{s \sim \nu^{\pi_{\theta_k}}} \left[ D_{KL}\big(\pi_{\theta_k}(\cdot | s), \pi_{\theta'}(\cdot | s)\big) \right] \leq \delta
\end{aligned}
$$

这里的不等式约束定义了策略空间中的一个 KL 球，被称为信任区域。在这个区域中，可以认为当前学习策略和环境交互的状态分布与上一轮策略最后采样的状态分布一致，进而可以基于一步行动的重要性采样方法使当前学习策略稳定提升。TRPO 背后的原理如图 11-1 所示。


## 2. 近似求解

直接求解上式带约束的优化问题比较麻烦，TRPO 在其具体实现中做了一步近似操作来快速求解。为方便起见，我们在接下来的式子中用 $\theta_k$ 代替之前的 $\theta$，表示这是第 $k$ 次迭代之后的策略。首先对目标函数和约束在 $\theta_k$ 进行泰勒展开，分别用 1 阶、2 阶进行近似：
$$
\begin{aligned}
\mathbb{E}_{s \sim \nu^{\pi_{\theta_k}}} \mathbb{E}_{a \sim \pi_{\theta_k}(\cdot | s)} \left[ \frac{\pi_{\theta'}(a | s)}{\pi_{\theta_k}(a | s)} A^{\pi_{\theta_k}}(s, a) \right] &\approx g^T (\theta' - \theta_k) \\
\mathbb{E}_{s \sim \nu^{\pi_{\theta_k}}} \left[ D_{KL}\big(\pi_{\theta_k}(\cdot | s), \pi_{\theta'}(\cdot | s)\big) \right] &\approx \frac{1}{2} (\theta' - \theta_k)^T H (\theta' - \theta_k)
\end{aligned}
$$

其中 $g = \nabla_{\theta'} \mathbb{E}_{s \sim \nu^{\pi_{\theta_k}}} \mathbb{E}_{a \sim \pi_{\theta_k}(\cdot | s)} \left[ \frac{\pi_{\theta'}(a | s)}{\pi_{\theta_k}(a | s)} A^{\pi_{\theta_k}}(s, a) \right] $，表示目标函数的梯度，
$H = \mathbf{H}[\mathbb{E}_{s \sim \nu^{\pi_{\theta_k}}} [D_{KL}(\pi_{\theta_k}(\cdot | s), \pi_{\theta'}(\cdot | s))]]$ 表示策略之间平均 KL 距离的黑塞矩阵（Hessian matrix）。

于是优化目标变成了：
$$
\begin{aligned}
\theta_{k+1} &= \arg \max_{\theta'} g^T (\theta' - \theta_k)  \\
\text{s.t.} &\quad \frac{1}{2} (\theta' - \theta_k)^T H (\theta' - \theta_k) \leq \delta
\end{aligned}
$$

此时，我们可以用卡罗需-库恩-塔克（Karush-Kuhn-Tucker, KKT）条件直接导出上述问题的解：
$$
\theta_{k+1} = \theta_k + \sqrt{\frac{2\delta}{g^T H^{-1} g}} H^{-1} g
$$

## 3. 共轭梯度法

一般来说，用神经网络表示的策略函数的参数数量都是成千上万的，计算和存储黑塞矩阵 $H$ 的逆矩阵会耗费大量的内存资源和时间。
TRPO 通过共轭梯度法（conjugate gradient method）回避了这个问题，它的核心思想是直接计算 $x = H^{-1} g$，$x$ 即参数更新方向。
假设满足 KL 距离约束的参数更新时的最大步长为 $\beta$，于是，根据 KL 距离约束条件，有 $\frac{1}{2} (\beta x)^T H (\beta x) = \delta$。
求解 $\beta$，得到 $\beta = \sqrt{\frac{2\delta}{x^T H x}}$。因此，此时参数更新方式为
$$
\theta_{k+1} = \theta_k + \sqrt{\frac{2\delta}{x^T H x}} x
$$

因此，只要可以直接计算 $x = H^{-1} g$，就可以根据该式更新参数，问题转化为解 $H x = g$。实际上 $H$ 为对称正定矩阵，所以我们可以用共轭梯度法来求解。
共轭梯度法的具体流程如下：

- 初始化 $r_0 = g - H x_0$，$p_0 = r_0$，$x_0 = 0$
- for $k = 0 \to N$ do：
  - $\alpha_k = \frac{r_k^T r_k}{p_k^T H p_k}$
  - $x_{k+1} = x_k + \alpha_k p_k$
  - $r_{k+1} = r_k - \alpha_k H p_k$
  - 如果 $r_{k+1}^T r_{k+1}$ 非常小，则退出循环
  - $\beta_k = \frac{r_{k+1}^T r_{k+1}}{r_k^T r_k}$
  - $p_{k+1} = r_{k+1} + \beta_k p_k$
- end for
- 输出 $x_{N+1}$

在共轭梯度运算过程中，直接计算 $\alpha_k$ 和 $r_{k+1}$ 需要计算和存储海森矩阵 $H$。为了避免这种大矩阵的出现，我们只计算 $H x$ 向量，而不直接计算和存储 $H$ 矩阵。这样做比较容易，因为对于任意的列向量 $v$，容易验证：
$$
Hv = \nabla_\theta \left( \left( \nabla_\theta (D_{KL}^{\nu^{\pi_{\theta_k}}}(\pi_{\theta_k}, \pi_{\theta'})) \right)^T \right) v = \nabla_\theta \left( \left( \nabla_\theta (D_{KL}^{\nu^{\pi_{\theta_k}}}(\pi_{\theta_k}, \pi_{\theta'})) \right)^T v \right)
$$

即先用梯度和向量 $v$ 点乘后计算梯度。


## 4. 线搜索求解

由于 TRPO 算法用到了泰勒展开的 1 阶和 2 阶近似，这并非精准求解，因此，$\theta'$ 可能未必比 $\theta_k$ 好，或未必能满足 KL 散度限制。TRPO 在每次迭代的最后进行一次线性搜索（Line Search），以确保找到满足条件的参数。具体来说，就是找到一个最小的非负整数 $i$，使得按照
$$
\theta_{k+1} = \theta_k + \alpha^i \sqrt{\frac{2\delta}{x^T H x}} x
$$

求出的 $\theta_{k+1}$ 依然满足最初的 KL 散度限制，并且确实能够提升目标函数 $L_{\theta_k}$，这其中 $\alpha \in (0, 1)$ 是一个决定线性搜索长度的超参数。

至此，我们已经基本上清楚了 TRPO 算法的大致过程，它具体的算法流程如下：

- 初始化策略网络参数 $\theta$，价值网络参数 $\omega$
- for 序列 $e = 1 \to E$ do：
  - 用当前策略 $\pi_\theta$ 采样轨迹 $\{s_1, a_1, r_1, s_2, a_2, r_2, \dots\}$
  - 根据收集到的数据和价值网络估计每个状态动作对的优势 $A(s_t, a_t)$
  - 计算策略目标函数的梯度 $g$
  - 用共轭梯度法计算 $x = H^{-1} g$
  - 用线性搜索找到一个 $i$ 值，并更新策略网络参数 $\theta_{k+1} = \theta_k + \alpha^i \sqrt{\frac{2\delta}{x^T H x}} x$，其中 $i \in \{1, 2, \dots, K\}$ 为能提升策略并满足 KL 距离限制的最小整数
  - 更新价值网络参数（与 Actor-Critic 中的更新方法相同）
- end for

## 5. 广义优势估计

从 11.5 节中，我们尚未得知如何估计优势函数 $A$。目前比较常用的一种方法为广义优势估计（Generalized Advantage Estimation, GAE），接下来我们简单介绍一下 GAE 的做法。首先，用 $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$ 表示时序差分误差，其中 $V$ 是一个已经学习的状态价值函数。于是，根据多步时序差分的思想，有：
$$
\begin{aligned}
A_t^{(1)} &= \delta_t \\
&= -V(s_t) + r_t + \gamma V(s_{t+1}) \\
A_t^{(2)} &= \delta_t + \gamma \delta_{t+1} \\
&= -V(s_t) + r_t + \gamma r_{t+1} + \gamma^2 V(s_{t+2}) \\
A_t^{(3)} &= \delta_t + \gamma \delta_{t+1} + \gamma^2 \delta_{t+2} \\
&= -V(s_t) + r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \gamma^3 V(s_{t+3}) \\
&\vdots \\
A_t^{(k)} &= \sum_{l=0}^{k-1} \gamma^l \delta_{t+l} \\
&= -V(s_t) + r_t + \gamma r_{t+1} + \ldots + \gamma^{k-1} r_{t+k-1} + \gamma^k V(s_{t+k})
\end{aligned}
$$

然后，GAE 将这些不同步数的优势估计进行指数加权平均：
$$
\begin{aligned}
A_t^{GAE} &= (1-\lambda)(A_t^{(1)} + \lambda A_t^{(2)} + \lambda^2 A_t^{(3)} + \cdots) \\
&= (1-\lambda)(\delta_t + \lambda(\delta_t + \gamma \delta_{t+1}) + \lambda^2(\delta_t + \gamma \delta_{t+1} + \gamma^2 \delta_{t+2}) + \cdots) \\
&= (1-\lambda)\big(\delta(1+\lambda+\lambda^2+\cdots) + \gamma \delta_{t+1}(\lambda+\lambda^2+\lambda^3+\cdots) + \gamma^2 \delta_{t+2}(\lambda^2+\lambda^3+\lambda^4+\cdots) + \cdots\big) \\
&= (1-\lambda)\left(\delta_t \frac{1}{1-\lambda} + \gamma \delta_{t+1} \frac{\lambda}{1-\lambda} + \gamma^2 \delta_{t+2} \frac{\lambda^2}{1-\lambda} + \cdots\right) \\
&= \sum_{l=0}^\infty (\gamma \lambda)^l \delta_{t+l}
\end{aligned}
$$

其中，$\lambda \in [0, 1]$ 是在 GAE 中额外引入的一个超参数。当 $\lambda = 0$ 时，$A_t^{GAE} = \delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$，也即是仅仅只看一步差分得到的优势；当 $\lambda = 1$ 时，$A_t^{GAE} = \sum_{l=0}^\infty \gamma^l \delta_{t+l} = \sum_{l=0}^\infty \gamma^l r_{t+l} - V(s_t)$，则是看每一步差分得到优势的完全平均值。

