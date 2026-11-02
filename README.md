# 天气之子 · A Prayer for Sunshine

基于 Vite + TypeScript + Three.js 的 60 秒实时电影实验，2.39:1 画幅。

## 当前交付状态

**这是可运行的环境与运镜预演，不是已完成的人物版电影。**

已实现：东京建筑群、楼顶鸟居与神社、植被、积水反射、雨滴与涟漪、程序化云天、晴雨变化、六段连续运镜、原创合成环境音、播放/暂停/重播/静音/全屏、响应式界面和 WebGL 错误提示。

尚未完成：阳菜模型获取与导入验收；高细节面部与手指、合掌接触、头发/服饰次级动画和人物近景景深。这些依赖真实模型，不使用简陋替代人物。未找到适合本项目的可直接取得角色文件时，不自动更换形象。

## 运行

要求 Node.js 22.18+（已在 Node 24.21.0 测试）。

```powershell
cd 'D:\vibe-coding\Weathering with you'
npm ci
npm run dev
```

访问终端显示的本地地址，默认 http://127.0.0.1:5173/ 。

```powershell
npm test
npm run build
npm run preview
```

生产静态文件位于 `dist/`。字体全部本地托管；影片运行不需要访问第三方字体或音频服务。

## 角色资产接入关口

候选：**Hina Amano — NekoRare**  
https://sketchfab.com/3d-models/hina-amano-33a0dc6df31443889a03177d1996f116

公开元数据显示 CC BY 4.0、47,017 顶点、92,864 三角面，作者注明 Mixamo 绑定。官方下载要求登录，本项目未取得模型。

1. 用户从作者的官方页面登录下载 glTF/GLB；保留作者提供的说明与许可证。
2. 将含嵌入纹理的 GLB 保存为 `public/models/hina.glb`。其他格式需先转换为 GLB，不能只重命名扩展名。
3. 重启开发服务，检查骨骼、面部 morph targets、材质、朝向与身高。加载器按 1.58 米归一化、角色脚底置于屋顶。
4. `src/character.ts` 是待实际资产校准的 Mixamo 接入适配器；它不保证任意模型直接得到正确的手掌接触。逐镜调整后才能将“人物待验收”改为完成状态。
5. 用真实模型完成近景、手部、发丝/衣摆与性能验证，更新署名和资产清单，再发布同一个 Sites 项目。

没有模型时，自动使用环境镜头注视点，清楚标记“环境预演 · 人物待接入”。

## 控制与结构

点击开始观看；空格播放/暂停，R 重播，M 静音，F 全屏。切到后台会暂停，返回后手动继续。结尾停留在 60 秒。

- `src/timeline.ts`：独立电影时钟与确定性天气曲线。
- `src/cinema.ts`：相机、灯光、后处理、渲染质量调整。
- `src/environment.ts`、`src/sky.ts`、`src/weather.ts`：程序化场景。
- `src/water.ts`、`src/details.ts`：共享积水遮罩、衰减水波、飞溅时序与屋顶材质/构造细节。
- `src/character.ts`：可选 GLB 与骨骼适配器。
- `src/audio.ts`：原创噪声环境音与和声，无电影原声。
- `src/main.ts`、`src/style.css`：播放界面与交互。

开发模式提供 `window.__film.seek(seconds)`、`play()`、`pause()`、`state()` 供画面 QA；生产构建不暴露该接口。

## 发布

`.openai/hosting.json` 已记录同一个 owner-private Sites 项目。通过 Sites 插件的 source workflow 构建、推送、打包和私有发布，后续更新复用该 ID，勿重新创建站点。

详细资产与验证记录见 `docs/ASSETS.md`、`docs/VALIDATION.md`。

