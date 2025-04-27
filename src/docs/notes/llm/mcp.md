# Model Context Protocol

MCP 是一个 open protocol，规范了应用程序向 LLM 提供上下文的方式。
类似于 USB-C 端口，提供了一种标准化的方式将 AI 模型连接到不同的数据源和工具。

MCP 的核心遵循 Client-Server 架构，其中主机应用程序可以连接到多个服务器：
![](/imgs/notes/llm/mcp/framework.png)

- MCP Host：如 Claude Desktop、IDE 或 AI tools 的程序，需要通过 MCP 访问数据；
- MCP Client：与服务器保持一对一连接的协议客户端；
- MCP Server：轻量级程序，每个程序都通过标准化模型上下文协议公开特定功能；
- Local Data Source：MCP 服务器可以安全访问的您计算机上的文件、数据库和服务；
- Remote Service：MCP 服务器可以通过互联网（例如通过 API）连接到的外部系统。

## 1. 核心架构

- Hosts：是发起连接的 LLM applications (如：Claude Desktop 或 IDEs) 
- Clients：在 host 应用程序内与 server保持 1:1 连接；
- Servers：向 Client 提供 context、tools 和 prompts。

![](/imgs/notes/llm/mcp/architecture.png)

## 2. 核心组件

### 2.1 Protocol layer
协议层处理消息框架、请求/响应链接和高级通信模式。

主要包含三个类：
Protocol
Client
Server

### 2.2 Transport layer
传输层负责处理客户端和服务器之间的实际通信。MCP 支持多种传输机制：

- Stdio 传输: 标准输入/输出通信。适合本地流程；
- 带有 SSE 的 HTTP 传输：server 到 client 使用 Server-Sent Events，client 到 server 使用 HTTP POST 发送消息。

主要消息类型：
::: code-group 

```python [Requests]
# 期望得到对方的响应
interface Request {
  method: string;
  params?: { ... };
}
```

```python [Results]
# 对请求的成功响应
interface Result {
  [key: string]: unknown;
}
```

```python [Errors]
# 表明请求失败
interface Error {
  code: number;
  message: string;
  data?: unknown;
}
```

```python [Notifications]
# 单向消息，不期望得到响应
interface Notification {
  method: string;
  params?: { ... };
}
```

:::

## 3. Connection lifecycle
### 3.1 初始化
![](/imgs/notes/llm/mcp/lifecycle.png)

1. client发送带有 protocol 版本和能力的 initialize 请求；
2. server 响应其 protocol 版本和功能；
3. client 发送 initialized 通知作为确认；
4. 开始正常 message 交换。

### 3.2 message交换
Request-Response：Client 或 server 一方请求另一方响应；
Notifications：任何一方发送单向通知。

### 3.3 Termination
client server任意一方都可以断开链接：

1. 使用 `.close()` 终止；
2. Transport 断开；
3. 错误条件。

## 4. MCP Develop
### 4.1 Server Develop
构建一个MCP Server，需要包含两个工具：`get-alerts` 和 `get-forecast`。
然后，将 Server 连接到 MCP Host。

MCP Server提供以下三种主要类型的功能：
- Resources：client可以读取的数据（例如 API 响应或文件内容）
- Tools：可被 LLM 调用的函数（经用户批准）
- Prompts：预先编写的模板，帮助用户完成特定任务。

### 4.2 Client Develop
MCP Client 包含：`Client Initialization`、`Server Connection`、`Query Processing`、`Interactive Interface`、`Resource Management`五个组件。

Client 工作流程为：
1. 连接到指定服务器
2. 列出可用的工具
3. 启动交互式聊天会话，您可以：
4. 输入查询
5. 查看工具执行
6. 获得 LLM 的 response

### 4.3 Develop Example

::: code-group
```python [mcp_server.py]
# 一个提供天气的Server 示例：
# uv add "mcp[cli]" httpx  # 必要的依赖

from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather")  # 初始化 MCP Server

NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "weather-app/1.0"

async def make_nws_request(url: str) -> dict[str, Any] | None:
    """获取天气信息"""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception:
            return None

def format_alert(feature: dict) -> str:
    """Format an alert feature into a readable string."""
    props = feature["properties"]
    return f"""
Event: {props.get('event', 'Unknown')}
Area: {props.get('areaDesc', 'Unknown')}
Severity: {props.get('severity', 'Unknown')}
Description: {props.get('description', 'No description available')}
Instructions: {props.get('instruction', 'No specific instructions provided')}
"""

# 需要编写的两个主函数
@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if not data["features"]:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # First get the forecast grid endpoint
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location."

    # Get the forecast URL from the points response
    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Format the periods into a readable forecast
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:  # Only show next 5 periods
        forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
        forecasts.append(forecast)

    return "\n---\n".join(forecasts)


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')
```

```python [mcp_client.py]
import asyncio

from typing import Optional
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from dotenv import load_dotenv


class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic()
    # methods will go here

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server

        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        is_python = server_script_path.endswith('.py')
        is_js = server_script_path.endswith('.js')
        if not (is_python or is_js):
            raise ValueError("Server script must be a .py or .js file")

        command = "python" if is_python else "node"
        server_params = StdioServerParameters(
            command=command,
            args=[server_script_path],
            env=None
        )

        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()

        # List available tools
        response = await self.session.list_tools()
        tools = response.tools
        print("\nConnected to server with tools:", [tool.name for tool in tools])

    async def process_query(self, query: str) -> str:
        """Process a query using Claude and available tools"""
        messages = [
            {
                "role": "user",
                "content": query
            }
        ]

        response = await self.session.list_tools()
        available_tools = [{
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in response.tools]

        # Initial Claude API call
        response = self.anthropic.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=messages,
            tools=available_tools
        )

        # Process response and handle tool calls
        final_text = []

        assistant_message_content = []
        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
                assistant_message_content.append(content)
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input

                # Execute tool call
                result = await self.session.call_tool(tool_name, tool_args)
                final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")

                assistant_message_content.append(content)
                messages.append({
                    "role": "assistant",
                    "content": assistant_message_content
                })
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": content.id,
                            "content": result.content
                        }
                    ]
                })

                # Get next response from Claude
                response = self.anthropic.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    messages=messages,
                    tools=available_tools
                )

                final_text.append(response.content[0].text)

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        while True:
            try:
                query = input("\nQuery: ").strip()

                if query.lower() == 'quit':
                    break

                response = await self.process_query(query)
                print("\n" + response)

            except Exception as e:
                print(f"\nError: {str(e)}")

    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()


async def main():
    if len(sys.argv) < 2:
        print("Usage: python client.py <path_to_server_script>")
        sys.exit(1)

    client = MCPClient()
    try:
        await client.connect_to_server(sys.argv[1])
        await client.chat_loop()
    finally:
        await client.cleanup()


if __name__ == "__main__":
    import sys
    asyncio.run(main())
```
:::