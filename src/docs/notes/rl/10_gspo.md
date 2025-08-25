# Group Sequence Policy Optimization

[Paper](https://arxiv.org/pdf/2507.18071)


定义一个带有参数 $\theta$ 的策略模型 $\pi_\theta$。用 $\mathcal{D}$ 表示 query $x$ 的查询集合。查询 $x$ 的响应 $y$，其在策略 $\pi_\theta$ 下的似然性表示为：
$$
\pi_\theta(y|x) = \prod_{t=1}^{|y|} \pi_\theta(y_t|x, y_{<t})
$$

其中 $|y|$ 表示响应 $y$ 中的 token 数。一个 query-response pair $(x, y)$ 可以通过奖励函数 $r$ 进行评分，从而得到奖励 $r(x, y) \in [0, 1]$。


在 PPO 算法中：

使用下面目标函数进行策略优化（为了简洁起见，这里及后面**都省略 KL 正则化项**，它不是本节的重点）：
$$
\mathcal{J}_{\text{PPO}}(\theta) = \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_{\theta_{\text{old}}}( \cdot | x)} \left[ \frac{1}{|y|} \sum_{t=1}^{|y|} \min \left( w_t(\theta) \hat{A}_t, \text{clip} \left( w_t(\theta), 1-\varepsilon, 1+\varepsilon \right) \hat{A}_t \right) \right],
$$

其中，token $y_t$ 的重要性比率定义为 $w_t(\theta) = \frac{\pi_\theta(y_t|x, y_{<t})}{\pi_{\theta_{\text{old}}}(y_t|x, y_{<t})}$，优势 $\hat{A}_t$ 由另外一个价值模型估计，$\varepsilon$ 是一个重要性比率的剪裁范围。

PPO 在实际应用中对价值模型的依赖高。通常价值模型与策略模型具有相似的 size，会引入了较大的内存和计算负担。其次，算法的有效性也依赖于价值估计的可靠性。



对于 GRPO 算法：

通过计算同一查询下每个响应的相对优势，绕过了对价值模型的需求。具体来说，GRPO 优化以下目标函数：
$$
\mathcal{J}_{\text{GRPO}}(\theta) = \mathbb{E}_{x \sim \mathcal{D}, \{y_i\}_{i=1}^G \sim \pi_{\theta_{\text{old}}}(\cdot|x)} \left[ \frac{1}{G} \sum_{i=1}^G \frac{1}{|y_i|} \sum_{t=1}^{|y_i|} \min \left( w_{i,t}(\theta) \hat{A}_{i,t}, \text{clip} \left( w_{i,t}(\theta), 1-\varepsilon, 1+\varepsilon \right) \hat{A}_{i,t} \right) \right],
$$

其中 $G$ 是 group 大小，the importance ratio $w_{i,t}(\theta)$ 和 token $y_{i,t}$ 的优势 $\hat{A}_{i,t}$ 分别为：
$$
w_{i,t}(\theta) = \frac{\pi_\theta(y_{i,t}|x, y_{i,<t})}{\pi_{\theta_{\text{old}}}(y_{i,t}|x, y_{i,<t})}, \quad \hat{A}_{i,t} = \hat{A}_i = \frac{r(x, y_i) - \text{mean} \left( \{ r(x, y_i) \}_{i=1}^G \right)}{\text{std} \left( \{ r(x, y_i) \}_{i=1}^G \right)},
$$

其中，$y_i$ 中的所有 token 共享相同的优势 $\hat{A}_i$。





在强化学习中，为了最大化硬件利用率，通常需要使用较大的 rollout batch。进而，为了提高采样效率，通常会将大的 rollout batch 划分为多个 mini-batches 进行梯度更新。
这一过程也就引入了 off-policy 学习，其响应 $y$ 是从旧策略 $\pi_{\theta_{\text{old}}}$ 中采样的，因此需要梯度剪裁机制，防止过于 “off-policy” 的样本参与梯度估计。

但 GRPO 中存在一个更根本的问题：**其目标函数是不适定的（ill-posed）**。当在 long response 上训练大型模型时，这一问题尤为严重，可能导致模型崩溃。
GRPO 目标函数出现 ill-posed 的原因是对重要性采样权重的误用。重要性采样的基本原则是通过重新加权从 behavior 分布 $\pi_{\text{beh}}$ 中抽取的样本，来估计 target 分布 $\pi_{\text{tar}}$ 下的函数 $f$ 的期望：
$$
\mathbb{E}_{z \sim \pi_{\text{tar}}} [f(z)] = \mathbb{E}_{z \sim \pi_{\text{beh}}} \left[ \frac{\pi_{\text{tar}}(z)}{\pi_{\text{beh}}(z)} f(z) \right].
$$

关键在于，这依赖于对行为分布 $\pi_{\text{beh}}$ 中的多个样本（$N \gg 1$）进行平均，以有效地校正分布不匹配。

相比之下，GRPO 在每个标记位置 $t$ 应用了重要性权重 $\frac{\pi_\theta(y_{i,t}|x, y_{i,<t})}{\pi_{\theta_{\text{old}}}(y_{i,t}|x, y_{i,<t})}$。由于这个权重基于每个下一标记分布 $\pi_{\theta_{\text{old}}}(\cdot|x, y_{i,<t})$ 的单个样本 $y_{i,t}$，它无法发挥预期的分布校正作用。相反，它向训练过程引入了高方差噪声。


