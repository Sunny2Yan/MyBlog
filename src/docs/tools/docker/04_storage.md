# Docker Storage

docker volume: docker 的一种存储机制，是一个目录或文件。volume 数据可以被永久保存，即使使用它的容器已被销毁。docker 提供两种类型的 volume：bind mount，docker managed volume。

```python
# 1.bind mount: 将host上已存在的目录或文件mount到容器
-v <host path>:<container path>
eg: docker run -d -p 80:80 -v ~/test:/home/xxx:ro ubuntu
    # :ro设置只读权限，default可读可写。
    
# 2.docker managed volume: 不需要指明mount源，指明mount point就行
-v <container path>
eg: docker run -d -p 80:80 -v /home/xxx ubuntu
```

```python
# 容器与host数据共享
docker cp ~/xxx ubuntu_name:/usr/local/apache

# volume container (数据在host)
1.创建共享容器(只提供数据，不运行，create)
docker create --name vc_data \
    -v ~/htdocs:/usr/local/apache  # bind mount 存放web server静态文件
    -v /other/useful/tools \       # docker managed volume 存放实用工具
    ubantu
2.共享容器(--volume-from)
docker run --name xxx -d -p 80 --volumes-from vc_data ubantu

# data-packed volume container (数据在container)
FROM ubuntu:latest
ADD htdocs /usr/local/apache
VOLUME /usr/local/apache

docker build -t datapacked .                         # 将dockerfile生成镜像
docker create --name vc_data datapacked              # 创建volume container
docker run -d -p 80:80 --volume-from vc_data ubuntu  # 创建容器
    
# 生命周期管理
1. volume实际上是host中的目录和文件 (/myregistry)
2. 迁移: docker run -d -p 80:80 -v /myregistry:/var/lib/registry registry:latest
3. 删除: docker volume rm xxx
4. 批量删除孤儿volume: docker volume rm $(docker volume ls -q)
```

