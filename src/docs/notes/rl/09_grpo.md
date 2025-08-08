# Group Relative Policy Optimization

[Paper](https://arxiv.org/pdf/2402.03300)

GRPO的核心思想：通过组内相对奖励来估计 baseline，从而避免使用额外的价值函数模型（critic model）。
传统的 PPO 算法需要训练一个价值函数来估计优势函数（advantage function），而 GRPO 通过对同一问题生成的多个采样输出的平均奖励作为基准，显著减少了内存和计算资源的消耗。

对于 PPO 算法：

$$
\mathcal{J}_{PPO}(\theta) = \mathbb{E}_{q \sim P(Q), o \sim \pi_{\theta_{\text{old}}}(O|q)} \frac{1}{|o|} \sum_{t=1}^{|o|} \min \left[ \frac{\pi_\theta(o_t|q, o_{<t})}{\pi_{\theta_{\text{old}}}(o_t|q, o_{<t})}, \text{clip} \left( \frac{\pi_\theta(o_t|q, o_{<t})}{\pi_{\theta_{\text{old}}}(o_t|q, o_{<t})}, 1-\varepsilon, 1+\varepsilon \right) A_t \right]
$$

其中，$\pi_\theta$ 和 $\pi_{\theta_{old}}$ 分别表示当前策略模型和旧的模型，$q$ 和 $o$ 分别表示问题和 $\pi_{\theta_{old}}$ 的输出，$\epsilon$ 是一个与裁剪相关的超参数，
$A_t$ 是基于奖励 $\{r_{\geq t}\}$ 和可学习的值函数 $V_{\psi}$ 采用 Generalized Advantage Estimation (GAE) 计算的优势。

在PPO中，需要同时训练一个价值函数 $V_{\psi}$ 和策略模型 $\pi_\theta$。同时，为了避免奖励模型过度优化（策略模型过拟合奖励函数），需要在每个 token 的奖励中添加 KL 散度惩罚项（即，离旧的模型不要偏离太远）：

$$
r_t = r_\varphi(q, o_{\leq t}) - \beta \log \frac{\pi_\theta(o_t | q, o_{<t})}{\pi_{\text{ref}}(o_t | q, o_{<t})}
$$

其中，$r_\varphi$ 是奖励模型，$\pi_{ref}$ 是被SFT初始化的推理模型。

![](/imgs/notes/rl/grpo/ppo_vs_grpo.png)

在LLM应用中，奖励模型通常只给最终的response 分配一个奖励分数，这就使得训练每个 token 都准确的价值函数变得困难（期望价值函数预测从当前token开始到序列结束的预期累积奖励）。
为了解决这一问题，提出了 GRPO 算法。

具体训练流程：

对 batch 中的每一个question：

1. Generating completion：

   从旧的策略模型 $\pi_{\theta_{old}}$ 中采样一组输出 $\{o_1, o_2, \dots, o_G\}$，其中 $G$ 是 Group 的大小；
2. computing the advantage

   对组内 $G$ 个输出 $o_i$，计算每一个 reward function 下的奖励 $r_\phi$，并按优势函数 $\hat{A}_{i,t}= \bar{r}_i =\frac{r_i-\text{mean}(r)}{\text{std}(r)}$ 计算组内每一个奖励对应的优势；
3. estimating the KL divergence（下面是 KL 散度的无偏估计）

   $$
   D_{KL}[\pi_\theta || \pi_{ref}] = \frac{\pi_{ref}(o_{i,t} | q,o_{i,<t})} {\pi_{\theta}(o_{i,t} | q, o_{i,<t})} - \log \frac{\pi_{ref}(o_{i,t} | q,o_{i,<t})}{\pi_{\theta}(o_{i,t} | q,o_{i,<t})} − 1
   $$
4. computing the loss:
   目标是最大化 Advantage 同时确保 policy model 需要接近原始的 reference model，即保留通用知识。

   $$
   \mathcal{L}_{\text{GRPO}}(\theta) = -\frac{1}{G} \sum_{i=1}^{G} \sum_{t=1}^{|o_i|} \left[ \frac{\pi_\theta(o_{i,t} \mid q, o_{i,<t})}{[\pi_\theta(o_{i,t} \mid q, o_{i,<t})]_{\text{no grad}}} \hat{A}_{i,t} - \beta \mathbb{D}_{\text{KL}}[\pi_\theta \| \pi_{\text{ref}}] \right],
   $$

注意：上面的 $t$ 表示第 t 个 token，

原始论文中的目标公式：

$$
\begin{aligned}
\mathcal{L}_{\text{GRPO}}(\theta) &= \mathbb{E}[q \sim P(Q), \{o_i\}_{i=1}^G \sim \pi_{\theta_{\text{old}}}(O|q)]
\frac{1}{G} \sum_{i=1}^{G} \frac{1}{|o_i|} \sum_{t=1}^{|o_i|} \left\{ \min \left[ \frac{\pi_\theta(o_{i,t}|q, o_{i,<t})}{\pi_{\theta_{\text{old}}}(o_{i,t}|q, o_{i,<t})} \hat{A}_{i,t}, \text{clip} \left( \frac{\pi_\theta(o_{i,t}|q, o_{i,<t})}{\pi_{\theta_{\text{old}}}(o_{i,t}|q, o_{i,<t})}, 1-\epsilon, 1+\epsilon \right) \hat{A}_{i,t} \right] - \beta \mathbb{D}_{\text{KL}}[\pi_\theta \| \pi_{\text{ref}}] \right\}
\end{aligned}
$$

![](/imgs/notes/rl/grpo/process.png)

算法伪代码：
![](/imgs/notes/rl/grpo/grpo.png)


::: tip
1. 在训练中，loos 可能为 0，但不代表 gradient 为 0，因此更关注 reward；
2. GRPO 中的奖励函数是基于规则奖励，如：Accurate、format等；
3. GRPO解决的是模型不稳定，让模型每次都能输出最好的那一个 completion，如果模型很差则无法进行GRPO训练。
:::