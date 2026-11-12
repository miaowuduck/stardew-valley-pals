import { getLanguage } from "obsidian";
import type { UiLanguagePreference } from "./types";

export type UiLanguage = "zh" | "en";

/**
 * English is the source of truth for key names. `zh` is typed as a complete
 * record of those keys, so a missing or extra Chinese string is a build error.
 */
const en = {
	// ── Commands & ribbon ───────────────────────────────────────
	"ribbon.togglePetView": "Toggle pet view",
	"view.petsTitle": "{vault} Pets",
	"commands.addPet": "Add a pet",
	"commands.removeAllPets": "Remove all pets",
	"commands.removePet": "Remove a specific pet",
	"commands.setupDeepSeek": "Set up DeepSeek AI",

	// ── Notices ─────────────────────────────────────────────────
	"notices.aiInitFailed": "Could not initialize the AI model. Check your API key and model in settings.",
	"notices.enterModelFirst": "Enter the model name used by your API endpoint first.",
	"notices.aiCallFailed": "AI request failed — using an offline line: {error}",
	"notices.allPetsRemoved": "All pets have been removed.",
	"notices.villagerVisitsEnabled": "Villager visits enabled — manually added villagers have gone home for now.",
	"notices.villagerVisitsDisabled": "Villager visits disabled — the visitors have gone home.",
	"notices.villagerArrived": "{name} is in town.",
	"notices.villagerLeft": "{name} headed home.",
	"notices.villagerScheduleConflict": "{name} visits on their own schedule while villager visits are enabled.",
	"notices.villagerAlreadyInTown": "{name} is already in town.",
	"notices.selectSecretFirst": "Select an API key secret in settings first.",
	"notices.modelSet": "Model set to {model}.",
	"notices.modelInitFailed": "Could not initialize the model. Check the API key, endpoint, and model.",
	"notices.aiTestSuccess": "✅ Connected — \"{reply}\"",
	"notices.aiTestSuccessNoReply": "✅ Connection successful!",
	"notices.aiTestFailed": "❌ Connection failed: {message}",
	"notices.deepseekReady": "DeepSeek AI is ready. Right-click a villager to say hello!",
	"notices.languageRestartHint": "Interface language changed. Some menu and command names will update after you restart Obsidian.",
	"notices.deepseekModelMigrated": "DeepSeek retired the old model name. Your model was switched to deepseek-flash.",
	"notices.secretSaveFailed": "Could not save the API key to Obsidian's secret storage. Please try again.",
	"notices.linkOpenFailed": "Could not open the browser. The link has been copied — paste it into your browser.",
	"notices.clipboardFailed": "Could not access the clipboard. Please copy the text manually.",
	"notices.copied": "Copied.",
	"notices.settingsReset": "Settings have been reset to defaults.",
	"notices.keySaved": "API key saved.",
	"notices.allMemoriesCleared": "All villager memories cleared.",
	"notices.currentPage": "Current page",
	"notices.scheduleOnly": "Visits on a schedule",
	"notices.alreadyInTown": "Already in town",

	// ── Confirmation dialogs ────────────────────────────────────
	"confirm.cancel": "Cancel",
	"confirm.removeAllPets.title": "Remove all pets?",
	"confirm.removeAllPets.body": "This will permanently remove every pet and NPC from your vault. This cannot be undone.",
	"confirm.removeAllPets.button": "Clear all",
	"confirm.clearMemories.title": "Clear all villager memories?",
	"confirm.clearMemories.body": "Every villager will forget what they learned about you. This cannot be undone.",
	"confirm.clearMemories.button": "Clear all",
	"confirm.reset.title": "Reset settings to defaults?",
	"confirm.reset.body": "All settings will be restored to their original values. Your pets and memories will not be removed.",
	"confirm.reset.button": "Reset to defaults",

	// ── Settings: groups ────────────────────────────────────────
	"settings.group.display": "Display",
	"settings.group.myPets": "My pets",
	"settings.group.villagerVisits": "Villager visits",
	"settings.group.ai": "AI configuration",
	"settings.group.speech": "Speech bubbles",
	"settings.group.memory": "Villager memory",
	"settings.group.rants": "Automatic rants",
	"settings.group.danger": "Danger zone",

	// ── Settings: display ───────────────────────────────────────
	"settings.language.name": "Interface language",
	"settings.language.desc": "Language for menus, settings, and messages. AI dialogue has its own language setting below.",
	"settings.language.auto": "Follow Obsidian",
	"settings.language.en": "English",
	"settings.language.zh": "简体中文",
	"settings.overlayMode.name": "Overlay mode",
	"settings.overlayMode.desc": "Pets roam freely across the entire Obsidian window on a transparent overlay. Disable to keep pets in a dockable side panel.",
	"settings.petSize.name": "Pet size",
	"settings.petSize.desc": "Scale all pets from half to triple size.",
	"settings.petSpeed.name": "Movement speed",
	"settings.petSpeed.desc": "How quickly pets wander around. Higher = faster.",

	// ── Settings: pets ──────────────────────────────────────────
	"settings.removeAllPets.name": "Remove all pets",
	"settings.removeAllPets.desc": "Permanently remove every pet and NPC from your vault.",
	"settings.removeAllPets.button": "Clear all",
	"settings.myPets.heading": "My pets",
	"settings.myPets.empty": "No pets yet! Add your first companion with the add button.",
	"settings.addPet.name": "Add pet",
	"settings.petType": "Type: {type}",
	"settings.memory.count.one": "{count} memory: {memories}",
	"settings.memory.count.other": "{count} memories: {memories}",

	// ── Settings: villager visits ───────────────────────────────
	"settings.scheduledVisits.name": "Scheduled visits",
	"settings.scheduledVisits.desc": "Villagers arrive and leave automatically according to their own visiting hours. Manually added villagers go home while this is on. Pets are unaffected.",
	"settings.maxVisitors.name": "Max visitors",
	"settings.maxVisitors.desc": "How many villagers can be in town at the same time.",
	"settings.currentlyInTown.name": "Currently in town",
	"settings.currentlyInTown.none": "Nobody right now — check back at a different hour. Each villager keeps their own schedule.",

	// ── Settings: AI ────────────────────────────────────────────
	"settings.aiSetup.name": "DeepSeek setup",
	"settings.aiSetup.desc": "Not configured yet. The guided setup walks you through signing up, topping up, and pasting an API key.",
	"settings.aiSetup.readyDesc": "DeepSeek is connected. You can reconfigure it, or change advanced settings below.",
	"settings.aiSetup.otherProviderDesc": "Another AI provider is configured. Use this wizard to switch to DeepSeek, or edit the advanced fields below.",
	"settings.aiSetup.button": "Set up DeepSeek",
	"settings.aiSetup.reconfigure": "Reconfigure",
	"settings.apiKey.name": "API key secret",
	"settings.apiKey.desc": "Advanced: choose an existing secret from Obsidian's SecretStorage. Most people should use the DeepSeek setup above. Local endpoints that don't authenticate can leave this empty.",
	"settings.apiEndpoint.name": "API endpoint",
	"settings.apiEndpoint.desc": "OpenAI-compatible base URL, including the version path (usually /v1). Examples: https://api.deepseek.com/v1, https://api.openai.com/v1. Don't paste the full /chat/completions URL.",
	"settings.model.name": "Model",
	"settings.model.desc": "The exact model ID your endpoint expects, for example deepseek-flash or gpt-5-mini. For a local server, use the name it reports.",
	"settings.aiDialogueChinese.name": "AI dialogue in Chinese",
	"settings.aiDialogueChinese.desc": "Villagers' AI-generated lines use Chinese. This is separate from the interface language above.",
	"settings.testConnection.name": "Test connection",
	"settings.testConnection.desc": "Send a tiny message to verify your API key, endpoint, and model.",
	"settings.testConnection.button": "Test connection",
	"settings.testConnection.testing": "Testing…",
	"settings.testConnection.noKey": "Please select an API key secret first. Local endpoints that don't require a key can skip this.",
	"settings.testConnection.noEndpoint": "Please enter an API endpoint.",
	"settings.testConnection.noModel": "Please enter a model name.",

	// ── Settings: speech ────────────────────────────────────────
	"settings.npcSpeech.name": "NPC speech",
	"settings.npcSpeech.desc": "Allow Stardew Valley villagers to show speech bubbles with their unique personalities. Animals stay silent — they express themselves with hearts.",
	"settings.banter.name": "Villager conversations",
	"settings.banter.desc": "Two villagers occasionally walk up to each other, face off, and chat on the automatic speech timer. Nearby animals gather to watch.",

	// ── Settings: memory ────────────────────────────────────────
	"settings.memory.name": "Core memories",
	"settings.memory.desc": "After speaking, a villager may distill a durable fact about you (e.g. a long-term project) and remember it in future conversations.",
	"settings.clearMemories.name": "Clear all memories",
	"settings.clearMemories.desc": "Every villager forgets everything they learned about you.",
	"settings.clearMemories.button": "Clear all",

	// ── Settings: automatic rants ───────────────────────────────
	"settings.rants.enabled.name": "Enable automatic rants",
	"settings.rants.enabled.desc": "Villagers will occasionally speak up on their own, at the average rate set below.",
	"settings.rants.focused.name": "Only rant when focused",
	"settings.rants.focused.desc": "Suppress automatic rants while Obsidian is in the background. Right-click rants are always allowed.",
	"settings.rants.perHour.name": "Messages per hour",
	"settings.rants.perHour.desc": "Average number of automatic speech bubbles per hour. Timing varies naturally around this rate.",
	"settings.rants.frequency.name": "Conversation frequency",
	"settings.rants.frequency.desc": "Percentage of automatic speech events that become a chat between two villagers instead of a solo comment.",
	"settings.rants.context.name": "Page context length",
	"settings.rants.context.desc": "Characters from your current note sent to the AI. More = better awareness, but costs more tokens.",

	// ── Settings: danger zone ───────────────────────────────────
	"settings.reset.name": "Reset settings",
	"settings.reset.desc": "Restores every setting to its original value. Pets and memories stay right where they are.",
	"settings.reset.button": "Reset to defaults",

	// ── Pet selector / name form ────────────────────────────────
	"modal.enterName": "Enter a name:",
	"modal.petNamePlaceholder": "Pet name...",
	"modal.submit": "Submit",

	// ── Empty states ────────────────────────────────────────────
	"empty.noPets.title": "No pets yet!",
	"empty.noPets.desc": "Use the ribbon icon or the \"Add a pet\" command to bring in your first companion.",
	"empty.addPet": "Add a pet",

	// ── AI errors ───────────────────────────────────────────────
	"errors.ai.auth.title": "That key wasn't accepted",
	"errors.ai.auth.body": "Copy the complete key from DeepSeek's API keys page. It should start with sk- and contain no spaces, then try again.",
	"errors.ai.auth.short": "Invalid API key.",
	"errors.ai.balance.title": "Your API balance is empty",
	"errors.ai.balance.body": "Top up your DeepSeek API balance, then try again. DeepSeek's free web chat does not use this balance.",
	"errors.ai.balance.short": "Insufficient balance.",
	"errors.ai.model.title": "DeepSeek doesn't recognize that model",
	"errors.ai.model.body": "Reset the model to deepseek-flash and try again.",
	"errors.ai.model.short": "Unknown model.",
	"errors.ai.endpoint.title": "The endpoint path looks wrong",
	"errors.ai.endpoint.body": "Use the OpenAI-compatible base URL, not the full /chat/completions address. For DeepSeek it is https://api.deepseek.com/v1.",
	"errors.ai.endpoint.short": "Endpoint not found.",
	"errors.ai.network.title": "Couldn't reach DeepSeek",
	"errors.ai.network.body": "Check your internet connection or proxy, then try again.",
	"errors.ai.network.short": "Network error.",
	"errors.ai.rateLimit.title": "DeepSeek is busy",
	"errors.ai.rateLimit.body": "Requests are being rate-limited right now. Wait a minute and try again.",
	"errors.ai.rateLimit.short": "Rate limited.",
	"errors.ai.server.title": "DeepSeek had a problem",
	"errors.ai.server.body": "The service returned an error. Please try again later.",
	"errors.ai.server.short": "Server error.",
	"errors.ai.unknown.title": "Something went wrong",
	"errors.ai.unknown.body": "The connection test failed. Check your key, endpoint, and model, then try again.",
	"errors.ai.unknown.short": "Connection failed.",

	// Generic OpenAI-compatible provider (OpenAI, Ollama, LM Studio, …)
	"errors.ai.custom.auth.title": "The API rejected the key",
	"errors.ai.custom.auth.body": "Check the key this endpoint expects. Some endpoints accept any key, or no key at all.",
	"errors.ai.custom.auth.short": "Invalid API key.",
	"errors.ai.custom.balance.title": "The API account is out of credit",
	"errors.ai.custom.balance.body": "Top up the account for this endpoint, then try again.",
	"errors.ai.custom.balance.short": "Insufficient balance.",
	"errors.ai.custom.model.title": "The endpoint doesn't recognize that model",
	"errors.ai.custom.model.body": "Enter the exact model ID the server expects. Copy it from the endpoint's model list if you're not sure.",
	"errors.ai.custom.model.short": "Unknown model.",
	"errors.ai.custom.endpoint.title": "The endpoint path looks wrong",
	"errors.ai.custom.endpoint.body": "Use the base URL that ends in /v1 (for example https://api.openai.com/v1), not the full /chat/completions address. The plugin adds the rest of the path itself.",
	"errors.ai.custom.endpoint.short": "Endpoint not found.",
	"errors.ai.custom.network.title": "Couldn't reach the API endpoint",
	"errors.ai.custom.network.body": "Make sure the server is running and the address is right. Open {endpoint}/models in a browser to check that it answers.",
	"errors.ai.custom.network.short": "Network error.",
	"errors.ai.custom.rateLimit.title": "The API is busy",
	"errors.ai.custom.rateLimit.body": "The endpoint is rate-limiting requests. Wait a moment and try again.",
	"errors.ai.custom.rateLimit.short": "Rate limited.",
	"errors.ai.custom.server.title": "The API returned an error",
	"errors.ai.custom.server.body": "The server had a problem handling the request. Check its logs, then try again.",
	"errors.ai.custom.server.short": "Server error.",
	"errors.ai.custom.unknown.title": "The API request failed",
	"errors.ai.custom.unknown.body": "Check the endpoint and model, then see the technical details below for the exact response.",
	"errors.ai.custom.unknown.short": "Request failed.",

	// Technical details dialog
	"errors.ai.details.hint": "Technical details (the API key is never included):",
	"errors.ai.details.copy": "Copy details",

	// ── Onboarding wizard ───────────────────────────────────────
	"onboarding.title": "DeepSeek setup",
	"onboarding.stepIndicator": "Step {current} of {total}",
	"onboarding.step.welcome": "Welcome",
	"onboarding.step.signup": "Sign in",
	"onboarding.step.topup": "Top up",
	"onboarding.step.apiKey": "API key",
	"onboarding.step.connect": "Connect",
	"onboarding.step.done": "Done",
	"onboarding.welcome.title": "Give the villagers a voice",
	"onboarding.welcome.lede": "Two minutes, no technical knowledge needed.",
	"onboarding.welcome.body": "With an AI key, villagers can comment on your notes, chat with each other, and remember what matters to you. Without one, pets and villagers still wander and react — only dialogue needs a key.",
	"onboarding.welcome.optional": "AI is optional.",
	"onboarding.welcome.start": "Start setup",
	"onboarding.welcome.haveKey": "I already have a key",
	"onboarding.welcome.switchWarning": "You already have another AI provider configured. Continuing will switch this plugin to DeepSeek.",
	"onboarding.signup.title": "Sign in to DeepSeek",
	"onboarding.signup.lede": "Use your phone number or WeChat.",
	"onboarding.signup.body1": "Open the DeepSeek platform, enter your phone number or email, and request a verification code. You can also scan the QR code with WeChat.",
	"onboarding.signup.body2": "If this is your first time, logging in creates your account automatically — there is no separate sign-up form.",
	"onboarding.topup.title": "Add a little API credit",
	"onboarding.topup.lede": "API usage is pay-as-you-go.",
	"onboarding.topup.body1": "In the left sidebar, open 充值 / Top up, choose a preset amount or enter your own, and pay with Alipay or WeChat Pay.",
	"onboarding.topup.body2": "A small first top-up — around ¥10 — is plenty for trying it out. There is no need to buy a large package.",
	"onboarding.topup.body3": "This balance is only for API calls. DeepSeek's free web chat does not use it.",
	"onboarding.topup.warning": "If you see HTTP 402 later, it means the balance is empty.",
	"onboarding.apiKey.title": "Create an API key",
	"onboarding.apiKey.lede": "This is the password the plugin uses.",
	"onboarding.apiKey.body1": "Open API keys in the left sidebar, click 创建 API key / Create API key, and give it a name like “Obsidian Pets”.",
	"onboarding.apiKey.body2": "Copy the complete key — it starts with sk-. The plugin will store it in Obsidian's secret storage for you.",
	"onboarding.apiKey.warning": "The key is shown only once. Don't share it, screenshot it, or paste it into public places.",
	"onboarding.connect.title": "Paste and test",
	"onboarding.connect.lede": "Almost there.",
	"onboarding.connect.body": "Paste your key below. It stays on this computer, is stored in Obsidian's secret storage, and never goes into your vault files or plugin data.",
	"onboarding.connect.modeNew": "Paste a new key",
	"onboarding.connect.modeExisting": "Use an existing secret",
	"onboarding.connect.placeholder": "sk-...",
	"onboarding.connect.show": "Show",
	"onboarding.connect.hide": "Hide",
	"onboarding.connect.paste": "Paste",
	"onboarding.connect.saveTest": "Save & test",
	"onboarding.connect.testing": "Testing…",
	"onboarding.connect.noSecrets": "No existing secrets found. Paste a new key instead.",
	"onboarding.connect.validationEmpty": "Paste your API key first.",
	"onboarding.connect.validationPrefix": "This doesn't look like a DeepSeek key — it should start with sk-.",
	"onboarding.connect.validationShort": "The key looks too short. Copy the complete key and try again.",
	"onboarding.connect.storedSecurely": "Your key is stored securely on this device.",
	"onboarding.done.title": "You're all set",
	"onboarding.done.lede": "DeepSeek is connected.",
	"onboarding.done.body": "Right-click a villager in Obsidian to say hello. You can change these settings any time under Settings → Stardew Valley Pals → AI configuration.",
	"onboarding.done.addVillager": "Add a villager",
	"onboarding.done.close": "Done",
	"onboarding.nav.back": "Back",
	"onboarding.nav.next": "Next",
	"onboarding.nav.skip": "Skip for now",
	"onboarding.openPage": "Open page",
	"onboarding.copyLink": "Copy link",
	"onboarding.openConsole": "Open DeepSeek console",
} as const;

const zh: Record<keyof typeof en, string> = {
	// ── Commands & ribbon ───────────────────────────────────────
	"ribbon.togglePetView": "显示 / 隐藏宠物面板",
	"view.petsTitle": "{vault} 宠物",
	"commands.addPet": "添加宠物",
	"commands.removeAllPets": "移除全部宠物",
	"commands.removePet": "移除指定宠物",
	"commands.setupDeepSeek": "配置 DeepSeek AI",

	// ── Notices ─────────────────────────────────────────────────
	"notices.aiInitFailed": "AI 模型初始化失败。请检查设置里的 API 密钥和模型。",
	"notices.enterModelFirst": "请先填写你的 API endpoint 所使用的模型名称。",
	"notices.aiCallFailed": "AI 调用失败，改用离线台词：{error}",
	"notices.allPetsRemoved": "所有宠物已移除。",
	"notices.villagerVisitsEnabled": "已开启村民来访——手动添加的村民暂时回家了。",
	"notices.villagerVisitsDisabled": "已关闭村民来访——来访的村民都回家了。",
	"notices.villagerArrived": "{name} 来到了你的笔记旁。",
	"notices.villagerLeft": "{name} 回家了。",
	"notices.villagerScheduleConflict": "开启村民来访时，{name} 会按自己的作息来访。",
	"notices.villagerAlreadyInTown": "{name} 已经在镇上了。",
	"notices.selectSecretFirst": "请先在设置里选择一个 API 密钥 secret。",
	"notices.modelSet": "模型已设为 {model}。",
	"notices.modelInitFailed": "模型初始化失败。请检查 API 密钥、endpoint 和模型名。",
	"notices.aiTestSuccess": "✅ 连接成功 — \"{reply}\"",
	"notices.aiTestSuccessNoReply": "✅ 连接成功！",
	"notices.aiTestFailed": "❌ 连接失败：{message}",
	"notices.deepseekReady": "DeepSeek AI 已就绪。右键点击一位村民打个招呼吧！",
	"notices.languageRestartHint": "界面语言已切换。部分菜单和命令名称会在重启 Obsidian 后更新。",
	"notices.deepseekModelMigrated": "DeepSeek 已停用旧模型名，你的模型已切换为 deepseek-flash。",
	"notices.secretSaveFailed": "无法把 API 密钥写入 Obsidian 密钥存储，请重试。",
	"notices.linkOpenFailed": "无法打开浏览器。链接已复制，请粘贴到浏览器中打开。",
	"notices.clipboardFailed": "无法访问剪贴板，请手动复制。",
	"notices.copied": "已复制。",
	"notices.settingsReset": "设置已恢复默认。",
	"notices.keySaved": "API 密钥已保存。",
	"notices.allMemoriesCleared": "所有村民记忆已清空。",
	"notices.currentPage": "当前页面",
	"notices.scheduleOnly": "按日程来访",
	"notices.alreadyInTown": "已在镇上",

	// ── Confirmation dialogs ────────────────────────────────────
	"confirm.cancel": "取消",
	"confirm.removeAllPets.title": "移除全部宠物？",
	"confirm.removeAllPets.body": "这会永久移除笔记库里的所有宠物和村民，且无法撤销。",
	"confirm.removeAllPets.button": "全部移除",
	"confirm.clearMemories.title": "清空所有村民记忆？",
	"confirm.clearMemories.body": "每位村民都会忘记关于你的一切，且无法撤销。",
	"confirm.clearMemories.button": "全部清空",
	"confirm.reset.title": "恢复默认设置？",
	"confirm.reset.body": "所有设置都会恢复初始值。你的宠物和记忆不会被删除。",
	"confirm.reset.button": "恢复默认",

	// ── Settings: groups ────────────────────────────────────────
	"settings.group.display": "显示",
	"settings.group.myPets": "我的宠物",
	"settings.group.villagerVisits": "村民来访",
	"settings.group.ai": "AI 配置",
	"settings.group.speech": "对话气泡",
	"settings.group.memory": "村民记忆",
	"settings.group.rants": "自动发言",
	"settings.group.danger": "危险操作",

	// ── Settings: display ───────────────────────────────────────
	"settings.language.name": "界面语言",
	"settings.language.desc": "菜单、设置和提示使用的语言。AI 台词有单独的设置，见下方。",
	"settings.language.auto": "跟随 Obsidian",
	"settings.language.en": "English",
	"settings.language.zh": "简体中文",
	"settings.overlayMode.name": "悬浮模式",
	"settings.overlayMode.desc": "宠物会在整个 Obsidian 窗口的透明层上自由活动。关闭后宠物会待在可停靠的侧边面板里。",
	"settings.petSize.name": "宠物大小",
	"settings.petSize.desc": "把所有宠物缩放到 0.5 倍到 3 倍。",
	"settings.petSpeed.name": "移动速度",
	"settings.petSpeed.desc": "宠物闲逛的速度。数值越大越快。",

	// ── Settings: pets ──────────────────────────────────────────
	"settings.removeAllPets.name": "移除全部宠物",
	"settings.removeAllPets.desc": "永久移除笔记库里的所有宠物和村民。",
	"settings.removeAllPets.button": "全部移除",
	"settings.myPets.heading": "我的宠物",
	"settings.myPets.empty": "还没有宠物！点击添加按钮领养第一位伙伴。",
	"settings.addPet.name": "添加宠物",
	"settings.petType": "类型：{type}",
	"settings.memory.count.one": "{count} 条记忆：{memories}",
	"settings.memory.count.other": "{count} 条记忆：{memories}",

	// ── Settings: villager visits ───────────────────────────────
	"settings.scheduledVisits.name": "定时来访",
	"settings.scheduledVisits.desc": "村民会按照各自的作息自动来访和离开。开启后，手动添加的村民会先回家。宠物不受影响。",
	"settings.maxVisitors.name": "最大访客数",
	"settings.maxVisitors.desc": "同时最多有几位村民在镇上。",
	"settings.currentlyInTown.name": "当前在镇上",
	"settings.currentlyInTown.none": "现在还没有人——换个时间再来看看。每位村民都有自己的作息。",

	// ── Settings: AI ────────────────────────────────────────────
	"settings.aiSetup.name": "DeepSeek 配置",
	"settings.aiSetup.desc": "还没有配置。向导会一步步带你完成注册、充值和粘贴 API 密钥。",
	"settings.aiSetup.readyDesc": "DeepSeek 已连接。你可以重新配置，或在下方调整高级设置。",
	"settings.aiSetup.otherProviderDesc": "当前配置的是其他 AI 服务。想换成 DeepSeek 可以用这个向导，也可以直接编辑下方的高级字段。",
	"settings.aiSetup.button": "配置 DeepSeek",
	"settings.aiSetup.reconfigure": "重新配置",
	"settings.apiKey.name": "API 密钥 secret",
	"settings.apiKey.desc": "高级选项：从 Obsidian 密钥存储里选择一个已有 secret。大多数人直接用上方的 DeepSeek 配置向导即可。不需要验证的本地 endpoint 可以留空。",
	"settings.apiEndpoint.name": "API endpoint",
	"settings.apiEndpoint.desc": "OpenAI 兼容的 base URL，要包含版本路径（通常是 /v1）。例如：https://api.deepseek.com/v1、https://api.openai.com/v1。不要粘贴完整的 /chat/completions 地址。",
	"settings.model.name": "模型",
	"settings.model.desc": "填写你的 endpoint 所需要的精确模型 ID，例如 deepseek-flash 或 gpt-5-mini。本地服务请填它报告的模型名。",
	"settings.aiDialogueChinese.name": "AI 台词使用中文",
	"settings.aiDialogueChinese.desc": "村民的 AI 台词使用中文。这与上面的界面语言互不影响。",
	"settings.testConnection.name": "测试连接",
	"settings.testConnection.desc": "发送一条很小的消息，验证 API 密钥、endpoint 和模型是否可用。",
	"settings.testConnection.button": "测试连接",
	"settings.testConnection.testing": "测试中…",
	"settings.testConnection.noKey": "请先选择一个 API 密钥 secret。不需要密钥的本地 endpoint 可以跳过。",
	"settings.testConnection.noEndpoint": "请填写 API endpoint。",
	"settings.testConnection.noModel": "请填写模型名称。",

	// ── Settings: speech ────────────────────────────────────────
	"settings.npcSpeech.name": "村民发言",
	"settings.npcSpeech.desc": "允许星露谷村民用自己的性格显示对话气泡。小动物不会说话——它们用爱心表达。",
	"settings.banter.name": "村民对话",
	"settings.banter.desc": "两位村民偶尔会走到一起、面对面聊几句，频率跟随自动发言计时。附近的小动物会围过来看。",

	// ── Settings: memory ────────────────────────────────────────
	"settings.memory.name": "核心记忆",
	"settings.memory.desc": "村民说话后，可能会提炼一条关于你的长期信息（比如在做的长期项目），并在之后的对话里提起。",
	"settings.clearMemories.name": "清空所有记忆",
	"settings.clearMemories.desc": "每位村民都会忘记关于你的一切。",
	"settings.clearMemories.button": "全部清空",

	// ── Settings: automatic rants ───────────────────────────────
	"settings.rants.enabled.name": "开启自动发言",
	"settings.rants.enabled.desc": "村民会按下面设定的平均频率偶尔主动开口。",
	"settings.rants.focused.name": "仅在聚焦时发言",
	"settings.rants.focused.desc": "Obsidian 在后台时暂停自动发言。右键触发的发言不受影响。",
	"settings.rants.perHour.name": "每小时消息数",
	"settings.rants.perHour.desc": "每小时自动对话气泡的平均数量，实际间隔会自然浮动。",
	"settings.rants.frequency.name": "对话频率",
	"settings.rants.frequency.desc": "自动发言事件中，两位村民互聊（而不是单人吐槽）所占的百分比。",
	"settings.rants.context.name": "页面上下文长度",
	"settings.rants.context.desc": "发送给 AI 的当前笔记字符数。越多越了解你在写什么，但消耗的 token 也越多。",

	// ── Settings: danger zone ───────────────────────────────────
	"settings.reset.name": "重置设置",
	"settings.reset.desc": "把所有设置恢复为初始值。宠物和记忆会保留。",
	"settings.reset.button": "恢复默认",

	// ── Pet selector / name form ────────────────────────────────
	"modal.enterName": "给它取个名字：",
	"modal.petNamePlaceholder": "宠物名字…",
	"modal.submit": "确定",

	// ── Empty states ────────────────────────────────────────────
	"empty.noPets.title": "还没有宠物！",
	"empty.noPets.desc": "点击左侧功能区图标，或运行「添加宠物」命令，把第一位伙伴带进来。",
	"empty.addPet": "添加宠物",

	// ── AI errors ───────────────────────────────────────────────
	"errors.ai.auth.title": "密钥没有被接受",
	"errors.ai.auth.body": "请到 DeepSeek 的 API keys 页面重新复制完整密钥（以 sk- 开头、中间没有空格），然后重试。",
	"errors.ai.auth.short": "API 密钥无效。",
	"errors.ai.balance.title": "API 余额不足",
	"errors.ai.balance.body": "请先给 DeepSeek API 充值，然后重试。网页版免费对话不消耗这笔余额。",
	"errors.ai.balance.short": "余额不足。",
	"errors.ai.model.title": "DeepSeek 不认识这个模型",
	"errors.ai.model.body": "请把模型改回 deepseek-flash 后重试。",
	"errors.ai.model.short": "模型不存在。",
	"errors.ai.endpoint.title": "endpoint 路径似乎不对",
	"errors.ai.endpoint.body": "请填写 OpenAI 兼容的 base URL，而不是完整的 /chat/completions 地址。DeepSeek 的地址是 https://api.deepseek.com/v1。",
	"errors.ai.endpoint.short": "endpoint 不存在。",
	"errors.ai.network.title": "无法连接到 DeepSeek",
	"errors.ai.network.body": "请检查网络或代理，然后重试。",
	"errors.ai.network.short": "网络错误。",
	"errors.ai.rateLimit.title": "DeepSeek 正忙",
	"errors.ai.rateLimit.body": "当前请求被限流，请等一分钟再试。",
	"errors.ai.rateLimit.short": "请求被限流。",
	"errors.ai.server.title": "DeepSeek 服务出错",
	"errors.ai.server.body": "服务端返回了错误，请稍后再试。",
	"errors.ai.server.short": "服务器错误。",
	"errors.ai.unknown.title": "出了点问题",
	"errors.ai.unknown.body": "连接测试失败。请检查密钥、endpoint 和模型，然后重试。",
	"errors.ai.unknown.short": "连接失败。",

	// 通用 OpenAI 兼容服务（OpenAI、Ollama、LM Studio 等）
	"errors.ai.custom.auth.title": "API 拒绝了密钥",
	"errors.ai.custom.auth.body": "请检查这个 endpoint 需要的密钥。有些 endpoint 接受任意密钥，甚至完全不需要密钥。",
	"errors.ai.custom.auth.short": "API 密钥无效。",
	"errors.ai.custom.balance.title": "API 账户余额不足",
	"errors.ai.custom.balance.body": "请先为这个 endpoint 对应的账户充值，然后重试。",
	"errors.ai.custom.balance.short": "余额不足。",
	"errors.ai.custom.model.title": "endpoint 不认识这个模型",
	"errors.ai.custom.model.body": "请填写服务器要求的精确模型 ID。不确定的话，从该 endpoint 的模型列表里复制。",
	"errors.ai.custom.model.short": "模型不存在。",
	"errors.ai.custom.endpoint.title": "endpoint 路径似乎不对",
	"errors.ai.custom.endpoint.body": "请使用以 /v1 结尾的 base URL（例如 https://api.openai.com/v1），而不是完整的 /chat/completions 地址；插件会自己补上后面的路径。",
	"errors.ai.custom.endpoint.short": "endpoint 不存在。",
	"errors.ai.custom.network.title": "无法连接到 API endpoint",
	"errors.ai.custom.network.body": "请确认服务正在运行、地址正确。可在浏览器打开 {endpoint}/models 检查是否有响应。",
	"errors.ai.custom.network.short": "网络错误。",
	"errors.ai.custom.rateLimit.title": "API 正忙",
	"errors.ai.custom.rateLimit.body": "endpoint 正在限流，请稍等片刻再试。",
	"errors.ai.custom.rateLimit.short": "请求被限流。",
	"errors.ai.custom.server.title": "API 返回了错误",
	"errors.ai.custom.server.body": "服务器处理请求时出错。请查看服务端日志，然后重试。",
	"errors.ai.custom.server.short": "服务器错误。",
	"errors.ai.custom.unknown.title": "API 请求失败",
	"errors.ai.custom.unknown.body": "请检查 endpoint 和模型，并查看下方技术细节中的具体响应。",
	"errors.ai.custom.unknown.short": "请求失败。",

	// 技术细节弹窗
	"errors.ai.details.hint": "技术细节（不包含 API 密钥）：",
	"errors.ai.details.copy": "复制详情",

	// ── Onboarding wizard ───────────────────────────────────────
	"onboarding.title": "DeepSeek 配置向导",
	"onboarding.stepIndicator": "第 {current} 步，共 {total} 步",
	"onboarding.step.welcome": "欢迎",
	"onboarding.step.signup": "登录",
	"onboarding.step.topup": "充值",
	"onboarding.step.apiKey": "API Key",
	"onboarding.step.connect": "连接",
	"onboarding.step.done": "完成",
	"onboarding.welcome.title": "让村民开口说话",
	"onboarding.welcome.lede": "两分钟搞定，不需要任何技术背景。",
	"onboarding.welcome.body": "配置 AI 后，村民会评论你的笔记、互相聊天，还会记住你在意的事。不配置也完全没关系：宠物和村民照常散步、互动，只有对话需要密钥。",
	"onboarding.welcome.optional": "AI 是可选的。",
	"onboarding.welcome.start": "开始配置",
	"onboarding.welcome.haveKey": "我已经有密钥了",
	"onboarding.welcome.switchWarning": "你当前已配置了其他 AI 服务。继续会把插件切换到 DeepSeek。",
	"onboarding.signup.title": "登录 DeepSeek",
	"onboarding.signup.lede": "用手机号或微信登录即可。",
	"onboarding.signup.body1": "打开 DeepSeek 开放平台，输入手机号（或邮箱）并获取验证码；也可以用微信扫码登录。",
	"onboarding.signup.body2": "第一次使用时，登录会自动完成注册，不需要单独填写注册资料。",
	"onboarding.topup.title": "给 API 充一点余额",
	"onboarding.topup.lede": "API 按使用量计费。",
	"onboarding.topup.body1": "在左侧菜单打开「充值」，选择固定金额或自定义金额，然后用支付宝或微信支付。",
	"onboarding.topup.body2": "第一次充一小笔就够了，比如 ¥10，不用一上来买大额套餐。",
	"onboarding.topup.body3": "这笔余额只用于 API 调用；DeepSeek 网页版的免费对话不消耗它。",
	"onboarding.topup.warning": "以后如果看到 402 错误，就表示余额用完了。",
	"onboarding.apiKey.title": "创建 API Key",
	"onboarding.apiKey.lede": "这是插件调用 AI 用的“密码”。",
	"onboarding.apiKey.body1": "在左侧菜单打开「API keys」，点击「创建 API key」，随便起个名字，比如「Obsidian Pets」。",
	"onboarding.apiKey.body2": "复制完整的密钥，它以 sk- 开头。插件会帮你把它存进 Obsidian 的密钥存储。",
	"onboarding.apiKey.warning": "密钥只显示一次，请不要分享、截图或发到公开场合。",
	"onboarding.connect.title": "粘贴并测试",
	"onboarding.connect.lede": "就差最后一步了。",
	"onboarding.connect.body": "把密钥粘贴到下面。它只保存在这台电脑上，写入 Obsidian 的密钥存储，不会进入你的笔记库文件或插件数据。",
	"onboarding.connect.modeNew": "粘贴新密钥",
	"onboarding.connect.modeExisting": "使用已有的 secret",
	"onboarding.connect.placeholder": "sk-...",
	"onboarding.connect.show": "显示",
	"onboarding.connect.hide": "隐藏",
	"onboarding.connect.paste": "粘贴",
	"onboarding.connect.saveTest": "保存并测试",
	"onboarding.connect.testing": "正在测试…",
	"onboarding.connect.noSecrets": "没有找到已有的 secret，请改回粘贴新密钥。",
	"onboarding.connect.validationEmpty": "请先粘贴 API 密钥。",
	"onboarding.connect.validationPrefix": "这看起来不是 DeepSeek 密钥，它应该以 sk- 开头。",
	"onboarding.connect.validationShort": "密钥似乎太短了，请复制完整密钥后重试。",
	"onboarding.connect.storedSecurely": "你的密钥已安全保存在本机。",
	"onboarding.done.title": "配置完成",
	"onboarding.done.lede": "DeepSeek 已连接。",
	"onboarding.done.body": "在 Obsidian 里右键点击一位村民，就能和 TA 打招呼。之后随时可以在「设置 → Stardew Valley Pals → AI 配置」里修改。",
	"onboarding.done.addVillager": "添加一位村民",
	"onboarding.done.close": "完成",
	"onboarding.nav.back": "上一步",
	"onboarding.nav.next": "下一步",
	"onboarding.nav.skip": "稍后再说",
	"onboarding.openPage": "打开页面",
	"onboarding.copyLink": "复制链接",
	"onboarding.openConsole": "打开 DeepSeek 控制台",
};

export type TranslationKey = keyof typeof en;

let currentLanguage: UiLanguage = "en";

export function resolveUiLanguage(pref: UiLanguagePreference = "auto"): UiLanguage {
	if (pref === "zh" || pref === "en") return pref;
	try {
		return getLanguage().toLowerCase().startsWith("zh") ? "zh" : "en";
	} catch {
		return "en";
	}
}

export function setUiLanguage(lang: UiLanguage): void {
	currentLanguage = lang;
}

export function getUiLanguage(): UiLanguage {
	return currentLanguage;
}

/** Translate a key, replacing `{name}` placeholders with `vars`. */
export function t(
	key: TranslationKey,
	vars?: Record<string, string | number>,
): string {
	let text: string = currentLanguage === "zh" ? zh[key] : en[key];
	if (vars) {
		for (const name of Object.keys(vars)) {
			text = text.split(`{${name}}`).join(String(vars[name]));
		}
	}
	return text;
}
