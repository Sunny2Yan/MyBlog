# gradio

添加等待动画：
```python
import gradio as gr
import time
import threading

stop_flag = threading.Event()

def pipeline(number, history):
    stop_flag.clear()
    for i in range(int(number)):
        if stop_flag.is_set():
            history.append((None, "⛔ 已终止"))
            yield history
            break

        # 显示“生成中...”
        history.append((None, "⏳ 正在生成..."))
        yield history
        time.sleep(0.5)  # 模拟动画前的等待

        # 替换最后一条为真实消息
        history[-1] = (None, str(i))
        yield history
        time.sleep(1.5)  # 等待剩余时间

def stop():
    stop_flag.set()
    return []

with gr.Blocks() as demo:
    chatbot = gr.Chatbot()
    user_input = gr.Textbox(show_label=False, placeholder="输入一个数字...", lines=2)
    with gr.Row():
        submitBtn = gr.Button("Submit", variant="primary")
        stopBtn = gr.Button("Terminate", variant="stop")

    submitBtn.click(fn=pipeline, inputs=[user_input, chatbot], outputs=chatbot)
    stopBtn.click(fn=stop, inputs=None, outputs=chatbot)

demo.launch()
```