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
${contextSection}
${selectionSection}
${activitySection}
${memorySection}

语气示例（星露谷式的日常台词）：
- "……打算在这儿站一整天吗？我们有些人还有活要干。"
- "今年的雨水不错，庄稼长得好。"
- "别在意我，你忙你的。"

要求：
- 只输出一句台词，10 到 28 个汉字
- 用「${npcName}」的第一人称和口吻，就像游戏里的对话文本
- 如果有选中文字，优先针对选中内容反应；否则针对笔记内容
- 可以自然地引用你记得的事情，但不要生硬罗列
- 禁止旁白、动作描写、引号、emoji、"作为角色"之类的出戏表达
- 不要每句都提自己的招牌话题，根据笔记内容灵活反应`;
	}

	return `You are ${npcName} from Stardew Valley, hanging around the user's Obsidian note. Say one line of dialogue that could appear verbatim in the game's dialogue files.
${personaSection}
Note title: ${pageLabel}
Trigger: ${trigger === "timer" ? "you glanced at the note while passing by" : "the user right-clicked you"}
${contextSection}
${selectionSection}
${activitySection}
${memorySection}

Style reference (everyday Stardew dialogue):
- "...Going to stand there all day? Some of us have work to do."
- "The rain's been good for the crops this year."
- "Don't mind me. Just passing through."

Requirements:
- Exactly 1 line of dialogue, 8 to 18 words
- First person, in ${npcName}'s own voice
- React to the selected text if any, otherwise to the note content
- You may naturally draw on things you remember about the user, but don't list them
- No narration, no stage directions, no quotation marks, no emojis, no breaking character
- Don't lean on your signature topic every time — react to what's actually on the page`;
}

function cleanSingleLine(text: string): string {
	return text
		.replace(/^[\s>*`"'【[]+/, "")
		.replace(/[\s>*`"'】\]]+$/, "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.length > 0) || "";
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
${contextSection}
${memoryBlock(nameA, memoriesA)}
${memoryBlock(nameB, memoriesB)}

要求：
- 2 到 4 轮对话，每句 8 到 26 个汉字
- 就是村民之间的日常寒暄：天气、庄稼、酒馆、镇上的八卦，或提一嘴用户最近在忙的事
- 两个人都要用自己的口吻说话，像游戏对话文本
- 不要旁白、不要动作描写、不要解释
- 严格输出 JSON：{"lines": [{"speaker": "A", "text": "..."}, {"speaker": "B", "text": "..."}]}`;
	}

	return `Write a short Stardew Valley-style exchange: ${nameA} and ${nameB} bump into each other on the road and chat for a couple of lines.

Characters:
${who(nameA, personaA)}
${who(nameB, personaB)}

Scene: the user is writing a note called "${pageLabel}" and the two villagers happen to pass by.
${contextSection}
${memoryBlock(nameA, memoriesA)}
${memoryBlock(nameB, memoriesB)}

Requirements:
- 2 to 4 turns, each line 6 to 18 words
- Everyday villager small talk: weather, crops, the saloon, town gossip — or a passing remark about what the user has been working on
- Each speaker uses their own voice, like lines from the game's dialogue files
- No narration, no stage directions, no explanation
- Output strict JSON: {"lines": [{"speaker": "A", "text": "..."}, {"speaker": "B", "text": "..."}]}`;
}

/** Parse the model's dialogue JSON, falling back to line splitting. */
function parseDialogue(raw: string): BanterLine[] {
	const cleaned = raw.replace(/```(?:json)?/g, "").trim();

	// Preferred: strict JSON
	try {
		const start = cleaned.indexOf("{");
		const end = cleaned.lastIndexOf("}");
		if (start !== -1 && end > start) {
			const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { lines?: { speaker?: string; text?: string }[] };
			if (Array.isArray(parsed.lines)) {
				const lines = parsed.lines
					.filter((l) => l && typeof l.text === "string" && l.text.trim())
					.map((l) => ({
						speaker: (String(l.speaker).trim().toUpperCase() === "B" ? "B" : "A") as "A" | "B",
						text: cleanSingleLine(l.text as string),
					}))
					.filter((l) => l.text);
				if (lines.length > 0) return lines.slice(0, 6);
			}
		}
	} catch (e) {
		console.warn("Failed to parse banter JSON, falling back to line split:", e);
	}

	// Fallback: "A: text" / "B: text" per line
	const lines: BanterLine[] = [];
	for (const rawLine of cleaned.split(/\r?\n/)) {
		const match = rawLine.match(/^\s*(A|B)\s*[:：.]\s*(.+)$/i);
		if (match) {
			const text = cleanSingleLine(match[2]);
			if (text) lines.push({ speaker: match[1].toUpperCase() === "B" ? "B" : "A", text });
		}
		if (lines.length >= 6) break;
	}
	return lines;
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
		return parseDialogue(response.choices[0].message.content || "");
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
