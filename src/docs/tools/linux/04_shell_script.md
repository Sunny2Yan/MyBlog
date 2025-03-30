# Shell 脚本

Shell 脚本文件名称可以任意，但为了避免误认为是普通文件，建议以 `.sh` 后缀。shell 文件中：
- 第一行为 `#! /bin/bash` 声明shell解释器；
- 第二行为 `# 注释` 介绍脚本功能。

## 1. nohup 语句
```bash
python test.py                  # 执行代码文件
python test.py &                # 命令后面加上 & 实现后台运行
python test.py >out.txt 2>&1 &  # 后台运行并输出写入指定文件
```

上面使用 `&` 命令时，关闭当前控制台窗口或退出当前帐户时，作业就会停止运行。
nohup 命令可以在退出帐户或关闭窗口后继续运行进程。nohup 即 no hang up (不挂起)。

```bash
nohup python test.py &                # 脚本输出会被重定向到nohup.out的文件中
nohup python test.py >out.txt 2>&1 &  # 脚本输出到指定文件
# >out.txt 2>&1 表示输出和错误重定向到out.txt文件; & 让该命令在后台执行.
```

## 2. 字符串操作
```bash
# 1.命令太长，使用 \ 换行；

# 2.字符串拼接 
a, b = '123', '456'
c = $a$b

# 3.接受用户参数
$0: shell脚本程序的名称；$1：第一个位置参数；$#: 共有几个参数；$*: 所有位置的参数

# 4.一次执行多条命令
每个命令之间用;隔开: 各个命令都会执行
每个命令之间用&&隔开: 若前面的命令执行成功，才会去执行后面的命令。
每个命令之间用||隔开: 只有前面的命令执行失败后才去执行下一条命令，直到执行成功一条命令为止。
```

## 3. 运算符
```bash
测试语句格式：[ 条件表达式 ]  # 注意空格

# 1.文件测试参数
-d  # 是否为目录类型
-e  # 是否存在
-f  # 是否为一般文件
-r  # 当前用户是否有权限读取
-w  # 当前用户是否有权限写入
-x  # 当前用户是否有权限执行

# 2.整数比较运算符
-eq  # 是否等于  eg: [ 10 -eq 10 ]
-ne  # 是否不等于
-gt  # 是否大于
-lt  # 是否小于
-le  # 是否小于或等于
-ge  # 是否大于或等于

# 3.字符串比较运算符
=    # 字符串是否相同
！=  # 字符串是否不同
-z   # 字符串是否为空
```

## 4. 条件语句
```bash
# 1.一个条件
if [ ! -d $DIR ]  # 空格不能少 -z
then
    mkdir -p $DIR
fi

# 2.两个条件
if [ $? -eq 0 ]
then
    echo "hello"
else:
    ecjo "world"
fi

# 3.多个条件
if [ $GRADE -ge 85 ]; then
    echo "hello"
elif [ $GRADE -ge 70 ]; then
    echo "world"
else:
    echo "!"
fi
```

## 5. 循环语句
### 5.1 for 循环
```bash
for UNAME in `cat users.txt`
do
    xxx
done
```

### 5.2 while 循环
```bash
while true
do
    xxx
done
```

### 5.3 case 循环
```bash
case "$KEY" in
    [a-z] | [A-Z])
        echo "hello"
        ;;
    [0-9])
        echo "world"
        ;;
    *)
        echo "!"
esac
````

## 6. 计划任务服务

### 6.1 一次性计划任务
```bash
at 时间  # 创建一次性计划任务
    -f  # 指定包含命令的任务文件
    -q  # 指定新任务名称
    -l  # 显示待执行任务列表
    -d  # 删除指定的待执行任务
    -m  # 执行后向用户发送邮件
atrm 任务号  # 删除待执行任务
```

### 6.2 长期性计划任务
```bash
crontab -e  # 创建编辑计划任务
        -u  # 指定用户名称
        -l  # 列出任务列表
        -r  # 删除计划任务
```
