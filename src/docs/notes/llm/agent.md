


## 12-factor-agents

## 1. 从自然语言到 Tool Calling

Agent 构建中最常见的模式是将自然语言转换为结构化 Tool Call。例如以function call的方式调用 web search：

```python
from openai import OpenAI

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "在网络上搜索信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"}
                },
                "required": ["query"]
            }
        }
    }
]

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4.1",
    messages=[{"role": "user", "content": "帮我查一下北京今天的天气"}],
    tools=tools
)

functions = completion.choices[0].message.tool_calls
if functions[0].function.name == "search_web":
    ... # search process
else:
    ...
```

## 2. 透明化 prompt

很多框架提供下面 "黑盒" 的方法来构造 prompt，虽然很简单，但很难调优或逆向工程以获得完全正确的 Token 输入到模型。

```python
agent = Agent(
  role="...",
  goal="...",
  personality="...",
  tools=[tool1, tool2, tool3]
)

task = Task(
  instructions="...",
  expected_output=OutputModel
)

result = agent.run(task)
```

## 3. 

## 4. 结构化模型输出
