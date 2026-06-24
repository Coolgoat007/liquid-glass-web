# Liquid Glass Web

> 纯前端实现的 Apple iOS 26 液态玻璃（Liquid Glass）视觉效果，无任何依赖。

![preview](https://raw.githubusercontent.com/Coolgoat007/liquid-glass-web/main/jpg/preview.jpg)

## 效果特性

- **折射畸变** — SVG `feDisplacementMap` + Canvas SDF 生成位移贴图，模拟玻璃边缘光线偏折
- **色差（色散）** — RGB 三通道独立偏移量，还原棱镜边缘色散
- **动态高光** — 镜面光斑随鼠标实时跟踪，静止时归位顶部
- **弹性形变** — 鼠标靠近时玻璃沿接近轴伸展，远离时复原
- **可拖拽** — 支持拖动玻璃在页面任意位置自由放置
- **参数调节** — 折射强度 / 模糊 / 饱和度 / 色散四个滑块实时调整

## 使用

```bash
# 无需构建，直接打开
open index.html
```

或者直接双击 `index.html`。

## 技术实现

| 技术点 | 实现方式 |
|--------|----------|
| 折射 | SVG Filter `feDisplacementMap`，贴图由 Canvas 实时计算 SDF 梯度生成 |
| 背景模糊 | CSS `backdrop-filter: blur()` |
| 饱和度增强 | CSS `backdrop-filter: saturate()` |
| 弹性动画 | `pointermove` 驱动 CSS `transform`，无 requestAnimationFrame 轮询 |
| 动态边框 | CSS 自定义属性 + `conic-gradient` 随鼠标偏移实时更新 |

## 文件结构

```
index.html   页面结构 + SVG 滤镜定义
style.css    玻璃样式（backdrop-filter、高光、边框）
app.js       位移贴图生成、交互逻辑、滑块控制
```

## License

MIT
