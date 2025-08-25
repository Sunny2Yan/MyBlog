# UV 使用

## 1. UV 安装
curl -LsSf https://astral.sh/uv/install.sh | sh


## 2. UV 管理

### 2.1 管理python版本

虚拟环境 (venv / uv venv) 不会“创造”Python，它只是复制/链接一个已经存在的解释器。因此只能用机器上已有的 Python 版本来创建虚拟环境。
可以使用 `uv python` 来对机器上的 python 版本进行管理。它会把对应的 Python 版本下载到 `~/.local/share/uv/python/` 目录下，完全独立于系统。

```bash
uv python install 3.11  # 安装 Python3.11 版本。
uv python list  # 查看可用的 Python 版本。
uv python find  # 查找已安装的 Python 版本。
uv python pin 3.11  # 为当前项目指定使用的 Python 版本。
uv python uninstall  # 卸载 Python 版本。
```

### 2.2 管理虚拟环境
注意：本节管理虚拟环境适合于临时测试或开发环境，不会修改pyproject.toml。2.3节管理项目中会依赖于pyproject.toml文件。

```bash

uv venv  # 创建一个虚拟环境, 默认.venv。
uv venv --python=3.11 .venv1  # 创建一个名为.venv1的虚拟环境

source .venv1/bin/activate  # linux激活环境
.venv1\Scripts\Activate  # win激活环境
deactivate  # 退出环境
rm -rf .venv1  # 删除环境

uv pip insatll XXX  # 在环境中添加依赖
uv pip uninstall XXX  # 删除依赖
uv pip show XXX  # 显示有关已安装软件包的详细信息
uv pip freeze  # 列出已安装的软件包及其版本
uv pip check  # 检查当前环境是否有兼容的包
uv pip list  # 列出已安装的软件包
uv pip tree  # 查看环境的依赖关系树

uv pip compile  # 将需求编译成锁文件
uv pip sync  # 使用锁文件同步环境
```

### 2.3 管理项目

```bash
uv init  # 创建一个新项目，包含git，README...
uv add XXX  # 往项目环境里添加依赖，会修改 pyproject.toml
uv remove XXX  # 从环境中移除依赖
uv run  # 运行脚本
uv sync  # 同步项目依赖到环境，同pip install -r requirements.txt
uv lock  # 为项目依赖创建锁文件
uv tree  # 查看项目的依赖树
uv build  # 构建项目的分发包
uv publish  # 将项目发布到包索引
```

### 2.4 管理UV

```bash
uv cache clean  # 清理缓存条目
uv cache prune  # 清理过期的缓存条目
uv cache dir  # 显示 uv 缓存目录路径
uv tool dir  # 显示 uv 工具目录路径
uv python dir  # 显示 uv 安装的 Python 版本路径
uv self update  # 将 uv 更新到最新版本
```

### 2.5 管理工具
安装 CLI 工具，并将其暴露到 shell 中

```bash
uv tool install XXX  # 全局安装工具
uv tool uninstall XXX  # 卸载工具
uv tool list  # 列出已安装的工具
uv tool update-shell  # 更新 shell，使工具可执行文件生效
```