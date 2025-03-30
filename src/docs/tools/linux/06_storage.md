# 存储结构与管理硬盘

Linux系统严格区分大小写，其根下目录：
```bash
/boot  # 开机所需文件
/dev   # DEVices 设备与接口
/etc   # Editable Text Configuration 存放配置文件
/home  # 用户目录
/bin   # BINaries
/lib   # LIBrary 函数库
/sbin  # Superuser BINaries 开机过程中需要的命令
/media # 挂载设备文件目录
/opt   # Optional application software packages 存放第三方软件
/root  # 系统管理员目录
/tmp   # TeMPorary 共享临时目录
/proc  # PROCesses 进程文件
/usr   # Unix Shared Resources 用户文件
    /local  # 用户自行安装软件
    /sbin   # 
    /share  # 共享文件
/mnt   # mount 挂接光驱、USB设备的目录，加载后，会在mnt里多出相应设备的目录
/var   # VARiable 是储存各种变化的文件，比如log等等
```

## 1. 物理设备命名规则
Linux系统中一切皆文件，设备也不例外。

| 硬件设备      | 文件名称             |
| ------------- | -------------------- |
| IDE设备       | /dev/hd[a-d]         |
| SCSI/SATA/U盘 | /dev/sd[a-z]         |
| Virtio设备    | /dev/vd[a-z]         |
| 软驱          | /dev/fd[0-1]         |
| 打印机        | /dev/lp[0-15]        |
| 光驱          | /dev/cdrom           |
| 鼠标          | /dev/mouse           |
| 磁带机        | /dev/st0 或 /dev/ht0 |

硬盘分区类型：
- 主分区：存储分区表信息
- 扩展分区：并不是真正的分区，需要划分成多个逻辑分区来使用
- 逻辑分区：存储单元

硬盘最多有四个分区，一般为三个主分区 + 一个扩展分区。

新的硬盘设备需要先分区，在格式化文件系统，最后才能挂载并使用。

## 2. 挂载硬件设备

UUID（Universally Unique Identifier，通用唯一识别码），挂载时设备名可能存在变化，最好使用UUID名挂载。

```bash
blkid [设备名]          # 显示设备的属性(查看UUID) block id
mount 文件系统 挂载目录  # 挂载文件系统
    -a  # 挂载所有在/etc/fstab中定义的文件系统
    -t  # 指定文件系统的类型

# 注：mount挂载，在系统重启后挂载会失效，常用文件写入挂载
eg: vim /etc/fstab
       设备文件      挂载目录  格式类型  权限选项 是否备份 是否自检
    >> /dev/sdb2    /backup    ext4    defaults    0    0
    mount -a
    
df -h  # 查看已挂载的磁盘空间使用情况(列表)，disk free
lsblk  # 查看已挂载的磁盘空间使用情况(树状), list block id

unmount [设备文件/挂载目录]  # 卸载设备或文件系统，un mount
eg: unmount /dev/sdb2
```

## 3. 虚拟机添加硬盘设备

编辑虚拟机设置 --> 添加 --> 硬盘 --> SATA --> 创建新虚拟磁盘 --> 将虚拟磁盘拆分成多个文件

```bash
fdisk 磁盘名称  # 创建，修改和删除磁盘的分区表信息, format disk
    交互式参数输入
    m  # 查看可用参数
    n  # 添加新分区
    d  # 删除某个分区
    l  # 列出所有可用分区
    t  # 改变分区类型
    p  # 查看分区表信息
    w,q  # 保存/退出
    
du -sh 目录名称  # 查看分区或目录所占用磁盘容量大小
```

## 4. 添加交换分区

交换(SWAP)分区：通过在硬盘中预先划分一定的空间，然后把内存中的暂时不常用的数据临时存放到硬盘中，以便腾出物理内存空间让更活跃的程序服务来使用。其目的是为了解决真实物理内存不足的问题。

```bash
mkswap 设备名称  # 对新设备进行交换分区格式化，make swap
swapon 设备名称  # 激活新的交换分区设备，swap on
free -m         # 查看交换分区的大小

eg: fdisk /dev/sdb  ->n  ->p ->w  # 添加一个新分区
    mkswap /dev/sdb2
    swapon /dev/sdb2
    vim /etc/fstab
    >> /dev/sdb2    swap    swap    defaults    0    0
```

## 5. quota 磁盘容量配额

限制用户或用户组对特定文件夹可以使用的最大硬盘空间或最大文件个数。

- 软限制：达到限制时会提示，仍可以继续使用
- 硬限制：达到限制时会提示，且终止用户操作

```bash
# 1. 开启quota技术
vim /etc/fstab
>> UUID-...    /boot    xfs    default,uquota    1    2
reboot
mount | grep boot  # 查看是否支持quota技术

xfs_quota [参数] 配额 文件系统  # 管理设备的磁盘容量配额，专门针对XFS文件系统管理quota

edquota [参数] 用户名  # 管理系统的磁盘配额，edit quota
    -u  # 对用户设置
    -g  # 对用户组设置
    -p  # 复制原有的规则到新的用户/用户组
    -t  # 限制宽限期限
# 注：edquota 会调用vim来修改具体细节。
```

## 6. VDO 虚拟数据优化

VDO（Virtual Data Optimize）：通过压缩或删除存储设备上的数据来优化存储空间。其关键是对硬盘内原有的数据进行删重操作，并且还可以对日志，数据库进行自动压缩，进一步减少存储浪费。

- 部署虚拟机或容器：逻辑存储 : 物理存储 = 10 : 1；
- 部署对象存储（eg: Ceph）：逻辑存储 : 物理存储 = 3 : 1

```bash
# 1.安装VDO
dnf install kmod-kvdo vdo

# 2.创建VDO卷
           设备卷名称      由哪块磁盘制作      制作后的设备大小
vdo create --name=storage --device=/dev/sdc --vdoLogicalSize=200G

# 3.查看新建卷信息
vdo status --namme=storage

# 4.格式化操作并挂载
mkfs.xfs /dev/mapper/storage  # 将VDO设备卷放到/dev/mapper目录下，并以设备名命名；make file system
udevadm settle                # 刷新
mount /dev/mapper/storage /storage

# 5.查看使用情况
vdostatus --human-readable  # 实际使用
df -h                       # 逻辑存储

# 6.设备挂载为永久
blkid /dev/mapper/storage  # 查看UUID
vim /etc/fstab
>> UUID=xxxx    /storage    /xfs    defaults,_netdev    0    0  # 缺失_netdev,则电脑重启不了
```

## 7. 软硬方式链接

- 软连接（soft link）：通过链接访问原始文件的数据；当原始文件被删除或移动后，新的链接文件也会随之失效，不能被访问。
- 硬链接（hard link）：可以通过链接访问原始文件数据，也可以直接通过链接访问数据；原始文件被删除后，仍可以通过硬链接来访问。

```bash
ln [参数] 原始文件名 链接文件名  # 创建文件的软硬链接，link
    -s  # 创建软链接，不加-s默认创建硬链接
    -f  # 强制创建
    -i  # 覆盖先前询问
    -v  # 显示创建链接过程
eg: ln -s old.txt new.txt
```
