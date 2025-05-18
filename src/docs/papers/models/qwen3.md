# Qwen3 Technical Report

本次引入模型系列为：
- Dense model: `Qwen3-0.6B`、`Qwen3-1.7B`、`Qwen3-4B`、`Qwen3-8B`、`Qwen3-14B`、`Qwen3-32B`；
- MoE model: `Qwen3-30B-A3B`、`Qwen3-235B-A22B`；

## 1. Model architecture

相较于 Qwen2.5 的改动：
- 使用 byte-level byte-pair encoding（BBPE）tokenizer，vocabulary size 为 151669；
- Dense model：移除了 QKV-bias，引入了QK-Norm；
- MoE model：与 Qwen3 dense model 共享底层架构，与Qwen2.5-MoE具有相同的export，不同的是，Qwen3-MoE不包括 share export。 

![dense model](/imgs/notes/papers/qwen3/dense_architecture.png)

![moe model](/imgs/notes/papers/qwen3/moe_architecture.png)


## 2. Pre-training

### 2.1 Pre-training Data
相比于 Qwen2.5 显著增加了训练数据的规模和多样性。具体来说，pretrain tokens 是原来的两倍多，language是原来的三倍多的。
所有 Qwen3 模型都在 119 种语言（含方言）组成的数据集上训练，总计 36T tokens。

数据包含：code、STEM（Science, Technology, Engineering, and Mathematics）、reasoning tasks、book、多语言文本和合成数据。

数据合成方式：
1. 使用 Qwen2.5-VL 模型对大量 PDF 文档进行文本识别。然后，使用 Qwen2.5 模型对识别出的文本进行精炼，以提高其质量，共计 T 级别。 
2. 使用 Qwen2.5、Qwen2.5-Math 和 Qwen2.5-Coder 模型来合成不同格式的 T 级别文本 tokens ，包括教科书、问答、指令和代码片段，涵盖数十个领域。
3. 引入更多语言。与 Qwen2.5 相比，支持的语言数量从 29 增加到 119 种，提高了模型的语言覆盖范围和跨语言能力。 


### 2.2 Pre-training Stage

- **General Stage (S1):** Qwen3 模型使用 sequence length 为 4096，在超过 30T tokens上进行训练。
- **Reasoning Stage (S2):** 为了提高推理能力，通过增加 STEM、code、reasoning 和合成数据的比例来优化预训练语料库。sequence length 为 4096，使用 5T 高质量 token 进一步预训练。同时在这一阶段加速了学习率的衰减。 
- **Long Context Stage:** 收集高质量的 long context 语料来扩展上下文长度。所有模型都在百B tokens上进行预训练，序列长度为 32768 tokens。长度在 16384-32768 的占75%，长度在 4096-16384的占25%。 使用ABF技术将RoPE的基本频率从10,000增加到1,000,000。同时引入YARN和双块注意力来实现推理过程中序列长度四倍增加。 

注：develop scaling laws for optimal hyper-parameters (e.g., learning rate scheduler, and batch size)


### 2.3 Pre-training Evaluation
预训练模型的验证数据集包含 15 个 benchmarks：

- **General Tasks:** `MMLU(5-shot)`, `MMLU-Pro(5shot, CoT)`, `MMLU-redux(5-shot)`, `BBH(3-shot, CoT)`, `SuperGPQA(5-shot, CoT)`
- **Math & STEM Tasks:** `GPQA(5-shot, CoT)`, `GSM8K(4-shot, CoT)`, `MATH(4-shot, CoT)`
- **Coding Tasks:** `EvalPlus(0-shot)` (Average of HumanEval, MBPP, Humaneval+, MBPP+), `MultiPL-E(0-shot)` (包含：Python, C++, JAVA, PHP, TypeScript, C#, Bash, JavaScript), `MBPP(3-shot)`, CRUXEval 中的 `CRUX-O(1-shot)` 
- **Multilingual Tasks:** `MGSM(8-shot, CoT)`, `MMMLU(5-shot)`, `INCLUDE(5-shot)`

预训练测试结果：

![moe_compare](/imgs/notes/papers/qwen3/moe_compare.png)

![32b_compare](/imgs/notes/papers/qwen3/32b_compare.png)

![14b_compare](/imgs/notes/papers/qwen3/14b_compare.png)

![8b_compare](/imgs/notes/papers/qwen3/8b_compare.png)

![4b_compare](/imgs/notes/papers/qwen3/4b_compare.png)

![1b_compare](/imgs/notes/papers/qwen3/1b_compare.png)


## 3. Post-training

post-training pipeline 有两个核心目标
1. Thinking Control：用户可以直接控制模型的 “non-thinking” 和 “thinking” 两种模式；
2. Strong-to-Weak Distillation：用于简化和优化轻量级模型的训练后过程

![post_train](/imgs/notes/papers/qwen3/post_train.png)

如上图，旗舰模型训练过程分为4个阶段。前两个阶段提高模型的 “thinking” 能力，后两个阶段用于训练模型的 “no-thinking” 能力。

直接用teacher model 的 logits 蒸馏 lightweight student model，可以有效地提高其性能，避免了为每个小型模型单独执行四阶段后训练。

### 3.1 Long-CoT Cold Start
首先构建一个全面的数据集，包含 math, code, logical reasoning, and general STEM problems等。 数据集的构建涉及严格的两阶段过滤过程：
1. query filtering
   1) 使用 Qwen2.5-72B-Instruct 来识别并移除那些不容易验证的query（包含：multiple sub-questions、general text generation）。 
   2) 排除 Qwen2.5-72B-Instruct 可以正确回答而无需使用CoT推理的query。 
   3) 使用 Qwen2.5-72B-Instruct 为每个 query 的标注 domain，来确保数据集的跨领域平衡。 

2. response filtering
   1) 使用 QwQ-32B 为每个 query 生成N个候选响应。QwQ-32B 无法生成正确 response 时，会人工评估 response 的准确性。 
   2) 对于 Pass@N 为正的 query，进一步移除那些：1）产生的最终答案不正确；2）含有大量重复；3）明显表示猜测而没有充分推理；4）思考与总结之间存在不一致；5）涉及不适当的语言混合或风格转变；6）与验证集中的数据过于相似的 response。

冷启动训练推理模式的目标：使模型学会基础的 reasoning pattern，而强调推理的 performance。在这一阶段最好使用少量的训练样本和训练步骤。

### 3.2 Reasoning RL
在 reasoning RL 阶段使用的 query-verifier 对满足以下四个标准：
- 在冷启动阶段未被使用;
- 冷启动模型可学习;
- 尽可能具有挑战性;
- 覆盖了广泛的子领域。

最终收集了共 3995 个 query-verifier 对，并使用 GRPO 方法来训练。

值得注意的是：
1. 使用较大的 batch size 和对每个 query 使用更多的 rollouts，以及 off-policy 训练，效果更好；
2. 通过控制模型 entropy，使其稳步增长或保持稳定，能够解决如何平衡 exploration 和 exploitation 的问题，这对维持训练稳定性至关重要；

最终 Qwen3-235B-A22B 执行 170 个 RL 训练步骤，AIME'24 分数从 70.1 提升至 85.1。

### 3.3 Thinking Mode Fusion
思维模式融合阶段的目标是将“非思维”能力整合到之前开发的“思维”模型中。这种方法允许开发人员管理和控制推理行为，同时降低为思维和非思维任务部署单独模型的成本和复杂性。为了实现这一点，我们对推理RL模型进行持续的监督微调（SFT），并设计了一个聊天模板来融合这两种模式。此外，我们发现能够熟练处理两种模式的模型在不同的思维预算下表现一致良好。 

#### 3.3.1 Construction of SFT data
SFT数据集结合了 “thinking” 和 “no-thinking” 数据。为了保证 stage 2 的模型性能不会因为 SFT 而受损：
- “thinking” 数据是通过使用 stage 2 模型对 stage 1 的query进行拒绝采样生成；
- “no-thinking” 数据是精心挑选的，包括 coding、mathematics、instruction-following、multilingual tasks、creative writing、question answering 和 role-playing；

此外，为了提高 low-resource languages 任务（数据量较少的语言）的性能，还增加了翻译任务的比例。 

#### 3.3.2 Chat Template Design
对于思考模式和非思考模式的样本，在 user query 或 system message 中引入了 `/think` 和 `/no think` 标志。这样模型可以根据用户的输入选择相应的模式输出。

模型默认以思考模式运行，因此添加了一些 user query 不含 `/think` 的思考模式训练样本，对于多轮对话，随机在 user query 中插入多个 `/think` 和 `/no think`，模型的响应遵循遇到的最后一个标志。 

![post_train](/imgs/notes/papers/qwen3/chat_template.png)

#### 3.3.3 Thinking Budget
Thinking mode fusion 的另一个优势：模型学会以 `thinking` 和 `no-thinking` 两种模式进行响应，就很自然的能够处理中间情况——基于不完整的思考生成响应。
即：当模型的思考长度达到用户定义的阈值时，可以通过插入停止思考指令 `Considering the limited time by the user, I have to give the solution based on the thinking directly now.\n</think>.\n\n` 来手动停止思考过程。
在插入这个指令后，模型会根据当前积累的推理生成最终 response。

注意：这种能力不是训练出来的，而是应用 thinking mode fusion 后自然出现的。 

### 3.4 General RL
目的是提高以下能力：

- **Instruction Following**：使用与 content、format、length 和 structured output 的相关指令，提供符合用户期望的响应。；
- **Format Following**：让模型遵守特定的格式约定。如：通过 `/think` 和 `/no think` 标志来切换思考还是不思考；使用 `<think>` 和 `</think>` 来分离思考与响应； 
- **Preference Alignment**：提高用户体验；
- **Agent Ability**：涉及到训练模型通过指定的接口正确调用工具。在RL展开过程中，允许模型与真实环境执行反馈进行完整的多轮交互循环，从而提高其在长期这决策任务中的性能和稳定性
- **Abilities for Specialized Scenarios**：设计了针对特定上下文的任务。例如，在检索增强生成（RAG）任务中，我们将奖励信号纳入其中，以引导模型生成准确且上下文适当的响应，从而最大限度地降低幻觉的风险。 

为了完成上面任务，提出了三种 reward function：

- **Rule-based Reward:** 
- **Model-based Reward with Reference Answer:** 为每个 query 提供一个 answer，并提示 Qwen2.5-72B-Instruct 根据这个 answer 来对模型的响应评分。避免了 rule- based 的奖励可能出现的 false negatives；
- **Model-based Reward without Reference Answer:** 利用偏好数据，训练一个奖励模型，为模型 response 分配分数。

### 3.5 Strong-to-Weak Distillation

- **Off-policy Distillation:** 使用 `/think` 和 `/no-think` 模式生成的教师模型的输出结合起来进行 response 蒸馏。 
- **On-policy Distillation:** student model 在 `/think` 或 `/no think` 模式下产生响应。然后将 student 的 logits 与 teacher 的logits对齐来最小化KL散度，从而对学生模型进行微调。 

### 3.6 Post-training Evaluation

- **General Tasks:** `MMLU-Redux`、`GPQADiamond`、`C-Eval`、`LiveBench`;  
- **Alignment Tasks:** `IFEval` (instruction-following)、`Arena-Hard` (human preferences on general topics)、`AlignBench` (v1.1)、`Creative Writing and WritingBench` (writing task)；
- **Math & Text Reasoning:** `MATH-500` (math)、`AIME’24 and AIME’25` (math)、and `ZebraLogic` (reasoning)、AutoLogi (reasoning)；（注：AIME数据集中每年的问题分为 I 和 II 共30题，这里是对每一题采样 64 次计算平均得分；
- **Agent & Coding:** `BFCL v3`, `LiveCodeBench (v5, 2024.10-2025.02)`, and `Codeforces Ratings from CodeElo` (具体使用见 report)；
- **Multilingual Tasks:** Multi-IF (instruction following)、INCLUDE (regional knowledge)、MMMLU (general knowledge)、MT-AIME2024 (mathematics)、PolyMath (mathematics)、MlogiQA (Logical reasoning)。

对于 `think` 模式：使用 temperature=0.6，top-p=0.95，top-k=20。（Creative Writing v3 和 WritingBench，使用 presence penalty=1.5）。
对于 模式：使用 temperature=0.7，top-p=0.8，top-k=20，presence penalty=1.5。
所有实验 Max output length 为 32768 tokens（AIME'24 和 AIME'25 为 38912 tokens）。实验结果见下图。 

![moe_post_think](/imgs/notes/papers/qwen3/moe_post_think.png)

![moe_post_no_think](/imgs/notes/papers/qwen3/moe_post_no_think.png)

更多实验结果见 report。


## 4. Discussion

### 4.1 Thinking Budget 的有效性
验证通过增加 thinking budget 可以提高效果。

![think_budget](/imgs/notes/papers/qwen3/think_budget.png)

### 4.2 On-Policy Distillation 的效果

![on_policy_distillation](/imgs/notes/papers/qwen3/on_policy_distillation.png)

### 4.3 Thinking Mode Fusion 和 General RL 的影响

![thinking_mode_fusion](/imgs/notes/papers/qwen3/think_mode_fusion.png)

