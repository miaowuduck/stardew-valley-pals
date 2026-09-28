import OpenAI from "openai";
import type { StardewPersona } from "../core/types";
import type { BanterLine } from "../core/constants";

// ── Rant prompt ────────────────────────────────────────────────

function buildPageRantPrompt(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	selectedText: string,
	pageContext: string,
	contextCharLimit: number,
	activitySummary: string,
	npcName: string,
	persona: StardewPersona | undefined,
	memories: string[],
	useChinesePrompt: boolean,
): string {
	const cn = useChinesePrompt;

	const contextSection = pageContext
		? `\n${cn ? `笔记内容摘录（最多约 ${contextCharLimit} 字）` : `Note excerpt (up to ~${contextCharLimit} chars)`}:\n${pageContext}`
		: "";

	const activitySection = activitySummary
		? `\n${cn ? "用户最近的活动" : "What the user has been doing"}:\n${activitySummary}`
		: "";

	const selectionSection = selectedText
		? `\n${cn ? "用户选中的文字" : "Text the user selected"}:\n${selectedText}`
		: "";

	const memorySection = memories.length > 0
		? `\n${cn ? "你记得关于用户的这些事" : "Things you remember about the user"}:\n${memories.map((m) => `- ${m}`).join("\n")}`
		: "";

	const personaSection = persona
		? `\n${cn ? "你是谁" : "Who you are"}: ${persona.identity}\n${cn ? "性格" : "Personality"}: ${persona.temperament}\n${cn ? "说话方式" : "How you talk"}: ${persona.rantStyle}`
		: "";

	if (cn) {
		return `你是星露谷游戏里的角色「${npcName}」，出现在用户的 Obsidian 笔记旁边。说出一句这个角色在游戏对话里真正会说的话。
${personaSection}
笔记标题：${pageLabel}
触发：${trigger === "timer" ? "你路过瞟了一眼" : "用户右键点了你一下"}
用户当地时间：${getLocalTimeDescription(true)}
${contextSection}
${selectionSection}
${activitySection}
${memorySection}

要求：
- 只输出一句台词，10 到 28 个汉字
- 用「${npcName}」的第一人称和口吻，就像游戏里的对话文本
- 如果有选中文字，优先针对选中内容反应；否则针对笔记内容
- 可以自然地引用你记得的事情，但不要生硬罗列
- 禁止旁白、动作描写、引号、emoji、"作为角色"之类的出戏表达
- 不要每句都提自己的招牌话题，根据笔记内容灵活反应
- 如果提到时间或打招呼，与用户当地时间保持一致，问候方式自然变化，不要固定套路`;
	}

	return `You are ${npcName} from Stardew Valley, hanging around the user's Obsidian note. Say one line of dialogue that could appear verbatim in the game's dialogue files.
${personaSection}
Note title: ${pageLabel}
Trigger: ${trigger === "timer" ? "you glanced at the note while passing by" : "the user right-clicked you"}
User's local time: ${getLocalTimeDescription(false)}
${contextSection}
${selectionSection}
${activitySection}
${memorySection}

Requirements:
- Exactly 1 line of dialogue, 8 to 18 words
- First person, in ${npcName}'s own voice
- React to the selected text if any, otherwise to the note content
- You may naturally draw on things you remember about the user, but don't list them
- No narration, no stage directions, no quotation marks, no emojis, no breaking character
- Don't lean on your signature topic every time — react to what's actually on the page
- If you mention the time or greet the user, stay consistent with their local time; vary greetings naturally instead of falling back on one stock phrase`;
}

function cleanSingleLine(text: string): string {
	return text
		.replace(/^[\s>*`"'【[]+/, "")
		.replace(/[\s>*`"'】\]]+$/, "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.length > 0) || "";
}

/** The user's local date/time with a coarse daypart, for time-aware dialogue. */
function getLocalTimeDescription(useChinese: boolean): string {
	const now = new Date();
	const h = now.getHours();
	const two = (n: number) => (n < 10 ? `0${n}` : `${n}`);
	const hhmm = `${two(h)}:${two(now.getMinutes())}`;

	if (useChinese) {
		const part =
			h < 5 ? "深夜" : h < 9 ? "早上" : h < 12 ? "上午" :
			h < 14 ? "中午" : h < 18 ? "下午" : h < 22 ? "晚上" : "深夜";
		const weekday = "日一二三四五六"[now.getDay()];
		return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekday} ${hhmm}（${part}）`;
	}

	const part =
		h < 5 ? "late at night" : h < 12 ? "morning" :
		h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
	const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
	const date = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
	return `${weekday}, ${date}, ${hhmm} (${part})`;
}

export async function generatePageRantText(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	selectedText: string,
	pageContext: string,
	contextCharLimit: number,
	activitySummary: string,
	npcName: string,
	persona: StardewPersona | undefined,
	memories: string[],
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean,
): Promise<string> {
	if (!model) {
		return "";
	}

	const prompt = buildPageRantPrompt(
		pageLabel, trigger, selectedText, pageContext, contextCharLimit,
		activitySummary, npcName, persona, memories, useChinesePrompt,
	);

	try {
		const response = await model.chat.completions.create({
			model: selectedModel,
			messages: [{ role: "user", content: prompt }],
		});
		return cleanSingleLine(response.choices[0].message.content || "");
	} catch (e: unknown) {
		const msg = (e as { message?: string })?.message || String(e);
		console.error("Page rant generation failed:", e);
		throw new Error(`AI 模型调用失败: ${msg}`);
	}
}

// ── Banter (villager-to-villager dialogue) ─────────────────────

function buildDialoguePrompt(
	nameA: string, personaA: StardewPersona | undefined, memoriesA: string[],
	nameB: string, personaB: StardewPersona | undefined, memoriesB: string[],
	pageLabel: string,
	pageContext: string,
	useChinesePrompt: boolean,
): string {
	const cn = useChinesePrompt;

	const who = (name: string, p: StardewPersona | undefined) =>
		p ? `${name}: ${p.identity}. ${p.temperament}. ${p.rantStyle}` : name;

	const memoryBlock = (name: string, mem: string[]) =>
		mem.length > 0
			? `\n${cn ? `${name} 记得关于用户的事` : `What ${name} remembers about the user`}:\n${mem.map((m) => `- ${m}`).join("\n")}`
			: "";

	const contextSection = pageContext
		? `\n${cn ? "用户当前笔记摘录（可作为谈资，也可不聊）" : "Excerpt of the user's current note (optional small-talk material)"}:\n${pageContext}`
		: "";

	if (cn) {
		return `写一段星露谷游戏风格的短对话：「${nameA}」和「${nameB}」在路上碰见了，聊两三句。

角色：
${who(nameA, personaA)}
${who(nameB, personaB)}

场景：用户在写笔记《${pageLabel}》，两人正好路过。
用户当地时间：${getLocalTimeDescription(true)}
${contextSection}
${memoryBlock(nameA, memoriesA)}
${memoryBlock(nameB, memoriesB)}

要求：
- 2 到 4 轮对话，每句 8 到 26 个汉字
- 就是村民之间的日常闲聊，话题由两人自然发挥，不要每次雷同
- 如果打招呼或提到时间，与用户当地时间保持一致，问候方式自然变化，不要固定套路
- 两个人都要用自己的口吻说话，像游戏对话文本
- 不要旁白、不要动作描写、不要解释
- 严格输出 JSON：{"lines": [{"speaker": "A", "text": "..."}, {"speaker": "B", "text": "..."}]}
- speaker 只能填 "A" 或 "B"：A 是「${nameA}」，B 是「${nameB}」，不要填角色名`;
	}

	return `Write a short Stardew Valley-style exchange: ${nameA} and ${nameB} bump into each other on the road and chat for a couple of lines.

Characters:
${who(nameA, personaA)}
${who(nameB, personaB)}

Scene: the user is writing a note called "${pageLabel}" and the two villagers happen to pass by.
User's local time: ${getLocalTimeDescription(false)}
${contextSection}
${memoryBlock(nameA, memoriesA)}
${memoryBlock(nameB, memoriesB)}

Requirements:
- 2 to 4 turns, each line 6 to 18 words
- Everyday villager small talk; let the two choose topics naturally rather than repeating the same themes every time
- If anyone greets or mentions the time, stay consistent with the user's local time; vary greetings naturally instead of falling back on one stock phrase
- Each speaker uses their own voice, like lines from the game's dialogue files
- No narration, no stage directions, no explanation
- Output strict JSON: {"lines": [{"speaker": "A", "text": "..."}, {"speaker": "B", "text": "..."}]}
- speaker must be the literal letter "A" or "B": A is ${nameA}, B is ${nameB} — never use character names`;
}

/**
 * Map whatever the model put in `speaker` back to "A" or "B".
 * Models often ignore the instructions and emit the character's name
 * ("刘易斯", "Lewis") instead of the literal "A"/"B" — previously those all
 * collapsed to "A", so every bubble appeared over one villager's head.
 */
function resolveDialogueSpeaker(
	raw: unknown,
	nameA: string,
	nameB: string,
	prev: "A" | "B" | null,
): "A" | "B" | null {
	const v = String(raw ?? "").trim();
	const upper = v.toUpperCase();
	if (upper === "A" || upper === "B") return upper;

	const norm = (s: string) => s.replace(/[「」『』"' \s]/g, "").toLowerCase();
	const nv = norm(v);
	const na = norm(nameA);
	const nb = norm(nameB);
	if (nv) {
		if (na && (nv === na || nv.includes(na) || na.includes(nv))) return "A";
		if (nb && (nv === nb || nv.includes(nb) || nb.includes(nv))) return "B";
	}
	// Unknown speaker: inside a parsed dialogue, alternate with the previous
	// line so both villagers talk; at the top level (no context) give up.
	return prev === null ? null : prev === "A" ? "B" : "A";
}

/** If every line ended up with the same speaker, alternate them. */
function ensureBothSpeakers(lines: BanterLine[]): BanterLine[] {
	if (lines.length > 1 && lines.every((l) => l.speaker === lines[0].speaker)) {
		return lines.map((l, i) => ({ ...l, speaker: (i % 2 === 0 ? "A" : "B") as "A" | "B" }));
	}
	return lines;
}

/** Parse the model's dialogue JSON, falling back to line splitting. */
function parseDialogue(raw: string, nameA: string, nameB: string): BanterLine[] {
	const cleaned = raw.replace(/```(?:json)?/g, "").trim();

	// Preferred: strict JSON
	try {
		const start = cleaned.indexOf("{");
		const end = cleaned.lastIndexOf("}");
		if (start !== -1 && end > start) {
			const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { lines?: { speaker?: string; text?: string }[] };
			if (Array.isArray(parsed.lines)) {
				let prev: "A" | "B" | null = null;
				const lines = parsed.lines
					.filter((l) => l && typeof l.text === "string" && l.text.trim())
					.map((l) => {
						const speaker = resolveDialogueSpeaker(l.speaker, nameA, nameB, prev) ?? "A";
						prev = speaker;
						return { speaker, text: cleanSingleLine(l.text as string) };
					})
					.filter((l) => l.text);
				if (lines.length > 0) return ensureBothSpeakers(lines).slice(0, 6);
			}
		}
	} catch (e) {
		console.warn("Failed to parse banter JSON, falling back to line split:", e);
	}

	// Fallback: "A: text" / "B: text" (or "Name: text") per line
	const lines: BanterLine[] = [];
	let prev: "A" | "B" | null = null;
	for (const rawLine of cleaned.split(/\r?\n/)) {
		const match = rawLine.match(/^\s*([A-Za-z]|[^\s:：.]{1,12})\s*[:：.]\s*(.+)$/);
		if (match) {
			// Skip lines whose prefix isn't a recognisable speaker (likely prose)
			const speaker = resolveDialogueSpeaker(match[1], nameA, nameB, prev);
			if (speaker === null) continue;
			const text = cleanSingleLine(match[2]);
			if (text) {
				prev = speaker;
				lines.push({ speaker, text });
			}
		}
		if (lines.length >= 6) break;
	}
	return ensureBothSpeakers(lines);
}

export async function generateDialogue(
	nameA: string, personaA: StardewPersona | undefined, memoriesA: string[],
	nameB: string, personaB: StardewPersona | undefined, memoriesB: string[],
	pageLabel: string,
	pageContext: string,
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean,
): Promise<BanterLine[]> {
	if (!model) return [];

	const prompt = buildDialoguePrompt(
		nameA, personaA, memoriesA, nameB, personaB, memoriesB,
		pageLabel, pageContext, useChinesePrompt,
	);

	try {
		const response = await model.chat.completions.create({
			model: selectedModel,
			messages: [{ role: "user", content: prompt }],
		});
		return parseDialogue(response.choices[0].message.content || "", nameA, nameB);
	} catch (e: unknown) {
		console.error("Banter dialogue generation failed:", e);
		return [];
	}
}

// ── Core memory extraction ─────────────────────────────────────

export async function extractMemory(
	pageLabel: string,
	pageContext: string,
	npcName: string,
	existingMemories: string[],
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean,
): Promise<string | null> {
	if (!model || !pageContext.trim()) return null;
	const cn = useChinesePrompt;

	const prompt = cn
		? `你从用户的笔记《${pageLabel}》中看到了以下内容。判断是否包含值得长期记住的、关于用户本人的事实（例如：在写一本小说、正在备考、是学习日语的学生、在做某个长期项目）。不要记临时性内容（待办、流水账、引用段、代码片段）。

笔记摘录：
${pageContext.slice(0, 1500)}

已记住的事（不要重复）：
${existingMemories.length > 0 ? existingMemories.map((m) => `- ${m}`).join("\n") : "（无）"}

如果有值得记住的新事实，用不超过 20 个字输出这一句话事实（以第三人称描述用户，如「用户在写一本奇幻小说」）；如果没有，只输出 NONE。不要输出其他任何内容。`
		: `You saw this excerpt from the user's note "${pageLabel}". Decide whether it contains a durable fact about the user worth remembering long-term (e.g. they're writing a novel, studying for an exam, learning Japanese, running a long-term project). Do NOT record transient content (to-dos, journal entries, quotes, code snippets).

Note excerpt:
${pageContext.slice(0, 1500)}

Already remembered (don't repeat these):
${existingMemories.length > 0 ? existingMemories.map((m) => `- ${m}`).join("\n") : "(none)"}

If there's a new fact worth remembering, output it as a single short sentence (max 12 words, third person, e.g. "The user is writing a fantasy novel"). Otherwise output exactly NONE. Output nothing else.`;

	try {
		const response = await model.chat.completions.create({
			model: selectedModel,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 80,
		});
		const text = cleanSingleLine(response.choices[0].message.content || "");
		if (!text || /^none$/i.test(text)) return null;
		return text.length > 80 ? `${text.slice(0, 80)}…` : text;
	} catch (e: unknown) {
		console.error("Memory extraction failed:", e);
		return null;
	}
}

// ── Client init ────────────────────────────────────────────────

export function initModel(
	openAiKey: string,
	openAiBaseUrl: string,
) {
	return new OpenAI({
		apiKey: openAiKey,
		baseURL: openAiBaseUrl,
		dangerouslyAllowBrowser: true,
	});
}
