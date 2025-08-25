# Proximal Policy Optimization

[Paper](https://arxiv.org/pdf/1707.06347)


策略梯度（Policy Gradient）：

通过使用随机梯度上升来计算策略梯度的估计器。其梯度估计器如下：
$$
\hat{g} = \widehat{\mathbb{E}}_t \left[ \nabla_\theta \log \pi_\theta(a_t \mid s_t) \hat{A}_t \right]
$$

其中，$\pi_\theta$ 是一个随机策略，$\hat{A}_t$ 表示在时间步 $t$ 处优势函数的估计器。期望 $\widehat{\mathbb{E}}_t[\ldots]$ 表示对一个 batch 采样的经验平均值。估计器 $\hat{g}$ 是如下目标函数的导数：
$$
L^{PG}(\theta) = \widehat{\mathbb{E}}_t \left[ \log \pi_\theta(a_t \mid s_t) \hat{A}_t \right].
$$



TRPO中，

TRPO 的目标函数在策略更新大小的约束下被最大化。具体为：
$$
\begin{aligned}
\text{maximize}_{\theta} \quad &\widehat{\mathbb{E}}_t \left[ \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} \hat{A}_t \right] \\
\text{subject to} \quad &\widehat{\mathbb{E}}_t[\text{KL}[\pi_{\theta_{\text{old}}}(\cdot \mid s_t), \pi_\theta(\cdot \mid s_t)]] \leq \delta.
\end{aligned}
$$

这里，$\theta_{\text{old}}$ 是更新前的策略参数。通过将目标函数线性化并用二次近似表示约束条件，该问题可以高效地使用共轭梯度算法近似求解。通过拉格朗日乘子法将约束优化改为无约束优化：
$$
\text{maximize}_{\theta} \widehat{\mathbb{E}}_t \left[ \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} \hat{A}_t - \beta \, \text{KL}[\pi_{\theta_{\text{old}}}(\cdot \mid s_t), \pi_\theta(\cdot \mid s_t)] \right]
$$

对于某个系数 $\beta$，很难确定一个固定值，使其在不同的问题中都能表现良好，甚至在同一个问题中，随着学习过程的进行，问题的特性也会发生变化。


Clipped：

令 $r_t(\theta)$ 表示概率比 $r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)}$，因此 $r(\theta_{\text{old}}) = 1$。TRPO 最大化一个“替代”目标

$$
L^{CPI}(\theta) = \widehat{\mathbb{E}}_t \left[ \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} \hat{A}_t \right] = \widehat{\mathbb{E}}_t \left[ r_t(\theta) \hat{A}_t \right].
$$

上标 $CPI$ 指的是保守策略迭代（Conservative Policy Iteration）。如果没有约束条件，最大化 $L^{CPI}$ 将导致策略更新过大；因此，现在考虑如何修改目标，以惩罚使 $r_t(\theta)$ 偏离 1 的策略变化。如下：

$$
L^{CLIP}(\theta) = \widehat{\mathbb{E}}_t \left[ \min(r_t(\theta) \hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) \hat{A}_t) \right]
$$

其中 $\epsilon$ 是超参数，例如 $\epsilon = 0.2$。

该目标的动机如下：$\min$ 函数中的第一项是 $L^{CPI}$。第二项 $\text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) \hat{A}_t$ 通过裁剪概率比来修改替代目标，从而消除了将 $r_t$ 移出区间 $[1-\epsilon, 1+\epsilon]$ 的激励。最后，我们取裁剪和未裁剪目标的最小值，因此最终目标是对未裁剪目标的一个下界（即，悲观界）。通过这种方案，我们仅在概率比的变化会改善目标时忽略它，并在它会使目标变差时包含它。注意，$L^{CLIP}(\theta)$ 在 $\theta_{\text{old}}$ 附近的一阶近似等于 $L^{CPI}(\theta)$（即，当 $r = 1$ 时），但随着 $\theta$ 远离 $\theta_{\text{old}}$，它们变得不同。图 1 绘制了 $L^{CLIP}$ 中的一项（即，单个 $t$）；请注意，概率比 $r$ 根据优势是正还是负被裁剪为 $1-\epsilon$ 或 $1+\epsilon$。




自适应KL惩罚系数:

另一种方法，可以作为裁剪替代目标的替代方案，或者与其结合使用，是引入对 KL 散度的惩罚，并调整惩罚系数 $\beta$，以便在每次策略更新中达到某个目标值 $d_{\text{targ}}$。在我们的实验中，我们发现 KL 惩罚的表现不如裁剪替代目标，然而，我们在这里包含它是因为它是重要的基准。

在该算法的最简单实现中，我们在每次策略更新中执行以下步骤：

- 使用多个小批量 SGD 的迭代，优化带有 KL 惩罚的目标函数
$$
L^{KLPE N}(\theta) = \widehat{\mathbb{E}}_t \left[ \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)} \hat{A}_t - \beta \, \text{KL}[\pi_{\theta_{\text{old}}}(\cdot \mid s_t), \pi_\theta(\cdot \mid s_t)] \right]
$$

- 计算 $d = \widehat{\mathbb{E}}_t[\text{KL}[\pi_{\theta_{\text{old}}}(\cdot \mid s_t), \pi_\theta(\cdot \mid s_t)]]$

  - 如果 $d < d_{\text{targ}} / 1.5$，则 $\beta \gets \beta / 2$
  - 如果 $d > d_{\text{targ}} \times 1.5$，则 $\beta \gets \beta \times 2$

更新后的 $\beta$ 用于下一次策略更新。通过这种方案，我们偶尔会看到 KL 散度与 $d_{\text{targ}}$ 显著不同的策略更新，但这种情况很少见，并且 $\beta$ 会快速调整。上述参数 $1.5$ 和 $2$ 是基于启发式选择的，但算法对它们并不敏感。$\beta$ 的初始值是另一个超参数，但在实践中并不重要，因为算法会快速调整它。






前几节中的替代损失可以通过对典型策略梯度实现进行一些小改动来计算和求导。对于使用自动微分的实现，只需构造损失 $L^{CLIP}$ 或 $L^{KLPE N}$ 而不是 $L^{PG}$，然后在该目标上执行多次随机梯度上升步骤。

大多数用于计算方差减少的优势函数估计器的技术都使用一个学习的状态价值函数 $V(s)$；例如，广义优势估计（Generalized Advantage Estimation）[Sch+15a]，或者 [Mni+16] 中的有限时间估计器。如果使用共享参数的神经网络架构（即策略和价值函数共享参数），我们必须使用一个结合了策略替代项和价值函数误差项的损失函数。根据以往的工作 [Wil92; Mni+16]，该目标还可以通过添加熵奖励来进一步增强，以确保足够的探索。将这些项结合起来，我们得到以下目标，该目标在每次迭代中（近似）最大化：
$$
L_t^{CLIP + VF + S}(\theta) = \widehat{\mathbb{E}}_t \left[ L_t^{CLIP}(\theta) - c_1 L_t^V(\theta) + c_2 S[\pi_\theta](s_t) \right],
$$

其中 $c_1, c_2$ 是系数，$S$ 表示熵奖励，$L_t^V$ 是平方误差损失 $(V_\theta(s_t) - V_t^\text{targ})^2$。




一种流行的策略梯度实现方式，最早在 [Mni+16] 中提出，并且非常适合与循环神经网络一起使用，是运行策略 $T$ 个时间步（其中 $T$ 远小于一个回合的长度），然后使用收集到的样本进行更新。这种实现方式需要一个优势估计器，该估计器不会超出时间步 $T$。[Mni+16] 使用的优势估计器为

$$
\hat{A}_t = -V(s_t) + r_t + \gamma r_{t+1} + \cdots + \gamma^{T-t+1} r_{T-1} + \gamma^{T-t} V(s_T)
$$

其中 $t$ 指定在给定长度为 $T$ 的轨迹片段中的时间索引，范围为 $[0, T]$。推广这一选择，我们可以使用广义优势估计（Generalized Advantage Estimation）的截断版本，当 $\lambda = 1$ 时，它退化为方程 (10)：

$$
\hat{A}_t = \delta_t + (\gamma \lambda) \delta_{t+1} + \cdots + (\gamma \lambda)^{T-t+1} \delta_{T-1},
$$

其中
$$
\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t).
$$

使用固定长度轨迹片段的近端策略优化（Proximal Policy Optimization, PPO）算法如下所示：每次迭代，每个 $N$ 个（并行）执行者收集 $T$ 个时间步的数据。然后，我们基于这些 $NT$ 个时间步的数据构建替代损失，并使用小批量 SGD（或者为了获得更好的性能，通常使用 Adam [KB14]）对其进行优化，持续 $K$ 个轮次。



![](/imgs/notes/rl/ppo/pseudo_code.png)


