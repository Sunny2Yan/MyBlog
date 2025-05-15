# Qwen3 Technical Report

本次引入模型系列为：
- Dense model: `Qwen3-0.6B`、`Qwen3-1.7B`、`Qwen3-4B`、`Qwen3-8B`、`Qwen3-14B`、`Qwen3-32B`；
- MoE model: `Qwen3-30B-A3B`、`Qwen3-235B-A22B`；

## Model architecture

相较于 Qwen2.5 的改动：
- 使用 byte-level byte-pair encoding（BBPE）tokenizer，vocabulary size 为 151669；
- Dense model：移除了 QKV-bias，引入了QK-Norm；
- MoE model：与 Qwen3 dense model 共享底层架构，与Qwen2.5-MoE具有相同的export，不同的是，Qwen3-MoE不包括 share export。 

![dense model](/imgs/notes/papers/qwen3/dense_architecture.png)

![moe model](/imgs/notes/papers/qwen3/moe_architecture.png)


## Pre-training

### Pre-training Data
相比于 Qwen2.5 显著增加了训练数据的规模和多样性。具体来说，pretrain tokens 是原来的两倍多，language是原来的三倍多的。
所有 Qwen3 模型都在 119 种语言（含方言）组成的数据集上训练，总计 36T tokens。

数据包含：code、STEM（Science, Technology, Engineering, and Mathematics）、reasoning tasks、book、多语言文本和合成数据。

数据合成方式：
1. 使用 Qwen2.5-VL 模型对大量 PDF 文档进行文本识别。然后，使用 Qwen2.5 模型对识别出的文本进行精炼，以提高其质量，共计 T 级别。 
2. 使用 Qwen2.5、Qwen2.5-Math 和 Qwen2.5-Coder 模型来合成不同格式的 T 级别文本 tokens ，包括教科书、问答、指令和代码片段，涵盖数十个领域。
3. 引入更多语言。与 Qwen2.5 相比，支持的语言数量从 29 增加到 119 种，提高了模型的语言覆盖范围和跨语言能力。 


### Pre-training Stage

General Stage (S1): Qwen3 模型使用 sequence length 为 4096，在超过 30T tokens上进行训练。
Reasoning Stage (S2): 为了提高推理能力，通过增加 STEM、code、reasoning 和合成数据的比例来优化预训练语料库。sequence length 为 4096，使用 5T 高质量 token 进一步预训练。同时在这一阶段加速了学习率的衰减。 
Long Context Stage: 收集高质量的 long context 语料来扩展上下文长度。所有模型都在百B tokens上进行预训练，序列长度为 32768 tokens。长度在 16384-32768 的占75%，长度在 4096-16384的占25%。 使用ABF技术将RoPE的基本频率从10,000增加到1,000,000。同时引入YARN和双块注意力来实现推理过程中序列长度四倍增加。 

注：develop scaling laws for optimal hyper-parameters (e.g., learning rate scheduler, and batch size)


### Pre-training Evaluation
预训练模型的验证数据集包含 15 个 benchmarks：

- **General Tasks:** MMLU(5-shot), MMLU-Pro(5shot, CoT), MMLU-redux(5-shot), BBH(3-shot, CoT), SuperGPQA(5-shot, CoT)
- **Math & STEM Tasks:** GPQA(5-shot, CoT), GSM8K(4-shot, CoT), MATH(4-shot, CoT)
- **Coding Tasks:** EvalPlus(0-shot) (Average of HumanEval, MBPP, Humaneval+, MBPP+), MultiPL-E(0-shot) (Python, C++, JAVA, PHP, TypeScript, C#, Bash, JavaScript), MBPP-3shot, CRUX-O of CRUXEval (1-shot) 
- **Multilingual Tasks:** MGSM(8-shot, CoT), MMMLU(5-shot), INCLUDE(5-shot)

![moe_compare](/imgs/notes/papers/qwen3/moe_compare.png)

![32b_compare](/imgs/notes/papers/qwen3/32b_compare.png)

![14b_compare](/imgs/notes/papers/qwen3/14b_compare.png)

![8b_compare](/imgs/notes/papers/qwen3/8b_compare.png)

![4b_compare](/imgs/notes/papers/qwen3/4b_compare.png)

![1b_compare](/imgs/notes/papers/qwen3/1b_compare.png)


## Post-training

![post_train](/imgs/notes/papers/qwen3/post_compare.png)
