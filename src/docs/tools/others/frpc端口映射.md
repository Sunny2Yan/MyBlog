# frp 做端口映射

frp 分为client和server两个部分，在服务器上需要下载使用client，在跳板机上需要下载使用server。

## 下载 frpc

```bash
sudo apt update
sudo apt install frps（frpc）

# 配置文件路径
cd /etc/frp/
```

注意：一般可以直接 tar 安装包安装，位置可能不太一样

## 配置 client
```bash
# /etc/frp/frpc.ini

[common]  # 跳板机配置
server_addr = jump.example.com  # host
server_port = 7000  # port 保持默认
token = your_secure_token  # 配置token认证，需要与server保持一致

# 映射第一个端口（本地 8080 → 跳板机 9000）
[port1]
type = tcp
local_port = 8080
remote_port = 9000

# 映射第二个端口（本地 3306 → 跳板机 9001）
[port2]
type = tcp
local_port = 3306
remote_port = 9001

# 批量映射端口
[range_ports]
type = tcp
local_port = 10000-10005  # 本地端口范围
remote_port = 20000-20005 # 跳板机端口范围
```


## 配置server
```bash
# /etc/frp/frps.ini

[common]
bind_port = 7000  # frp 服务端默认监听端口
token = your_secure_token  # 必须与client一致（建议启用）

# 允许client绑定的端口范围（可选）
allow_ports = 9000-9002,20000-20005

# 其他安全设置（推荐）
max_pool_count = 50  # 限制连接池大小
authentication_timeout = 900  # 认证超时时间（秒）
```

修改配置后需要重启 frp 服务

```bash
./frps -c ./frps.ini  # frpc为程序，toml为配置文件

# 如果使用 systemd 管理
sudo systemctl restart frps
```


vpn 映射到服务器
```bash
# 1. 本地连接
ssh root@ip -p port -R 7890:127.0.0.1:7890

# 2. 服务器添加环境变量
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890
```