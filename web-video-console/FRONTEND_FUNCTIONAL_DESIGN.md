# Codex Video Console Frontend Functional Design

## 1. Document Goal

This document defines the target frontend product for `web-video-console/`.

It answers five questions:

1. What kind of product this console is
2. Which objects the UI is built around
3. Which screens and modules must exist
4. How users move from idea to rendered video
5. Which backend capabilities the frontend depends on

This is the V2 design baseline, aligned with the latest direction:

- account profile selector
- create account flow
- template selector
- built-in instruction presets
- open instruction input
- local Codex session binding
- pipeline execution workbench
- review and preview panel

## 2. Product Positioning

`Codex Video Console` is not a generic chatbot.

It is a **local AI video production workbench** for the workspace:

`D:\program\ai_video\workflow`

The frontend must help users combine:

- account style
- video template
- current topic
- Codex conversation
- local session context
- pipeline execution

to produce repeatable short-form videos.

## 3. Product Formula

The product logic is:

`Account Profile x Template x Instructions x Session Context x Topic = Video Output`

Each term means:

- `Account Profile`: who is speaking, on which platform, in what tone
- `Template`: which visual and structural skeleton is used
- `Instructions`: how this specific run should be adjusted
- `Session Context`: what Codex already knows in this thread
- `Topic`: the actual subject for the new video

## 4. Target Users

### 4.1 Primary User

Content operator who needs to:

- switch between multiple content accounts
- preserve account-specific style rules
- create videos quickly from templates
- stay inside one local workspace

### 4.2 Secondary User

Developer or template designer who needs to:

- inspect the active account profile
- verify which template is selected
- see pipeline progress and logs
- review outputs and local paths

## 5. Core Product Objects

The frontend must treat the following as first-class objects.

### 5.1 Account Profile

Represents a content account or channel identity.

Required fields:

- `id`
- `name`
- `platform`
- `persona`
- `toneTags`
- `defaultTemplateId`
- `defaultCompositionId`
- `defaultDurationSec`
- `aspectRatio`
- `ctaStyle`
- `constraints`
- `subtitleStyle`
- `voiceProfile`

### 5.2 Template

Represents the reusable video structure and visual system.

Required fields:

- `id`
- `title`
- `compositionId`
- `suitablePlatforms`
- `defaultDurationSec`
- `summary`
- `tags`

### 5.3 Instruction Preset

Represents quick reusable modifiers.

Examples:

- strengthen hook
- more conversational
- keep current template
- rewrite copy only
- faster pacing

### 5.4 Session

Represents a real local Codex session stored in `.codex`.

Required fields:

- `id`
- `threadName`
- `updatedAt`
- `cwd`
- `previewText`
- `archived`

### 5.5 Job

Represents one frontend video task bound to account, template, session, and outputs.

Required fields:

- `id`
- `title`
- `accountId`
- `templateId`
- `compositionId`
- `codexSessionId`
- `status`
- `outputDir`
- `steps`
- `messages`
- `logs`
- `preview`

## 6. Product Principles

### 6.1 Explicit Context

Users must always know:

- which account is active
- which template is active
- which session is bound
- where outputs will be written

### 6.2 Production First

The UI should prioritize:

- current account
- current template
- current task
- current output
- current executable actions

not marketing copy.

### 6.3 Account Before Template

Template choice matters, but account identity is higher-level.

The UX should treat:

`account -> template -> instructions -> session -> job`

as the natural order.

### 6.4 Stable Layout Under Long Content

The frontend must remain stable when:

- session list is long
- messages are long
- logs are long
- preview text is long

### 6.5 Visible System State

The UI must clearly reveal:

- Codex bridge state
- session binding state
- pipeline state
- preview readiness
- failure location

## 7. Layout Strategy

## 7.1 Desktop Layout

Three-column workbench:

- left: conversation
- center: production workbench
- right: review and preview

Recommended width balance:

- left: 28% to 32%
- center: 40% to 46%
- right: 24% to 28%

## 7.2 Tablet Layout

- left and center remain primary
- preview moves below them as full-width band

## 7.3 Mobile Layout

Single column with tab switching:

- chat
- workbench
- review

## 8. Information Architecture

The page has four layers of information.

### 8.1 Global Workspace Layer

Contains:

- product identity
- workspace path
- current session chip
- current job status chip
- current output chip
- refresh
- settings

### 8.2 Conversation Layer

Contains:

- current session selector
- create session action
- compact context card
- thread messages
- composer

### 8.3 Production Layer

Contains:

- active task header
- account selector
- add account action
- template selector
- composition display
- template lock
- account profile card
- built-in instruction area
- task tabs
- pipeline
- work actions

### 8.4 Review Layer

Contains:

- phone preview
- preview actions
- current subtitle
- shot notes
- script summary
- output state

## 9. Main Screen Modules

## 9.1 Topbar

### Purpose

Show the global operating context.

### Content

- product logo
- product name
- workspace path
- current session chip
- current job status chip
- output path chip
- refresh button
- settings button

### Required States

- `ready`
- `connecting`
- `degraded`
- `offline`

## 9.2 Left Column: Conversation Panel

### Purpose

Keep the conversation focused and uncluttered.

### Modules

- session dropdown
- create session button
- compact context card
- message thread
- composer

### Compact Context Card Fields

- current account
- current template
- current output directory

### Interaction Rules

1. Selecting a session binds the thread to that local Codex session
2. Clicking `New` creates a real local session
3. Sending the first message without a selected session creates and binds one automatically

### Scroll Rules

- `thread-list` is the primary scroll area
- very long single bubbles can scroll internally
- composer stays fixed at the bottom

## 9.3 Center Column: Workbench

This is the main operating area.

### 9.3.1 Active Task Header Card

Required content:

- task title
- account selector
- `Add Account` action
- template selector
- composition display
- template lock toggle
- helper chips for platform, duration, aspect ratio

### 9.3.2 Account Selector

#### Purpose

Switch the style profile for the current task.

#### Rules

- changing account updates default profile values
- default template can change with account
- if template is not locked, template may auto-switch
- if template is locked, changing account updates style only

### 9.3.3 Add Account Action

#### Purpose

Create a new content account profile without leaving the page.

#### UI Shape

Recommended as:

- side panel
- modal sheet
- large popover anchored to the header card

#### Required Form Fields

- account name
- platform
- persona
- tone tags
- default template
- default duration
- CTA style
- constraint list

#### Submit Actions

- `Cancel`
- `Create Account`

#### Success Behavior

- new account is saved
- account selector updates
- new account becomes active
- profile card refreshes immediately

## 9.4 Account Profile Card

### Purpose

Make the selected account style visible before generation.

### Required Display Fields

- platform
- persona
- tone tags
- CTA style
- prohibited expressions

### Example Display

- platform: Xiaohongshu
- persona: calm trading educator
- tone: strong hook / conversational / faster pace
- CTA: action suggestion
- constraints: no signals / no exaggerated returns

## 9.5 Built-in Instruction Area

### Purpose

Let the user adjust behavior without writing the full instruction manually.

### Modules

- preset chips
- open instruction input
- instruction scope toggle

### Preset Chip Examples

- strengthen hook
- Xiaohongshu style
- more conversational
- keep current template
- rewrite copy only
- faster pace

### Open Instruction Input

The user can add extra natural-language constraints for this task.

### Scope Toggle

- `Current Turn Only`
- `Persist In Current Session`

## 9.6 Task Tabs

Required tabs:

- workflow
- script
- subtitles
- resources
- logs

### Workflow Tab

Show the task pipeline and execution controls.

### Script Tab

Show readable structured script sections.

### Subtitles Tab

Show subtitle text blocks and later timestamps.

### Resources Tab

Show templates, visual assets, and recent jobs.

### Logs Tab

Show Codex, TTS, and rendering logs.

## 9.7 Pipeline Timeline

Recommended normalized steps:

1. parse request
2. generate `video_plan.json`
3. generate script and subtitle structure
4. generate TTS and timestamps
5. bind Remotion composition
6. render MP4

### Step States

- `waiting`
- `running`
- `done`
- `failed`

### Action Buttons

- `Generate Plan`
- `Voice`
- `Render`

### Helper Captions

Each action button should expose why it is enabled or blocked.

Examples:

- session bound
- template selected
- missing audio
- ready to render

## 9.8 Right Column: Review and Preview

### Purpose

Turn the right column from a static preview into a review surface.

### Modules

- phone preview
- preview actions
- current subtitle card
- shot note card
- script summary card
- output state card

### Preview Actions

- preview
- open directory
- export

## 10. Critical User Flows

## 10.1 Create a New Account

1. user clicks `Add Account`
2. account sheet opens
3. user fills account fields
4. user clicks `Create Account`
5. frontend saves profile through API
6. new account becomes selected
7. account profile card updates
8. template defaults refresh

## 10.2 Start a New Video From an Account

1. user selects an account
2. system loads default template and defaults
3. user optionally changes template
4. user selects presets
5. user adds open instruction
6. user sends first message
7. frontend creates a real session and job
8. Codex responds in that session

## 10.3 Continue an Existing Session

1. user selects session from dropdown
2. thread binds to session
3. user sends a new message
4. frontend resumes the local Codex session
5. assistant reply returns into the same thread

## 10.4 Change Template Mid-Task

Rules:

- before plan generation: change allowed directly
- after plan generation: require confirmation

Confirmation options:

- update appearance only
- regenerate plan
- cancel change

## 11. Prompt Assembly Logic

The frontend should not send only the raw user text.

The effective request must be assembled in this order:

1. workspace rules
2. account profile
3. template rules
4. selected instruction presets
5. open instruction text
6. current user request
7. session history

This keeps generation stable across multiple accounts and templates.

## 12. Data Model

## 12.1 AccountProfile

```json
{
  "id": "trading_xhs_v1",
  "name": "交易教育-小红书",
  "platform": "xiaohongshu",
  "persona": "冷静交易老师",
  "toneTags": ["强Hook", "更口语化", "节奏快"],
  "defaultTemplateId": "new_signals",
  "defaultCompositionId": "NewSignalsComposition",
  "defaultDurationSec": 60,
  "aspectRatio": "9:16",
  "ctaStyle": "行动建议型",
  "constraints": ["不喊单", "不夸收益"],
  "subtitleStyle": "big-highlight",
  "voiceProfile": "cn_female_fast"
}
```

## 12.2 TemplateSummary

```json
{
  "id": "new_signals",
  "title": "交易信号 / 指标解释",
  "compositionId": "NewSignalsComposition",
  "suitablePlatforms": ["xiaohongshu", "douyin"],
  "defaultDurationSec": 60,
  "summary": "适合做交易教育和指标说明的短视频模板",
  "tags": ["9:16", "chart", "subtitle"]
}
```

## 12.3 UiState

Required frontend state groups:

- `projectState`
- `accountList`
- `templateList`
- `sessionList`
- `jobList`
- `activeJob`
- `activeTab`
- `selectedInstructionPresets`
- `openInstructionText`
- `instructionScope`
- `isCreatingAccount`
- `isSending`
- `isRefreshing`

## 13. API Requirements

## 13.1 Existing APIs Used By Frontend

- `GET /api/projects`
- `GET /api/templates`
- `GET /api/assets`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/:id`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`
- `GET /api/jobs/:id/events`
- `POST /api/jobs/:id/codex/message`
- `POST /api/jobs/:id/actions/generate-plan`
- `POST /api/jobs/:id/actions/tts`
- `POST /api/jobs/:id/actions/render`

## 13.2 New APIs Required For V2

### Accounts

- `GET /api/accounts`
- `POST /api/accounts`
- `PATCH /api/accounts/:id`
- `DELETE /api/accounts/:id` (optional later)

### Templates

- `GET /api/templates/:id`

### Instructions

- `GET /api/instruction-presets`

### Job Configuration

- `PATCH /api/jobs/:id/config`

Used to update:

- account
- template
- composition
- template lock
- preset selection
- open instruction
- instruction scope

## 14. Error Handling

## 14.1 Codex Offline

UI response:

- disable send and execution actions
- show clear offline state
- preserve current content

## 14.2 Account Creation Failure

UI response:

- keep form data
- show inline field error or top message
- do not change active account automatically

## 14.3 Session Missing

UI response:

- keep the session id visible
- mark it invalid
- stop resume actions until resolved

## 14.4 Pipeline Failure

UI response:

- failed step highlighted
- log tab receives focus suggestion
- review panel shows not-ready output state

## 15. Visual and Interaction Guidelines

### 15.1 Visual Hierarchy

- dark conversation panel on the left
- bright production workbench in the center
- soft review panel on the right

### 15.2 Corner Radius

Use 8px or less across cards, buttons, inputs, and pills.

### 15.3 Dense but Clear

This is an operator console.

It should feel dense, fast, and deliberate, not airy or decorative.

### 15.4 Chips and Tags

Use chips for:

- tone tags
- platform
- duration
- aspect ratio
- instruction presets

### 15.5 Forms

Add-account UI should feel like a real product form, not a demo dialog.

## 16. Delivery Phases

## Phase 1

- stable chat and session management
- account selector UI
- add account UI
- template selector UI

## Phase 2

- account profile persistence
- preset instruction persistence
- pipeline actions connected to real backend

## Phase 3

- real preview and output integration
- account-aware generation behavior

## Phase 4

- account management center
- template gallery enhancements
- batch creation by account

## 17. Acceptance Criteria

The frontend is acceptable for V2 when:

1. user can create a new account in-page
2. user can switch account and see profile changes immediately
3. account selection can influence template defaults
4. user can still create or bind a real local session
5. account, template, instruction presets, and session are all visible together
6. pipeline and review areas remain stable under long content
7. the workbench clearly communicates how account style affects output
