# Linux 基础

VMware Workstation 网络模式：

- 桥接网络：物理机与虚拟机假设一道桥，通过物理机的网卡访问外网；
- 网络地址转换(NAT)：虚拟机网络服务发挥路由器的作用，虚拟机模拟的主机通过物理主机访问外网，VMnet8；
- 仅主机模式：虚拟机的系统仅与主机通讯，不能访问外网，VMnet1；


## 1. 包管理

```bash
# 1. Based Red Hat(Fedora、CentOS) .rpm
# yum -> dnf
yum repolist all  # 列出所有仓库
yum list all      # 列出仓库中所有软件包
yum info xxx      # 查看软件包信息
yum install xxx   # 安装软件包
yum update xxx    # 升级软件包
yum remove xxx    # 移除软件包
yum check-update  # 检查可更新的软件包
yum clean all     # 清除所有仓库缓存

# 2. Based Debian(Ubuntu)  .deb
apt list              # 查看所有包
apt list --installed  # 查看所有已安装的包
apt install xxx       # 安装包
apt update xxx        # 更新包     
apt remove xxx        # 删除包并保留配置文件
apt purge xxx         # 删除包并删除配置文件
apt clean             # 删除所有已下载的包
apt autoclean         # 删除过期的包
```

## 2. 服务控制

```bash
systemctl start xxx    # 启动服务
systemctl restart xxx  # 重启服务
systemctl stop xxx     # 停止服务
systemctl reload xxx   # 重新加载配置文件
systemctl status xxx   # 查看服务状态
```

## 3. 修改root密码

```bash
# 1. CentOS
# 1.1 未忘记密码
passwd root
# 1.2 忘记密码
开机时选择第一项并按下 e 键； ->  在第一行参数后加 rd.break 并按 Ctrl+X 执行  ->  再依次输入：
    mount -o remount,rw /sysroot
    chroot /sysroot
    passwd
    touch /.autorelabel
再连续两次按 Ctrl+D 退出并重启
```

## 4. 命令全称
::: details details
```bash
alias = Create your own name for a command
bash = GNU Bourne-Again Shell linux内核
cat = Concatenate 串联
chown= Change owner 改变所有者
chgrp= Change group 改变用户组
chmod= Change mode 改变模式
df= Disk free 空余硬盘
du= Disk usage 硬盘使用率
grep= global regular expression print
insmod= Install module 安装模块
ldd= List dynamic dependencies 列出动态相依
lsmod= List module 列表模块
ps = Processes Status
pwd = print working Directory (打印工作目录)
ps= Process Status 进程状态
rm = ReMove
rpm = RPM Package Manager = RedHat Package Manager
rmmod= Remove module 删除模块
sed = Stream EDitor
seq = SEQuence
su= Swith user 切换用户，切换到root用户
sudo= Superuser do
tar= Tape archive 解压文件 （最初设计目的是将文件备份到磁带上）
tar = Tape ARchive
umount= Unmount 卸载
uname = Unix name 系统名称
wc = Word Count
wall = write all
```


## 5. 参数说明
::: details details
```bash
#: 管理员身份；$: 用户身份；su -:qi
Tab: 内容补全; Ctrl+C: 终止进程; Ctrl+D: 输入结束; Ctrl+L: 清空终端

-a
all : 全部，所有 (ls , lsattr , uname)
archive : 存档 (cp , rsync)
append : 附加 (tar -A , 7z)

-c
commands : 执行命令，带参数 (bash , ksh , python)
create : 创建 (tar)

-f
force : 强制，不经确认(cp , rm ,mv)
file : 文件，带参数 (tar)

-h
–help : 帮助
human readable : 人性化显示(ls , du , df)
headers : 头部

-i
interactive : 交互模式，提示(rm , mv)
include : 包含

-k
keep : 保留

-l
long listing format : 长格式(ls)
list : 列表
load : 读取 (gcc , emacs)

-m
message : 消息 (cvs)
manual : 手册 (whereis)
create home : 创建 home 目录 (usermod , useradd)

-n
number : 行号、编号 (cat , head , tail , pstree , lspci)
no : (useradd , make)

-p
parents 需要时创建上层目录，如目录早已存在则不当作错误

-q
quiet : 静默

-r
reverse : 反转
recursive : 递归 (cp , rm , chmod -R)

-u
user : 用户名、UID，带参数

-v
verbose : 冗长
version : 版本

-x
exclude : 排除 (tar , zip)

-y
yes

-z
zip : 启用压缩 (bzip , tar , zcat , zip , cvs)
```
:::
