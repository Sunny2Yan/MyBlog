# VLLM 部署

## 1. 单机 docker 部署

```bash
# 1. 添加docker镜像源
vim /etc/docker/daemon.json

#{
#    "registry-mirrors": [
#        "https://docker.m.daocloud.io"
#    ]
#}

sudo systemctl daemon-reload
sudo systemctl restart docker

# 2. 拉取镜像
docker pull vllm/vllm-openai:latest
```


2. 修改基础镜像（可选，也可以创建基础镜像再进去安装）
```Dockerfile
# 以最新的 vllm 版本为基础镜像
FROM vllm/vllm-openai:latest

# 添加镜像源
RUN python -m pip install --upgrade pip && \
    pip config set global.index-url https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple

RUN mkdir -p /etc/uv && \
    echo '[[index]]' > /etc/uv/uv.toml && \
    echo 'url = "https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple/"' >> /etc/uv/uv.toml && \
    echo 'default = true' >> /etc/uv/uv.toml \
    
RUN uv pip install --system git+https://github.com/huggingface/transformers.git

# 以指定版本的 vllm 为基础镜像
#FROM vllm/vllm-openai:v0.7.3
#RUN uv pip install --system vllm[audio,video]==0.7.3
```

运行 dockerfile, 创建新镜像
```bash
DOCKER_BUILDKIT=1 docker build -t my-vllm:custom .
# DOCKER_BUILDKIT=1: 启用 Docker BuildKit 构建后端（更快）
# --target vllm-openai: 
```

3. 创建容器
```bash
# 1. 创建容器并部署模型
docker run -itd  \  # i: interactive; t: 分配一个伪终端; d: detached mode 后台模式
    --gpus all \  # 将宿主机全部GPU暴露给容器
    -v ~/.cache/huggingface:/root/.cache/huggingface \  # 将宿主机地址映射到容器地址
    --env "HUGGING_FACE_HUB_TOKEN=<secret>" \  # 设置环境变量
    --net host \  # 共享宿主机的网络，不需要再进行端口映射
    # -p 8000:8000 \  # 将容器的8000端口映射到宿主机的8000端口
    --ipc=host \  # 宿主机的 IPC（进程间通信）命名为 host
    --name vllm \  # 为容器命名
    my-vllm:custom \  # 定义基础镜像，并可交互
    --model Qwen/Qwen3-Next-80B-A3B \
    --served-model-name qwen3-next
    
# 2.进入容器在执行模型部署
docker exec -it vllm bash

docker run -itd \
    --gpus all \
    -v /data/models:/data/models \
    --name vllm-deploy \
    --net host \
    --ipc=host \
    --entrypoint /bin/bash \  # 进入模型时不执行命令
    vllm/vllm-openai:latest -c "tail -f /dev/null"  # 后台运行
    
# 3. 部署模型
vllm serve /data/models/Qwen/Qwen3-Next-80B-A3B \
    --served-model-name qwen3-next
```

## 2. 多机 docker 部署

1. 下载 VLLM 官方部署脚本 `run_cluster.sh`，具体如下：

```bash
# run_cluster.sh
if [ $# -lt 4 ]; then
    echo "Usage: $0 docker_image head_node_ip --head|--worker path_to_hf_home [additional_args...]"
    exit 1
fi

DOCKER_IMAGE="$1"
HEAD_NODE_ADDRESS="$2"
NODE_TYPE="$3"  # --head or --worker
PATH_TO_HF_HOME="$4"
shift 4
 
ADDITIONAL_ARGS=("$@")  # 额外的参数
 
# Validate the NODE_TYPE argument.
if [ "${NODE_TYPE}" != "--head" ] && [ "${NODE_TYPE}" != "--worker" ]; then
    echo "Error: Node type must be --head or --worker"
    exit 1
fi

CONTAINER_NAME="node-${RANDOM}"

cleanup() {
    docker stop "${CONTAINER_NAME}"
    docker rm "${CONTAINER_NAME}"
}
trap cleanup EXIT

RAY_START_CMD="ray start --block"
if [ "${NODE_TYPE}" == "--head" ]; then
    RAY_START_CMD+=" --head --port=6379"
else
    RAY_START_CMD+=" --address=${HEAD_NODE_ADDRESS}:6379"
fi                                                                                                  
 
docker run \
    --entrypoint /bin/bash \
    --network host \
    --name "${CONTAINER_NAME}" \
    --shm-size 10.24g \
    --gpus all \
    -v "${PATH_TO_HF_HOME}:/root/.cache/huggingface" \
    -e "NCCL_IB_HCA=mlx5" \
    "${ADDITIONAL_ARGS[@]}" \
    "${DOCKER_IMAGE}" -c "${RAY_START_CMD}"
```

2. 启动 Head 或 Worker 节点

```bash
# 启动主节点
nohup bash run_cluster.sh \
    vllm/vllm-openai:latest \  # 镜像名
    1.2.3.4 \  # Head IP
    --head \
    /data/models/Qwen/Qwen3-Next-80B-A3B-Thinking \  # 物理机模型地址，需要映射到容器
    -e VLLM_HOST_IP=1.2.3.4 \  # 当前节点 IP
    -e NCCL_IB_HCA=mlx5 \                                                                           
    -e GLOO_SOCKET_IFNAME=eth0 \  # 节点间的通信网卡，默认可能会匹配错误
    -e NCCL_SOCKET_IFNAME=eth0 \
    >> ./ray.log 2>&1 & 

# 启动从节点
nohup bash run_cluster.sh \
        vllm/vllm-openai:latest \
        1.2.3.4 \
        --worker \
        /mnt/data/models/Qwen/Qwen3-Next-80B-A3B-Thinking \
        -e VLLM_HOST_IP=5.6.7.8 \
        -e NCCL_IB_HCA=mlx5 \
        -e GLOO_SOCKET_IFNAME=eth0 \
        -e NCCL_SOCKET_IFNAME=eth0 \
        >> ray.log 2>&1 &
        
# 以上容器停止后，容器会被删除，可以生成永久容器
docker run --rm -itd --shm-size=10.2g --gpus all \
    --name vllm-deploy \
    --network host \
    -v /data/models:/data/models \
    --entrypoint /bin/bash \
    -e NCCL_IB_HCA=mlx5 \
    -e GLOO_SOCKET_IFNAME=eth0 \
    -e NCCL_SOCKET_IFNAME=eth0 \
    vllm/vllm-openai:latest -c "tail -f /dev/null"
# 进入容器后再启动Ray，最后执行模型部署：
ray start --block --head --port=6379  # --include-dashboard=True  添加dashboard
ray start --block --address=<master_ip>:<master_port>
ray status  # 查看集群状态
```

3. 进入 Head 节点容器启动vllm

```bash
docker ps
docker exec -it <container_id> /bin/bash

export GLOO_SOCKET_IFNAME=eth0
export NCCL_SOCKET_IFNAME=eth0
vllm serve /root/.cache/huggingface \
    --served-model-name qwen3-next \
    --gpu-memory-utilization 0.9 \
    --tensor-parallel-size 16 \
    --trust_remote_code \
    --max-model-len 16248 \
    --enable_prefix_caching \
    --reasoning-parser deepseek_r1 \
    --speculative-config '{"method":"qwen3_next_mtp","num_speculative_tokens":2}' \
    --host 0.0.0.0 \
    --port 1150 \
    >> ./logs/qwen.log 2>&1 & 
```


## 3. 问题

1. 配置 docker 镜像源
```bash
mkdir -p /etc/docker
vim /etc/docker/daemon.json

#{
#  "registry-mirrors": [
#    "https://<your-mirror>.mirror.aliyuncs.com",
#  ]
#}
sudo systemctl restart docker
```

2. docker 权限问题
```bash
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.51/info": dial unix /var/run/docker.sock: connect: permission denied
```
原因：Docker 默认只允许 root 用户或属于 docker 用户组的用户与其通信。
```bash
# 1. 将当前用户添加 docker 组
sudo usermod -aG docker $USER
# 2. 刷新、激活新组权限
newgrp docker
# 3. 验证是否成功
docker info
```

3. docker 配置 GPU 问题
```bash
docker: Error response from daemon: could not select device driver "" with capabilities: [[gpu]]
```
原因：未正确安装 NVIDIA Container Toolkit，Docker 无法找到支持 GPU 的设备驱动
```bash
# 1. 查看GPU驱动 
nvidia-smi

# 2. 安装 NVIDIA Container Toolkit
# 配置源
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | \
  sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
# 安装
sudo apt-get install -y nvidia-container-toolkit
# 重启Docker服务
sudo systemctl restart docker
```