
vllm 状态检测 (production-stack/observability)
- /health 和 /metrics端口
- 核心 metrics 检测
    - num_waiting_requests > 0
    - num_runnings_requests 
    - SLO related (服务质量)
      - time to first_token
      - decoding_throughout 

- 负载均衡和路由算法 （生产环境中多个vllm）
  - 负载均衡：如何判断overload
  - 路由算法：
    - round_robin
    - session_based
    - 最大前缀匹配


v1: 版本从 v0向v1过渡

功能模块：
- entrypoint (llm(entrypoint/llm.py) api_server(entrypoint/api_server.py))
- engine (engine/llm_engine.py)
- scheduler (core/scheduler.py)  打包requests ?
- kv cache manager （core/block_manager.py）
    - paged attention
- evictor (core/evictor.py)
    - prefix caching (toread: cacheblend)
    - kv cache optimization
- Worker 真正干活的（GPU、CPU。。。）(worker/worker_base.py, worker.py) 为模型执行初始化变量、执行环境
- model executor (model runner)
- modelling (models_executor/models/llama.py)  模型文件(vllm 模型标准格式)
- attention backend (attention/backends/flash_atten.py)
    - flash attention 


周边
- preprocessing / postprocessing (tokenizer, detokenizer, sampler, multimodal processor)
- distributed
- torch.compile
- observability
- config
- testing
- ci / cd
- formatting

optimization
- speculative decoding
- disaggregated prefilling
- chunked prefill
- cascade inference
- prefix caching





distribution inference
- communication device:
  - NVLink: GPU 与 GPU之间的通讯，硬件通信
  - infinity：nodes间的通信呢（硬件通信））
- communication library (/distributed/device_communicators)
  - pynccl: nvidia的通信
  - shared memory: OS操作系统中，不同的进程都可以访问share memory
  - custom allreduce：all reduce算子核（0 mechine: [0]; 1 mechine: [1] -> 0 mechine: [0,1], 1 mechine: [0, 1]）
  - torch.distributed:
(看 model_executor/model/llama.py 支持所有并行) 
- types of distribution inference: tp / pp / ep / dp (distributed/parallel_state.py)
  - tp (vllm/model_executor/models/llama.py) 并行attention head
  - pp (牺牲latency来获取throughput，配置较差时使用)，每个worker负责部分layers （看vllm/worker/model_runner.py）
  - export parallel: MOE 专家并行 (shuffle -> forward -> shuffle back)  (看deepseek moe)
  - data parallel: 由于 t <= attn head, max tp << ep needed; tp * dp == ep, request 非常高时才使用
- pd disaggregative (PD 分离)
  - prefill / decode