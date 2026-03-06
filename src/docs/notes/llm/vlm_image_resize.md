# VLM Image Resize

## qwen-vl 处理
[addr](https://github.com/QwenLM/Qwen3-VL/blob/main/qwen-vl-utils/src/qwen_vl_utils/vision_process.py)


1. 图像处理
流程： 
   - 图像最长边与最短边的比值不高于200；
   - 宽和高四舍五入至28的倍数；
   - 图像总像素低于 max_pixels。即，$\frac{w}{\beta} \times \frac{h}{\beta} < \text{max\_pixels} \rightarrow \beta = \sqrt{\frac{wh}{\text{max\_pixels}}}$
   - 图像总像素高于 min_pixels。即，$\frac{w}{\beta} \times \frac{h}{\beta} > \text{min\_pixels} \rightarrow \beta = \sqrt{\frac{wh}{\text{min\_pixels}}}$
   - 对压缩后的宽高向上取整至28的倍数

::: details code
```python
def round_by_factor(number: int, factor: int) -> int:
    """四舍五入"""
    return round(number / factor) * factor


def ceil_by_factor(number: int, factor: int) -> int:
    """向上取整"""
    return math.ceil(number / factor) * factor


def floor_by_factor(number: int, factor: int) -> int:
    """向下取整"""
    return math.floor(number / factor) * factor

MAX_RATIO = 200
IMAGE_FACTOR = 28
MIN_PIXELS = 4 * 28 * 28
MAX_PIXELS = 16384 * 28 * 28

def fetch_image(img_path: str,  size_factor: int = IMAGE_FACTOR) -> Image.Image:
    image_obj = Image.open(img_path)
    image = image_obj.convert("RGB")
    width, height = image.size
    
    if max(height, width) / min(height, width) > MAX_RATIO:
        raise ValueError(f"absolute aspect ratio must be smaller than {MAX_RATIO}")
    
    h_bar = max(size_factor, round_by_factor(height, size_factor))
    w_bar = max(size_factor, round_by_factor(width, size_factor))
    if h_bar * w_bar > MAX_PIXELS:
        beta = math.sqrt((height * width) / MAX_PIXELS)
        h_bar = floor_by_factor(height / beta, size_factor)
        w_bar = floor_by_factor(width / beta, size_factor)
    elif h_bar * w_bar < MIN_PIXELS:
        beta = math.sqrt(MIN_PIXELS / (height * width))
        h_bar = ceil_by_factor(height * beta, size_factor)
        w_bar = ceil_by_factor(width * beta, size_factor)
    
    resized_width, resized_height = h_bar, w_bar
    image = image.resize((resized_width, resized_height))

    return image
```
:::

2. 视频处理

流程：
   - 视频抽帧，并均匀采样
   - 按照图像处理方式确定单帧的size
   - 使用 `InterpolationMode.BICUBIC` 进行单帧resize

::: details code
```python

VIDEO_MIN_PIXELS = 128 * 28 * 28
VIDEO_MAX_PIXELS = 768 * 28 * 28
VIDEO_TOTAL_PIXELS = 24576 * 28 * 28
FRAME_FACTOR = 2
FPS = 2.0
FPS_MIN_FRAMES = 4
FPS_MAX_FRAMES = 768


def fetch_video():
    # 1. 视频帧处理
    video, audio, info = io.read_video(
        video_path,
        start_pts=0.0,
        end_pts=None,
        pts_unit="sec",
        output_format="TCHW",
    )
    nframes = video.size(0) / info["video_fps"] * fps  # 目标视频的总帧数
    
    nframes = round_by_factor(nframes, size_factor)  # 四舍五入至2的倍数（默认每秒抽2帧）
    if nframes < FPS_MIN_FRAMES:  # 视频总帧数小于最小帧数时，向上取整
        nframes = ceil_by_factor(FPS_MIN_FRAMES, size_factor)
    if nframes > FPS_MAX_FRAMES:  # 视频总帧数小于最小帧数时，向下取整
        nframes = floor_by_factor(FPS_MAX_FRAMES, size_factor)

    if not (size_factor <= nframes and nframes <= video.size(0)):
        raise ValueError(f"nframes should in interval [{size_factor}, {video.size(0)}], but got {nframes}.")

    idx = torch.linspace(0, video.size(0) - 1, nframes).round().long()  # 均匀采样
    height, width = video.shape[2:]
    video = video[idx]
    
    # 2. 单帧图像处理
    if max(height, width) / min(height, width) > MAX_RATIO:
        raise ValueError(
            f"absolute aspect ratio must be smaller than {MAX_RATIO}, got {max(height, width) / min(height, width)}"
        )

    min_pixels = VIDEO_MIN_PIXELS
    max_pixels = max(min(VIDEO_MAX_PIXELS, height * width * size_factor), min_pixels * 1.05)

    h_bar = max(size_factor, round_by_factor(height, size_factor))
    w_bar = max(size_factor, round_by_factor(width, size_factor))
    if h_bar * w_bar > max_pixels:
        beta = math.sqrt((height * width) / max_pixels)
        h_bar = floor_by_factor(height / beta, size_factor)
        w_bar = floor_by_factor(width / beta, size_factor)
    elif h_bar * w_bar < min_pixels:
        beta = math.sqrt(min_pixels / (height * width))
        h_bar = ceil_by_factor(height * beta, size_factor)
        w_bar = ceil_by_factor(width * beta, size_factor)
    
    resized_height, resized_width = h_bar, w_bar
    video = transforms.functional.resize(
            video,
            [resized_height, resized_width],
            interpolation=InterpolationMode.BICUBIC,
            antialias=True,
        ).float()
    
    return video
```
:::