## 人工修订建议

### 优先可以改的内容

1. `hook_frames`
目的：把开场判断改得更强、更符合主题。

2. `doc_scene.cards`
目的：让定义更贴近当前概念，而不是套话。

3. `scenarios`
目的：换成与主题最相关的 3 个应用场景。

4. `concept_compare`
目的：把边界对比改成最适合当前主题的对象。

5. `close_scene`
目的：把最后一句收束成最值得记住的话。

### 谨慎修改的内容

1. 场景顺序
说明：这一版模板的节奏建立在固定顺序上。大改顺序会影响气质。

2. 场景数量
说明：默认 3 个场景页最稳定。改成 1 个或 5 个会破坏中段平衡。

3. 视觉母版
说明：不要轻易把黑底 HUD 改成完全不同的风格，否则就不是同一个模板。

### 最不建议随便改的内容

1. Hook 的“巨字三连切”
原因：这是这一套模板最强的识别点之一。

2. Document 页的“左主物 + 右解释”
原因：这是把概念对象化的核心方法。

3. Close 页的大结论居中
原因：这是收束记忆点的关键。

### 推荐修订流程

1. 先改 `example_data.json`
2. 再同步检查 `content_script.md`
3. 再细修 `shot_script.horizontal.md`
4. 最后确认 `asset_requirements.json` 中素材是否就绪

### 模型初稿 -> 人工修 -> 渲染 的建议流程

1. 模型先产出一版 `example_data.json`
2. 模型根据 data 产出 8 个脚本
3. 人工优先修：
   - `content_script.md`
   - `shot_script.horizontal.md`
   - `fx_script.horizontal.md`
4. 人工确认素材清单
5. 程序按 data + timeline + component render
