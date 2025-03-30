# cmake

cmake可以跨平台，makefile不能跨平台，cmake根据不同的平台来创建对应的makefile

对源文件`.c/.cpp`想变成可执行文件，需要通过编译器编译，编译器就是一系列的工具链`toolchain`，主要分成四个部分：

- 预处理器（头文件展开，宏替换，去注释）-> `.c/.cpp`
- 编译器（gcc/g++）编译 -> 汇编文件
- 汇编器处理 -> 二进制文件（win: `.obj`）/（Linux: `.o`）
- 链接器对二进制文件链接 -> 可执行程序（二进制）

使用方法：

1. 单个文件直接命令编译，大的项目需要写makefile（文件名：makefile）-> 用make执行
2. 创建`cmakelist.txt` -> 用cmake执行 -> 生成makefile文件 -> 用make执行

makefile，cmake不仅能够生成可执行文件，还可以生成库文件（动态库，静态库）-> 放到第三方项目中使用，（为什么用可文件而不是源代码？保密性、打包简洁）

```bash
cmake --version
touch CMakeLists.txt
```

```cmake
# 这是一个注释
#[[这是一个注释块， 
 可以注释多行]]

cmake_minimum_required(VERSION 版本号)  # optional，指定cmake的最低版本
project(<项目名>) # optional
project (<项目名> []
    <版本>)
include_directories(<头文件路径>)
add_executable(<生成可执行程序名> <源文件名1> <源文件名2> ...)  # 生成可执行文件

# 上面add_executable对于较多文件不友善，可以使用set定义变量
set(<变量名> <变量1> <变量2> ...)
set(SRC_LIST add.c div.c)  # SRC_LIST=(add.c div.c)
add_executable(app ${SRC_LIST})

# 上面set对于较多文件还是不友善，可以使用文件搜索（两种方式）
aux_source_directory(<路径> <变量名>)  # 将路径下的.c/.cpp文件名赋值给变量名
aux_source_directory(${PROJECT_SOURCE_DIR} SRC)  # PROJECT_SOURCE_DIR: CMakeList.txt文件路径
add_executable(app ${SRC})

file(GLOB/GLOB_RECURES <变量名> <文件路径和文件类型>)  # GLOB：当前文件；GLOB_RECURES：递归搜索
file(GLOB SRC ${PROJECT_CURRENT_SOURCE_DIR}/*.cpp)  # PROJECT_CURRENT_SOURCE_DIR: CMakeList.txt文件路径
add_executable(app ${SRC})
```

```bash
cmake ./CMakeList.txt路径  # 看到 CMakeFiles文件说明成功
# 生成很多文件，最好新建一个目录build，到build目录下执行cmake

cmake .  # 生成Makefile文件
make  # 由makefile文件生成程序
```



