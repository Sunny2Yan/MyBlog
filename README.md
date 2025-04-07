# MyBlog
This is my knowledge base, primarily documenting key insights from my studies and professional work.


## markdown 使用方法
1. markdown 公式支持
```text
npm add -D markdown-it-mathjax3

xport default {
  markdown: {
    math: true
  }
}
```

2. markdown 图片懒加载
```text
export default {
  markdown: {
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true
    }
  }
}
```

3. markdown代码块添加行号
```text
export default {
  markdown: {
    lineNumbers: true
  }
}
```

4. markdown 使用
```text
1) 内部链接写法
[Home](/) <!-- 将用户导航至根目录下的 index.html -->
[foo](/foo/) <!-- 将用户导航至目录 foo 下的 index.html -->
[foo heading](./#heading) <!-- 将用户锚定到目录 foo 下的index文件中的一个标题上 -->
[bar - three](../bar/three) <!-- 可以省略扩展名 -->
[bar - three](../bar/three.md) <!-- 可以添加 .md -->
[bar - four](../bar/four.html) <!-- 或者可以添加 .html -->

2) 外部链接写法
<a href="https://example.com" target="_blank" rel="noreferrer">点击这里</a>
# target="_blank" 表示从新的标签页打开，而不是当前页面跳转
rel="noreferrer"> 表示不传递 Referer 信息，防止潜在的安全风险

3) 表格
| Tables        |      Are      |  Cool |
| ------------- | :-----------: | ----: |
| col 3 is      | right-aligned | $1600 |
| col 2 is      |   centered    |   $12 |
| zebra stripes |   are neat    |    $1 |

4) Emoji
:tada: :100:

5) 目录
[[toc]]  # 输出当前页面的标题目录

6) 自定义容器，即颜色块
::: tip
This is a tip.
:::

::: danger STOP
危险区域，请勿继续
:::

::: details 点我查看代码
折叠区域
:::

7) github风格报警，同6）
> [!NOTE]
> 强调用户在快速浏览文档时也不应忽略的重要信息。

8）代码高亮，可以指定某一行突出高亮
\```python{4}  第四行高亮，或 {4-10， 15}
// [!code highlight]  可以直接在某一行后添加此注释实现高亮, 注意注释方式，python用#
// [!code focus]  同上模糊聚焦
// [!code --] 或 // [!code ++] 实现颜色差异
// [!code warning] 或 // [!code error] 错误和警告

9) 从某一行启用行号
···python:line-numbers {1}

10) 代码组
::: code-group

\```python [aaa.py]
这是代码一
\```

\```python [bbb.py]
这是代码二
\```

:::

11) 包含其他markdown，即将另一个markdown内容复制到此markdown
<!--@include: ./first.md-->

12) 标题添加状态
### Title <Badge type="info" text="default" />
### Title <Badge type="tip" text="^1.9.0" />
### Title <Badge type="warning" text="beta" />
### Title <Badge type="danger" text="caution" />
```

