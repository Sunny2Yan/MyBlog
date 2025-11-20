# docker 示例


1. 910b以交互的方式创建容器（不常驻）

```bash
docker run -it \
    --ipc=host \
    --name jtvlm_v1 \
    -v /data/dy/jtvlm/work:/root/work  \
    --pids-limit 409600 \
    --privileged \
    --network=host \
    --shm-size=128G \
    --device=/dev/davinci0 \
    --device=/dev/davinci1 \
    --device=/dev/davinci2 \
    --device=/dev/davinci3 \
    --device=/dev/davinci4 \
    --device=/dev/davinci5 \
    --device=/dev/davinci6 \
    --device=/dev/davinci7 \
    --device=/dev/davinci_manager \
    --device=/dev/devmm_svm \
    --device=/dev/hisi_hdc \
    -v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
    -v /usr/local/Ascend/firmware:/usr/local/Ascend/firmware \
    -v /usr/local/Ascend/add-ons/:/usr/local/Ascend/add-ons/ \
    -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
    -v /usr/local/dcmi:/usr/local/dcmi \
    -v /etc/ascend_install.info:/etc/ascend_install.info \
    <image_id> /bin/bash
```

2. 910b以后台的方式创建容器（常驻）

```bash
docker run -d --ipc=host --name jtvlm_v1 \
    -v /data/dy/jtvlm/work:/root/work  \
    --pids-limit 409600 \
    --privileged --network=host \
    --shm-size=128G \
    --device=/dev/davinci0 \
    --device=/dev/davinci1 \
    --device=/dev/davinci2 \
    --device=/dev/davinci3 \
    --device=/dev/davinci4 \
    --device=/dev/davinci5 \
    --device=/dev/davinci6 \
    --device=/dev/davinci7 \
    --device=/dev/davinci_manager \
    --device=/dev/devmm_svm \
    --device=/dev/hisi_hdc \
    -v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
    -v /usr/local/Ascend/firmware:/usr/local/Ascend/firmware \
    -v /usr/local/Ascend/add-ons/:/usr/local/Ascend/add-ons/ \
    -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \
    -v /usr/local/dcmi:/usr/local/dcmi \
    -v /etc/ascend_install.info:/etc/ascend_install.info \
    <image_id> tail -f /dev/null
```

3. GPU 后台运行

```bash
docker run -itd \
    --gpus all \
    -v /data/models:/data/models \
    --name <container_name> \
    --net host \
    --ipc=host \
    --entrypoint /bin/bash \
    <image_id> -c "tail -f /dev/null"
```