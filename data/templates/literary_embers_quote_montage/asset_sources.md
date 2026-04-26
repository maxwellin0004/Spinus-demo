# Asset Sources - literary_embers_quote_montage

## 更新时间
- 2026-04-26

## 书封来源（bridge）
1. 《活着》
- 本地文件: `/images/literary-embers/covers/huozhe-douban.png`
- 来源方式: Douban 书籍页面主图截图
- 来源站点: [Douban Book](https://book.douban.com)
- 抓取方式: Playwright 页面元素截图（`#mainpic img`）
- 备注: 仅作为模板验证和内部制作资产，发布前请自行确认授权/版权策略。

2. 《百年孤独》
- 本地文件: `/images/literary-embers/covers/one-hundred-years-douban.png`
- 来源方式: Douban 书籍页面主图截图
- 来源站点: [Douban Book](https://book.douban.com)
- 抓取方式: Playwright 页面元素截图（`#mainpic img`）
- 备注: 同上。

3. 《不做告别》
- 本地文件: `/images/literary-embers/covers/no-goodbye-douban.png`
- 来源方式: Douban 书籍页面主图截图
- 来源站点: [Douban Book](https://book.douban.com)
- 抓取方式: Playwright 页面元素截图（`#mainpic img`）
- 备注: 同上。

4. 《月亮与六便士》
- 本地文件: `/images/literary-embers/covers/moon-sixpence-douban.png`
- 来源方式: Douban 书籍页面主图截图
- 来源站点: [Douban Book](https://book.douban.com)
- 抓取方式: Playwright 页面元素截图（`#mainpic img`）
- 备注: 同上。

## 场景图来源（hook + body）
- 本地目录: `/images/literary-embers/`
- 文件:
  - `opener-moon-manuscript.png`
  - `panel-trapped-desk.png`
  - `panel-gaze-window.png`
  - `panel-comparison-machine.png`
  - `panel-crossroad-shadow.png`
  - `panel-collapse-room.png`
  - `panel-walkaway-light.png`
- 来源方式: AI 生成后人工筛选
- 提示词文件: `image_prompt_library.json` + `prompt_variants.json`
- 备注: 已要求禁止图片内文字与水印。

## 音频来源
- 本地文件: `/audio/literary-embers/moon-sixpence-elevenlabs-cn.mp3`
- 方式: ElevenLabs TTS 生成
- 对齐文件: `subtitle_timeline.generated.vertical.json`

## 替代源策略
- 书封无法获取时: 使用同书目公开授权封面或出版社公开图；不得用随机假书封替代上线版本。
- 场景图不达标时: 依据 `image_generation_rules.md` 重生，每场至少 4 张候选再筛选。
