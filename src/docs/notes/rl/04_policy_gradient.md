# Policy Gradient

前面提到的 Q-learning、DQN 都是基于价值（value-based）的方法，其中 Q-learning 是处理有限状态的算法，
而 DQN 可以用来解决连续状态的问题。本文的策略梯度算法是基于策略（policy-based）的方法。

- Value Based：学习值函数，然后根据值函数导出一个策略，学习过程中并不存在一个显式的策略；
- Policy Based：直接显式地学习一个目标策略。


::: tip
Trajectory: 智能体在环境中从初始状态开始，按照某个策略进行决策所产生的一条完整的状态-动作序列;
Episode: 从一个初始状态开始，到某个终止状态结束的一个完整交互过程
轨迹（Trajectory）是一个回合（episode）中每个状态以及对应状态下采取的动作所构成的序列。
:::

对于 policy 网络 $\pi_\theta$，输入 observation，输出 action 的概率。轨迹 $\tau = (s_1, a_1, s_2, a_2, \dots, s_T, a_T)$ 发生的概率为：

$$
\begin{aligned}
p_\theta(\tau) &= p_\theta(s_1, a_1, \ldots, s_T, a_T) \\
&= p(s_1) p_\theta(a_1 | s_1) p(s_2 | s_1, a_1) p_\theta(a_2 | s_2) p(s_3 | s_2, a_2) \ldots \\
&= p(s_1) \prod_{t=1}^{T} p_\theta(a_t | s_t) p(s_{t+1} | s_t, a_t)
\end{aligned}
$$

其中，$p_\theta(a_t, s_t)$ 是策略部分，与参数 $\theta$ 相关，$p(s_{t+1} | a_t, s_t)$ 是环境动力学部分，与参数 $\theta$ 无关。

对于这个单条轨迹的 Reward 为：

$$
R(\tau) = \sum_t r_t = \sum_t r(s_t, a_t)
$$

对 policy 的 Expected Reward 为：

$$
\bar{R}_\theta = \sum_\tau R(\tau) p_\theta(\tau) = \mathbb{E}_{\tau \sim p_\theta(\tau)}[R(\tau)]
$$

Policy-based 方法的目标就是找到一个最优的 policy 参数 $\theta^*$ 使得期望奖励最大化。

$$
\theta^* = \arg\max_\theta \bar{R}_\theta = \arg\max_\theta \mathbb{E}_{\tau \sim p_\theta(\tau)} \left[ \sum_t r(s_t, a_t) \right]
$$

令 $\bar{R}_\theta = J(\theta)$，则目标函数为：

$$
J(\theta) = \mathbb{E}_{\tau \sim p_\theta(\tau)}[R(\tau)] = \int p_\theta(\tau) R(\tau) d\tau
$$

基于采样可得：

$$
J(\theta) = \mathbb{E}_{\tau \sim p_\theta(\tau)} \left[ \sum_{t=1}^T r(s_t, a_t) \right] \approx \frac{1}{N} \sum_{n=1}^N \sum_{t=1}^T r(s_t^n, a_t^n)
$$

解决上述优化问题常用最速下降法，这里称为策略梯度（Policy Gradient）或者策略优化（Policy Optimization）。对目标函数 $ J(\theta) $ 进行求导：

$$
\nabla_\theta J(\theta) = \int \nabla_\theta p_\theta(\tau) \, R(\tau) \, d\tau
$$

由于对概率 $ p_\theta(\tau) = p(s_1) \prod_{t=1}^T p_\theta(a_t | s_t) \, p(s_{t+1} | s_t, a_t) $ 求导非常困难。为方便求导，可引入以下公式：

$$
\nabla_\theta p_\theta(\tau) = p_\theta(\tau) \frac{\nabla_\theta p_\theta(\tau)}{p_\theta(\tau)} = p_\theta(\tau) \nabla_\theta \log p_\theta(\tau)
$$

因而，$ J(\theta) $ 的导数可写成以下形式：

$$
\nabla_\theta J(\theta) = \int \nabla_\theta p_\theta(\tau) \, R(\tau) \, d\tau = \int p_\theta(\tau) \nabla_\theta \log p_\theta(\tau) \, R(\tau) \, d\tau = \mathbb{E}_{\tau \sim p_\theta(\tau)}[\nabla_\theta \log p_\theta(\tau) \, R(\tau)]
$$

对 $ p_\theta(\tau) = p(s_1) \prod_{t=1}^T p_\theta(a_t | s_t) \, p(s_{t+1} | s_t, a_t) $ 两边取 log 有：

$$
\log p_\theta(\tau) = \log p(s_1) + \sum_{t=1}^T \left[\log p_\theta(a_t | s_t) + \log p(s_{t+1} | s_t, a_t)\right]
$$

对 $\log p_\theta(\tau)$ 求导，其中第一项和第三项与 $\theta$ 无关，导数为零，因此可得：

$$
\nabla_\theta \log p_\theta(\tau) = \nabla_\theta \sum_{t=1}^T \log p_\theta(a_t | s_t)
$$

即：

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim p_\theta(\tau)} \left[ \nabla_\theta \sum_{t=1}^T \log p_\theta(a_t | s_t) \, R(\tau) \right]
= \mathbb{E}_{\tau \sim p_\theta(\tau)} \left[ \left( \sum_{t=1}^T \nabla_\theta \log p_\theta(a_t | s_t) \right) R(\tau) \right]
$$

上式很难求得解析解，因而可基于采样进行求解：

$$
\begin{aligned}
\nabla_\theta J(\theta) &\approx \frac{1}{N} \sum_{n=1}^N \left( \sum_{t=1}^T \nabla_\theta \log p_\theta(a_t^n | s_t^n) \right) R(\tau^n)  \\
&\approx \frac{1}{N} \sum_{n=1}^N \left( \sum_{t=1}^T \nabla_\theta \log p_\theta(a_t^n | s_t^n) \right) \left( \sum_{t=1}^T r(s_t^n, a_t^n) \right)  \\
&\approx \frac{1}{N} \sum_{n=1}^N \nabla_\theta \log P(\tau^n, \theta) \, R(\tau^n)
\end{aligned}
$$

最后，使用梯度上升（Gradient Ascent）对参数 $\theta$ 进行更新：

$$
\theta \leftarrow \theta + \alpha \nabla_\theta J(\theta)
$$


采用前文的符号定义：
---
将此策略学习的目标函数定义为：

$$
J(\theta) = \mathbb{E}_{s_0}[V^{\pi_\theta}(s_0)]
$$

其中，$s_0$ 表示初始状态。根据目标函数对策略的参数 $\theta$ 求导，然后用梯度上升方法来最大化这个目标函数，从而得到最优策略。下面是求导过程：

$$
\begin{aligned}
\nabla_{\theta} V^{\pi_{\theta}}(s) &= \nabla_{\theta} \left( \sum_{a \in A} \pi_{\theta}(a | s) Q^{\pi_{\theta}}(s, a) \right) \\
&= \sum_{a \in A} \left( \nabla_{\theta} \pi_{\theta}(a | s) Q^{\pi_{\theta}}(s, a) + \pi_{\theta}(a | s) \nabla_{\theta} Q^{\pi_{\theta}}(s, a) \right) \\
&= \sum_{a \in A} \left( \nabla_{\theta} \pi_{\theta}(a | s) Q^{\pi_{\theta}}(s, a) + \pi_{\theta}(a | s) \nabla_{\theta} (r(s, a) + \gamma \sum_{s'} p(s' | s, a) V^{\pi_{\theta}}(s')) \right) \\
&= \sum_{a \in A} \left( \nabla_{\theta} \pi_{\theta}(a | s) Q^{\pi_{\theta}}(s, a) + \gamma \pi_{\theta}(a | s) \sum_{s'} p(s' | s, a) \nabla_{\theta} V^{\pi_{\theta}}(s') \right)
\end{aligned}
$$

为了简化表示，让第一项表示为 $\phi(s)$，定义 $d^{\pi_{\theta}}(s \rightarrow x, k)$ 为策略 $\pi$ 从状态 $s$ 出发，经 $k$ 步后到达状态 $s$ 的概率。则有：

$$
\begin{aligned}
\nabla_{\theta} V^{\pi_{\theta}}(s) &= \phi(s) + \gamma \sum_a \pi_{\theta}(a | s) \sum_{s'} P(s' | s, a) \nabla_{\theta} V^{\pi_{\theta}}(s') \\
&= \phi(s) + \gamma \sum_a \sum_{s'} \pi_{\theta}(a | s) P(s' | s, a) \nabla_{\theta} V^{\pi_{\theta}}(s') \\
&= \phi(s) + \gamma \sum_{s'} d^{\pi_{\theta}}(s \to s', 1) \nabla_{\theta} V^{\pi_{\theta}}(s') \\
&= \phi(s) + \gamma \sum_{s'} d^{\pi_{\theta}}(s \to s', 1) [\phi(s') + \gamma \sum_{s''} d^{\pi_{\theta}}(s' \to s'', 1) \nabla_{\theta} V^{\pi_{\theta}}(s'')] \\
&= \phi(s) + \gamma \sum_{s'} d^{\pi_{\theta}}(s \to s', 1) \phi(s') + \gamma^2 \sum_{s''} d^{\pi_{\theta}}(s \to s'', 2) \nabla_{\theta} V^{\pi_{\theta}}(s'') \\
&= \phi(s) + \gamma \sum_{s'} d^{\pi_{\theta}}(s \to s', 1) \phi(s') + \gamma^2 \sum_{s''} d^{\pi_{\theta}}(s' \to s'', 2) \phi(s'') + \gamma^3 \sum_{s'''} d^{\pi_{\theta}}(s \to s''', 3) \nabla_{\theta} V^{\pi_{\theta}}(s''') \\
&= \cdots \\
&= \sum_{x \in S} \sum_{k=0}^{\infty} \gamma^k d^{\pi_{\theta}}(s \to x, k) \phi(x)
\end{aligned}
$$

定义 $\eta(s) = \mathbb{E}_{s_0} \left[ \sum_{k=0}^{\infty} \gamma^k d^{\pi_{\theta}}(s_0 \to s, k) \right]$，则目标函数：

$$
\begin{aligned}
\nabla_{\theta} J(\theta) &= \nabla_{\theta} \mathbb{E}_{s_0}[V^{\pi_{\theta}}(s_0)] \\
&= \sum_s \mathbb{E}_{s_0} \left[ \sum_{k=0}^{\infty} \gamma^k d^{\pi_{\theta}}(s_0 \to s, k) \right] \phi(s) \\
&= \sum_s \eta(s) \phi(s) \\
&= \left( \sum_s \eta(s) \right) \sum_s \frac{\eta(s)}{\sum_s \eta(s)} \phi(s) \\
&\propto \sum_s \frac{\eta(s)}{\sum_s \eta(s)} \phi(s) \\
&= \sum_s \nu^{\pi_{\theta}}(s) \sum_a Q^{\pi_{\theta}}(s, a) \nabla_{\theta} \pi_{\theta}(a | s)
\end{aligned}
$$

于是有：

$$
\begin{aligned}
\nabla_{\theta} J(\theta) & \propto \sum_{s \in S} \nu^{\pi_{\theta}}(s) \sum_{a \in A} Q^{\pi_{\theta}}(s, a) \nabla_{\theta} \pi_{\theta}(a | s) \\
& = \sum_{s \in S} \nu^{\pi_{\theta}}(s) \sum_{a \in A} \pi_{\theta}(a | s) Q^{\pi_{\theta}}(s, a) \frac{\nabla_{\theta} \pi_{\theta}(a | s)}{\pi_{\theta}(a | s)} \\
& = \mathbb{E}_{\pi_{\theta}}[Q^{\pi_{\theta}}(s, a) \nabla_{\theta} \log \pi_{\theta}(a | s)]
\end{aligned}
$$

::: tip
注意：上式中期望的下标是 $\pi_{\theta}$，所以策略梯度算法为在线策略（on-policy）算法，即：必须**使用当前策略采样得到的数据来计算梯度**。
:::

在计算策略梯度的公式中，需要用到 $Q^{\pi_{\theta}}(s, a)$，可以用多种方式对它进行估计。
如 REINFORCE 算法采用蒙特卡洛方法来估计，对于一个有限步数的环境，REINFORCE 算法中的策略梯度为：

$$
\nabla_{\theta} J(\theta) = \mathbb{E}_{\pi_{\theta}} \left[ \sum_{t=0}^{T} \left( \sum_{t'=t}^{T} \gamma^{t'-t} r_{t'} \right) \nabla_{\theta} \log \pi_{\theta}(a_t | s_t) \right]
$$

REINFORCE 算法具体流程：
- 初始化策略参数 $\theta$
- for 序列 $e = 1 \to E$ do：
   - 用当前策略 $\pi_{\theta}$ 采样轨迹 $\{s_1, a_1, r_1, s_2, a_2, r_2, \dots, s_T, a_T, r_T\}$
   - 计算当前轨迹每个时刻 $t$ 往后的回报 $\sum_{t'=t}^{T} \gamma^{t'-t} r_{t'}$，记为 $\psi_t$
   - 对 $\theta$ 进行更新：$\theta = \theta + \alpha \sum_{t=1}^{T} \psi_t \nabla_{\theta} \log \pi_{\theta}(a_t | s_t)$
- end for