# 常用系统命令

## 1. 系统工作命令

```bash
reboot               # 重启系统
poweroff             # 关闭系统
echo [字符串] [变量]  # 在终端输出
wget                 # web get 下载网络文件
    -b  后台下载
    -p  下载到指定目录
    -r  递归下载
date [时间格式]      # 显示系统时间
timedatectl [参数]   # time date control 设置系统时间
    status  显示状态
    list-timezones  列出已知时区
    set-time  设置系统时间
ps [参数]            # processes 查看系统进程状态
    -a  所有进程
    -u  用户及其他信息
    -x  没有控制终端的进程
pstree              # process tree 已树状图显示进程
top                 # 显示系统负载
nice                # 调整进程优先级
pidof xxx           # 查看服务的PID值
kill  xxx           # 终止进程
    -9  强制杀死
```

## 2.系统状态检测命令

```bash
ifconfg [参数] [网络设备]  # interface config 查看网络状态
uname [-a]                # unix name 查看系统内核
who                       # 查看登入主机的用户信息
last                      # 调取主机的被访记录
uptime                    # 查看系统负载（越低越好）
free [-h]                 # 查看内存使用信息
ping [参数]               # 测试网络连通性
    -c  总共发送次数
    -l  指定网卡名称
    -I  每次间隔时间
    -W  最长等待时间
tracepath 域名            # 数据包到达主机时经过的所有路由
netstat [参数]            # network status 显示网络连接、路由表、接口状态
    -a  连接中的所有Socket
    -p  正在使用的Socket信息
    -t  TCP协议连接状态
    -u  UDP协议连接状态
    -i  网卡列表信息
    -r  路由表信息
history [参数]            # 显示命令历史
    -c  清空命令历史记录
sosreport                 # 收集系统配置及架构信息，并输出诊断文档
```

## 3. 文件定位命令

```bash
pwd                  # print working directory 当前所处目录
cd [参数] [目录]      # change directory 切换工作路径
    ..  返回上一级
    ~   根目录
ls [参数] [文件名称]  # list 显示目录中的文件信息
    -a  全部，包括隐藏文件
    -l  详细信息
    -d  目录属性(.pki)
tree                 # 树状图显示目录
find [范围] 条件      # 按指定条件查找文件对应位置
    -name  匹配名称
    --type 匹配文件类型
locate 文件名         # 按名称快速搜索文件对应位置（较于find效率更高）
    eg: locate whereis
whereis 命令名        # 按名称快速搜索二进制程序（命令），源代码及帮助文档对应位置
which 命令名          # 在环境变量$PATH设置的目录里查找符合条件的文件
```

## 4. 文本文件编辑命令

```bash
cat [参数] 文件名       # concatenate 查看纯文本文件
    -n  # 显示行号
more [参数] 文件名      # 查看内容较多的纯文本文件
head [参数] 文件名      # 查看纯文本的前N行
    -n  # 行号
tail [参数] 文件名      # 查看纯文本的后N行
    -n  # 行号
    -f  # 持续刷新文件内容，如实时查看日志内容
tr [原始字符][目标字符]  # translate，替换文本内容中的字符
    eg: cat xx.txt | tr [a-z] [A-Z]
wc [参数] 文件名        # word counts，统计文件的行数字数和节数
    -l  # 行数
    -w  # 单词数
    -c  # 字节数
stat 文件名             # status，查看文件的具体存储细节，时间等信息
grep [参数] 文件名      # 按行提取文本内容
    -n  # 显示行号  
    -v  # 反向选择
    -I  # 忽略大小写
    -c  # 仅显示找到的行数
cut [参数] 文件名       # 按列提取文件内容
    -f  # 设置需要查看的列数，eg: -f 1
    -d  # 设置间隔符号，eg: -d ,
diff [参数] 文件A 文件B  # different，比较多个文件内容的差异
    --brief # 判断文件是否相同 
    -c  # 描述文件内容的具体不同
uniq [参数] 文件名       # unique，去除文本中连续的重复行
sort [参数] 文件名       # 对文本内容进行再排序
    -f  # 忽略大小写
    -b  # 忽略缩进与空格
    -n  # 以数值型排序
    -r  # 反向排序
    -u  # 去除重复行
    -t  # 指定间隔符
    -k  # 设置字段范围
    eg: sort -t : -k 3 -n xxx.txt  # 以:间隔，第三个字段为排序依据，并用数字排序
```

## 5. 文件目录管理命令

```bash
touch [参数] 文件名       # 创建空白文件
    -a  # 修改访问时间
    -m  # 修改修改时间
    -d  # 同时修改访问和修改时间
mkdir [参数] 目录名       # make directory，创建空目录
    -p  # 递归创建嵌套目录，eg: mkdir -p a/b/c
cp [参数] 源文件 目标文件  # copy, 复制文件或目录
    -r  # 递归复制目录
    -p  # 保留原始文件属性
    -d  # 保留链接文件属性
    -i  # 目标文件覆盖询问
    -a  # = -pdr
mv [参数] 源文件 目标文件  # move，剪切或重命名文件
rm [参数] 文件名          # remove，删除文件或目录
    -f  # 强制删除
    -i  # 删除前询问
    -r  # 递归删除目录
    -v  # 显示过程
file 文件名              # 查看文件类型
tar [参数] 文件名        # 压缩或解压文件
    -c  # 压缩文件
    -x  # 解压文件
    -t  # 查看压缩包内有哪些文件
    -z  # 用gzip压缩或解压
    -j  # 用bzip2压缩或解压
    -v  # 显示过程
    -f  # 目标文件名
    -C  # 解压到指定目录
```

## 6. 文件传输

```bash
# 本地迁移到指定服务器
scp -r /xxx name@ip:/xxx  # 目录
scp /xxx.tar name@ip:/xxx  # 文件

# 指定服务器迁移到本地
scp -r name@ip:/xxx /xxx  # 目录
scp name@ip:/xxx.tar /xxx  # 文件

# 注：如果远程服务器防火墙有为scp命令设置了指定的端口，需要 -P 来设置命令的端口号
scp -r -P 3000 
```
