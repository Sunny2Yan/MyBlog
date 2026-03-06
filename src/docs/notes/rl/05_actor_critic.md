# Actor-Critic

基于值函数的方法只学习一个价值函数，基于策略的方法只学习一个策略函数，本文提到的算法既学习价值函数，又学习策略函数。

::: tip
Actor-Critic 算法本质上是基于策略的算法，其目标是优化一个带参数的策略，只是会额外学习价值函数，从而帮助策略函数更好地学习。
:::

在上一节 REINFORCE 算法中，目标函数的梯度中有一项轨迹回报，用于指导策略的更新。 REINFOCE 算法用蒙特卡洛方法来估计 $Q(s,a)$，
Actor-Critic 算法使用拟合一个值函数来指导策略进行学习。在策略梯度中，可以把梯度写成下面这个更加一般的形式

$$
g = \mathbb{E} \left[ \sum_{t=0}^{T} \psi_t \nabla_\theta \log \pi_\theta(a_t|s_t) \right]
$$

其中，$\psi_t$ 可以有很多种形式：

1. $\sum_{t'=0}^{T} \gamma^{t'} r_{t'}$：轨迹的总回报；
2. $\sum_{t'=t}^{T} \gamma^{t'-t} r_{t'}$：动作 $a_t$ 之后的回报；
3. $\sum_{t'=t}^{T} \gamma^{t'-t} r_{t'} - b(s_t)$：基准线版本的改进；
4. $Q^{\pi_\theta}(s_t, a_t)$：动作价值函数；
5. $A^{\pi_\theta}(s_t, a_t)$：优势函数；
6. $r_t + \gamma V^{\pi_\theta}(s_{t+1}) - V^{\pi_\theta}(s_t)$：时序差分残差。

通过蒙特卡洛采样的方法对策略梯度的估计是无偏的，但是方差非常大。因此：
- 可以引入基线函数（baseline function）$b(s_t)$来减小方差 --> 形式(3)；
- 还可以采用 Actor-Critic 算法估计一个动作价值函数 $Q$，代替蒙特卡洛采样得到的回报 --> 形式(4)；
- 进一步把状态价值函数 $V$ 作为基线，从 $Q$ 函数减去这个 $V$ 函数则得到了 $A$ 函数，称为优势函数（advantage function）--> 形式(5)；
- 更进一步，可以利用 $Q = r + \gamma V$ 等式得到 --> 形式(6)。


使用 $Q$ 值或者 $V$ 值本质上也是用奖励来进行指导，但是**用神经网络进行估计的方法可以减小方差**、提高鲁棒性。
此外，基于蒙特卡洛采样，只能在序列结束后进行更新，这同时也要求任务具有有限的步数，而 Actor-Critic 算法则可以在每一步之后都进行更新，并且不对任务的步数做限制。

下面重点介绍形式(6)，即通过时序差分残差 $\psi_t = r_t + \gamma V^\pi(s_{t+1}) - V^\pi(s_t)$ 来指导策略梯度进行学习。

将 Critic 价值网络表示为 $V_\omega$，参数为 $\omega$。于是可以采取时序差分残差的学习方式，对于单个数据定义如下价值函数的损失函数：

$$
\mathcal{L}(\omega) = \frac{1}{2}(r + \gamma V_\omega(s_{t+1}) - V_\omega(s_t))^2
$$

同 DQN，采取类似于目标网络的方法，将上式中 $r + \gamma V_\omega(s_{t+1})$ 作为时序差分目标，不会产生梯度来更新价值函数。因此，价值函数的梯度为：

$$
\nabla_\omega \mathcal{L}(\omega) = -(r + \gamma V_\omega(s_{t+1}) - V_\omega(s_t)) \nabla_\omega V_\omega(s_t)
$$

然后使用梯度下降方法来更新 Critic 价值网络参数即可。

Actor-Critic 算法的具体流程如下：

- 初始化策略网络参数 $\theta$，价值网络参数 $\omega$
- for 序列 $e = 1 \to E$ do：
  - 用当前策略 $\pi_\theta$ 采样轨迹 $\{s_1, a_1, r_1, s_2, a_2, r_2, \ldots\}$
  - 为每一步数据计算：$\delta_t = r_t + \gamma V_\omega(s_{t+1}) - V_\omega(s_t)$
  - 更新价值参数 $\omega = \omega + \alpha_\omega \sum_t \delta_t \nabla_\omega V_\omega(s_t)$
  - 更新策略参数 $\theta = \theta + \alpha_\theta \sum_t \delta_t \nabla_\theta \log \pi_\theta(a_t|s_t)$
- end for

```python
import gym
import torch
import torch.nn.functional as F


class PolicyNet(torch.nn.Module):
    def __init__(self, state_dim, hidden_dim, action_dim):
        super(PolicyNet, self).__init__()
        self.fc1 = torch.nn.Linear(state_dim, hidden_dim)
        self.fc2 = torch.nn.Linear(hidden_dim, action_dim)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        return F.softmax(self.fc2(x), dim=1)


class ValueNet(torch.nn.Module):
    def __init__(self, state_dim, hidden_dim):
        super(ValueNet, self).__init__()
        self.fc1 = torch.nn.Linear(state_dim, hidden_dim)
        self.fc2 = torch.nn.Linear(hidden_dim, 1)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        return self.fc2(x)


class ActorCritic:
    def __init__(self, state_dim, hidden_dim, action_dim, actor_lr, critic_lr, gamma, device):
        # 策略网络
        self.actor = PolicyNet(state_dim, hidden_dim, action_dim).to(device)
        self.critic = ValueNet(state_dim, hidden_dim).to(device)  # 价值网络
        # 策略网络优化器
        self.actor_optimizer = torch.optim.Adam(self.actor.parameters(), lr=actor_lr)
        self.critic_optimizer = torch.optim.Adam(self.critic.parameters(), lr=critic_lr)  # 价值网络优化器
        self.gamma = gamma
        self.device = device

    def take_action(self, state):
        state = torch.tensor([state], dtype=torch.float).to(self.device)
        probs = self.actor(state)
        action_dist = torch.distributions.Categorical(probs)
        action = action_dist.sample()
        return action.item()

    def update(self, transition_dict):
        states = torch.tensor(transition_dict['states'], dtype=torch.float).to(self.device)
        actions = torch.tensor(transition_dict['actions']).view(-1, 1).to(self.device)
        rewards = torch.tensor(transition_dict['rewards'], dtype=torch.float).view(-1, 1).to(self.device)
        next_states = torch.tensor(transition_dict['next_states'], dtype=torch.float).to(self.device)
        dones = torch.tensor(transition_dict['dones'], dtype=torch.float).view(-1, 1).to(self.device)

        # 时序差分目标
        td_target = rewards + self.gamma * self.critic(next_states) * (1 - dones)
        td_delta = td_target - self.critic(states)  # 时序差分误差
        log_probs = torch.log(self.actor(states).gather(1, actions))
        actor_loss = torch.mean(-log_probs * td_delta.detach())
        # 均方误差损失函数
        critic_loss = torch.mean(F.mse_loss(self.critic(states), td_target.detach()))
        self.actor_optimizer.zero_grad()
        self.critic_optimizer.zero_grad()
        actor_loss.backward()  # 计算策略网络的梯度
        critic_loss.backward()  # 计算价值网络的梯度
        self.actor_optimizer.step()  # 更新策略网络的参数
        self.critic_optimizer.step()  # 更新价值网络的参数


actor_lr = 1e-3
critic_lr = 1e-2
num_episodes = 1000
hidden_dim = 128
gamma = 0.98
device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

env_name = 'CartPole-v0'
env = gym.make(env_name)
env.seed(0)
torch.manual_seed(0)
state_dim = env.observation_space.shape[0]
action_dim = env.action_space.n
agent = ActorCritic(state_dim, hidden_dim, action_dim, actor_lr, critic_lr, gamma, device)

return_list = rl_utils.train_on_policy_agent(env, agent, num_episodes)
```