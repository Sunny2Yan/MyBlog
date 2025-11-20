# Docker

- Linux 容器: 不是模拟一个完整的操作系统，而是对进程进行隔离。或者说，在正常进程的外面套了一个保护层。对于容器里面的进程来说，它接触到的各种资源都是虚拟的，从而实现与底层系统的隔离。 
- Docker: 属于 Linux 容器的一种封装，提供简单易用的容器使用接口。Docker 将应用程序与该程序的依赖，打包在一个文件里面。运行这个文件，就会生成一个虚拟容器。它是对进程进行隔离。

## docker 安装
1. Windows 安装
Windows：“启用或关闭Windows功能” --> 勾选 Hyper-V 和容器复选框 --> 下载 docker 安装包直接安装。
注：出现 “WSL 2 installation is in...” 报错时，需要安装 linux 内核更新包。

2. Linux brash 脚本安装：
`curl -flSL get.docker.com -o get_docker.sh`   下载文件安装包
`sudo sh get_docker.sh --mirror Aliyun`   镜像下载

3. 添加加速镜像
setting --> Docker Engine 添加
```
"registry-mirrors": ["https://docker.mirrors.ustc.edu.cn/",
                     "https://hub-mirror.c.163.com/",
                     "https://reg-mirror.qiniu.com"],
```
检查是否生效：`docker info`

<img src="/imgs/tools/docker/docker1.png" style="zoom:60%;" />

## docker 架构

Client：`docker build`，`docker pull`，`docker run`。。。

Docker Host：docker daemon(服务器组件)，images(文件)，Container(image的实例化)

Registry：

```bash
-it  # 以交互模式进入镜像
-t   # 为镜像命名
-d   # 以后台方式启动容器
--name  # 为容器命名
-p   # 端口映射
```

## docker 启停操作

```bash
systemctl status docker  # 查看状态  ubuntu: service docker status
systemctl start docker  # 启动
systemctl stop docker  #停止
systemctl restart docker  #重启

# 2.
docker info  # 查看引擎版本
# 注权限不足时，添加用户权限：
sudo gpasswd - a username docker  # 将用户username加入docker 组
newgrip docker  # 更新docker 组

# 3.
systemctl enable docker  # 设置开机自启动

# 4.建立docker组，并使用root用户（安全性）
sudo groupadd docker  # 建组
sudo usermod - aG docker $USER
```

## dockers 操作
```bash
# 1. 查看操作
docker image                 # 查看镜像

docker ps                    # 查看当前正在运行的所有容器
docker ps -q                 # 静默模式，查看正在运行的容器id
docker ps -a                 # 查看容器id（运行 & 非运行）

docker logs 容器名/容器id      # 查看容器日志（瞬间）
docker logs -f 容器名/容器id   # 实时展示日志
docker logs -tf 容器名/容器id  # 加入时间戳实时展示日志
docker logs --tail x 容器名/容器id  # 只显示日志的最后 x 行

docker top 容器名/容器id        # 查看容器内的进程
docker inspect 容器名/容器id    # 查看容器内部细节

# 2. 安装
docker load - i xx.tar           # 将tar镜像文件(安装包)导入到自己的库中

# 3. 运行
docker run 镜像名/镜像id                            # 运行一个容器
docker run -p 8080(local): 8080(container) 镜像名  # 主机端口与容器端口进行映射
docker run -d -p 8080: 8080 镜像名                 # 放到后台运行容器
docker run -d -p 8080: 8080 --name 容器名称 镜像名  # 为镜像取名

# 4. 启动/关闭容器
docker start 容器名/容器id    # 启动容器
docker restart 容器名/容器id  # 重启容器
docker stop 容器名/容器id     # 正常停止容器
docker kill 容器名/容器id     # 立即停止容器

# 5. 删除
docker rm 容器名/容器id          # 删除已经停止的容器
docker rm -f 容器名/容器id       # 删除某个（停止 & 运行）容器
docker rm -f $(docker ps -aq)  # 删除所有容器

# 6. 容器交互
docker exec - it 容器名/容器id bash  # 进入容器内部执行命令行
   exit                        # 退出
docker cp 容器名/容器id:容器路径 本地路径  # 将容器中的文件复制到本地
docker cp 文件/目录(local) 容器名/容器id:/资源路径  # 将本地文件复制到容器中

# 7. 数据卷 volume
# 将主机目录中全部内容会被清空
docker run -d -p 8080: 8080 --name xx -v 宿主机目录(绝对路径): 容器内目录 容器名/容器id
# aa代表数据卷的名字，docker会在不存在时自动创建，并在启动容器时将aa对应目录中全部内容复制到映射目录中
docker run -d -p 8080: 8080 - -name xx -v aa(别名): 容器内目录 容器名/容器id

# 8. 容器打包成新的镜像
docker commit -m "描述" -a "作者" 容器id 镜像名

# 9. 将镜像备份出来
docker save 镜像名: Tag(版本号) -o 文件名(保存在哪个文件)
```

## docker 打包

```bash
# 1. 打包
docker save <docker images ID> -o <dacker_name.tar>

# 2. 加载压缩包
tar -xvf <docker_name.tar> -C ./docker_name/
cd docker_name
tar -cf - . | docker load
docker run -it <IMAGE_NAME> /bin/bash
```