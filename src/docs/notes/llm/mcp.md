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

::: code-group 主要消息类型

\```python [Requests]
# 期望得到对方的响应
interface Request {
  method: string;
  params?: { ... };
}
\```

\```python [Results]
# 对请求的成功响应
interface Result {
  [key: string]: unknown;
}
\```

\```python [Errors]
# 表明请求失败
interface Error {
  code: number;
  message: string;
  data?: unknown;
}
\```

\```python [Notifications]
# 单向消息，不期望得到响应
interface Notification {
  method: string;
  params?: { ... };
}
\```

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


