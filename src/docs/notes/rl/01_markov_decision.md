# Markov Decision

**随机过程（stochastic process）** 是概率论的“动力学”部分。概率论是研究静态的随机现象，而随机过程是研究随时间变化的随机现象。

随机过程中，在某时刻 $t$ 的取值是一个向量随机变量，用 $S_t$ 表示，所有可能的状态组成状态集合 $S$。则 $S_{t+1}$ 的概率表示为 $P(S_{t+1} | S_t, \cdots, S_1)$。

## 1. 马尔可夫过程

### 1.1 马尔可夫性质
$P(S_{t+1} | S_t) = P(S_{t+1} | S_t, \cdots, S_1)$，即下一个状态只取决于当前状态，而不会受到过去状态的影响。

### 1.2 马尔可夫过程
**马尔可夫过程（Markov process）** 指具有马尔可夫性质的随机过程，也被称为马尔可夫链（Markov chain）。

用元组 $(S, P)$ 来描述一个马尔可夫过程，其中，$S$ 为有限数量的状态集合，$P$ 为状态转移矩阵（state transition matrix）。
$P_{ij} = P(s_j | s_i) = P(S_{t+1}=s_j | S_t=s_i)$ 表示从状态 $s_i$ 转移到状态 $s_j$ 的概率

给定一个马尔可夫过程，从某个状态出发，根据它的状态转移矩阵生成一个**状态序列（episode）**，这个步骤也被叫做**采样（sampling）**。

## 2. 马尔可夫奖励过程

在马尔可夫过程的基础上加入奖励函数 $r$ 和折扣因子 $\gamma$，就可以得到马尔可夫奖励过程（Markov reward process）。即，一个马尔可夫奖励过程由 $(S, P, r, \gamma)$ 构成。

- $r$ 是奖励函数，某个状态 $s$ 的奖励 $r(s)$ 是指转移到该状态时可以获得奖励的期望；
- $\gamma$ 是折扣因子（discount factor），取值范围为 $[0, 1)$。

### 2.1 回报
马尔可夫奖励过程中，从第 $t$ 时刻状态 $S_t$ 开始，直到终止状态时，所有奖励的衰减之和称为回报$G_t$（Return）。

$$
G_t = R_t + \gamma R_{t+1} + \gamma ^2 R_{t+2} + \cdots = \sum_{k=0}^{K} \gamma ^k R_{t+k}
$$

### 2.2 价值函数

马尔可夫奖励过程中，一个状态的期望回报（即从这个状态出发的未来累积奖励的期望）被称为这个状态的价值（value）。所有状态的价值就组成了价值函数（value function）。
即，$V(s) = \mathbb{E} [G_t | S_t=s]$，展开为：

$$
\begin{aligned}
V(s) &= \mathbb{E} [G_t | S_t=s] \\
&= \mathbb{E} [R_t + \gamma R_{t+1} + \gamma ^2 R_{t+2} + \cdots | S_t=s] \\
&= \mathbb{E} [R_t + \gamma G_{t+1} | S_t=s] \\
&= \mathbb{E} [R_t + \gamma\mathbb{E}[G_{t+1} | S_{t+1}] | S_t=t]~~~~(G_{t+1} 仅依赖于 S_{t+1}) \\
&= \mathbb{E} [R_t + \gamma V(S_{t+1}) | S_t=s]
\end{aligned}
$$

因此，奖励函数的输出可以分成两个部分，一部分为即时奖励的输出，也就是奖励函数的输出 $R_t$；另一部分，等式中剩余部分 $\mathbb{E} [\gamma V(S_{t+1}) | S_t=s]$ 可以根据从状态出发的转移概率得到，于是可以写成
（补充知识点：$\mathbb{E}[f(X) | Y=y] = \int_{-\infty}^{\infty} f(x) \cdot p(x|y) \, dx$）：

::: danger Bellman equation
$$V(s) = r(s) + \gamma \sum_{s' \in S} p(s'|s) V(s')$$
:::

上式就是 **贝尔曼方程（Bellman equation）**。
假设一个马尔可夫奖励过程一共有 $n$ 个状态，即 $S=\{s_1, s_2, \cdots, s_n\}$，将所有状态的价值表示成一个列向量 $V=[V(s_1), V(s_2), \cdots, V(s_n)]^T$，
同理，将奖励函数写成一个列向量 $R=[r(s_1), r(s_2), \cdots, r(s_n)]$。于是可以将贝尔曼方程写成矩阵的形式：

$$V = R + \gamma PV$$ 
$$
\left[
\begin{matrix}
V(s_1) \\
V(s_2) \\
\vdots \\
V(s_n)
\end{matrix}
\right] =
\left[
\begin{matrix}
r(s_1) \\
r(s_2) \\
\vdots \\
r(s_n)
\end{matrix}
\right] + \gamma
\left[
\begin{matrix}
P(s_1|s_1) & P(s_2|s_1) & \cdots & P(s_n|s_1) \\
P(s_1|s_2) & P(s_2|s_2) & \cdots & P(s_n|s_2) \\
\vdots & \vdots & \ddots & \vdots \\
P(s_1|s_n) & P(s_2|s_n) & \cdots & P(s_n|s_n)
\end{matrix}
\right]
\left[
\begin{matrix}
V(s_1) \\
V(s_2) \\
\vdots \\
V(s_n)
\end{matrix}
\right]
$$

从而可以求的解析解为： $V = (I-\gamma P)^{-1}R$。

注：以上解析解的计算复杂度为 $O(n^3)$，只适用于较小的马尔可夫奖励过程。常用解法有：动态规划、蒙特卡洛、时序差分算法。

## 3. 马尔可夫决策过程

马尔可夫决策过程（Markov decision process，MDP）由元组 $(S, A, P, r, \gamma)$ 构成。

- $r(s,a)$ 是奖励函数，此时奖励可以同时取决于状态 $s$ 和动作 $a$.
- $P(s' | s, a)$ 是状态转移函数，表示在状态 $s$ 执行动作 $a$ 之后到达状态 $s'$ 的概率。

例：小船随机飘荡（无动作）是马尔可夫奖励过程；小船被控制前进（有动作）是马尔可夫决策过程。

![](/imgs/notes/rl/markov/mdp.png)

### 3.1 策略
智能体的策略（policy）$\pi(a | s) = P(A_t=a | S_t=s)$ 表示在输入状态 $s$ 情况下采取动作 $a$ 的概率.

### 3.2 价值函数

1. 状态价值函数：
用 $V^{\pi}(s)$ 表示在 MDP 中基于策略的状态价值函数（state-value function），定义为从状态 $s$ 出发遵循策略 $\pi$ 能获得的期望回报.
$$
V^{\pi}(s) = \mathbb{E}_{\pi}[G_t|S_t=s]
$$

2. 动作价值函数：
用 $Q^{\pi}(s,a)$ 表示在 MDP 遵循策略时，对当前状态 $s$ 执行动作 $a$ 得到的期望回报:
$$
Q^{\pi}(s, a) = \mathbb{E}_{\pi} [G_t | S_t=s, A_t=a]
$$

3. 状态价值函数与动作价值函数的关系：
- 在使用策略 $\pi$ 时，状态 $s$ 的价值等于在该状态下基于策略 $\pi$ 采取所有动作的概率与相应的价值相乘再求和的结果：
$$V^{\pi}(s) = \sum_{a\in A}\pi(a|s) Q^{\pi}(s)$$
- 使用策略 $\pi$ 时，状态 $s$ 下采取动作 $a$ 的价值等于即时奖励加上经过衰减后的所有可能的下一个状态的状态转移概率与相应的价值的乘积:
$$Q^{\pi}(s, a) = r(s, a) + \gamma \sum_{s'\in S}P(s'|s, a) V^{\pi}(s')$$

### 3.3 贝尔曼期望方程（Bellman Expectation Equation）

$$
\begin{aligned}
V^{\pi}(s) &= \mathbb{E}_{\pi}[R_t + \gamma V^{\pi}(S_{t+1}) \mid S_t = s] \\
&= \sum_{a \in A} \pi(a|s) \left(r(s,a) + \gamma \sum_{s' \in S} p(s'|s,a) V^{\pi}(s') \right) \\
Q^{\pi}(s,a) &= \mathbb{E}_{\pi}[R_t + \gamma Q^{\pi}(S_{t+1},A_{t+1}) \mid S_t = s, A_t = a] \\
&= r(s,a) + \gamma \sum_{s' \in S} p(s'|s,a) \sum_{a' \in A} \pi(a'|s') Q^{\pi}(s',a').
\end{aligned}
$$

### 3.4 最优策略（optimal policy）
强化学习的目标：找到一个策略，使得智能体从初始状态出发能获得最多的期望回报。

定义策略间的偏序关系：当且仅当对于任意的状态都有 $s$ 都有 $V^{\pi}(s)\geq V^{\pi '}(s)$，记 $\pi \geq \pi '$。
在有限状态和动作集合的 MDP 中，至少存在一个策略优于或不差于其他所有策略，这个策略就是最优策略（optimal policy），记为 $\pi^*(s)$。

最优策略都有相同的状态价值函数，称为**最优状态价值函数**，同理有**最优动作价值函数**，分别表示为：

$$
\begin{aligned}
V^*(s) &= \max_{\pi} V^{\pi}(s) \\
Q^*(s,a) &= \max_{\pi} Q^{\pi}(s, a)
\end{aligned}
$$

为了使 $Q^{\pi}(s, a)$ 最大，需要在当前的状态动作对之后都执行最优策略，另一方面，最优状态价值是选择此时使最优动作价值最大的那一个动作时的状态价值：
$$
\begin{aligned}
Q^*(s, a) &= r(s, a) + \gamma \sum_{s'\in S}P(s'|s, a) V^*(s') \\
V^*(s) &= \max_{a \in A} Q^*(s, a)
\end{aligned}
$$

根据 $V^*(s)$ 和 $Q^*(s, a)$ 的关系，可以得到贝尔曼最优方程（Bellman optimality equation）:

$$
\begin{aligned}
V^*(s) &= \max_{a \in A} \left\{ r(s,a) + \gamma \sum_{s' \in S} p(s' \mid s, a) V^*(s') \right\} \\
Q^*(s,a) &= r(s,a) + \gamma \sum_{s' \in S} p(s' \mid s, a) \max_{a' \in A} Q^*(s', a')
\end{aligned}
$$