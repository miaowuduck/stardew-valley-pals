# 🐾 Stardew Valley Pals

[![Obsidian](https://img.shields.io/badge/Obsidian-%23483699.svg?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Latest release](https://img.shields.io/github/v/release/miaowuduck/stardew-valley-pals?display_name=tag)](https://github.com/miaowuduck/stardew-valley-pals/releases)

**Little neighbours for your Obsidian vault.**

Adopt pixel pets, invite 41 Stardew Valley villagers into your workspace, and let them wander, work, chat — and occasionally read over your shoulder.

**41 villagers · 9 pet species · 40 colour options · panel or overlay**

![Pets and villagers living in Pelican Town](readmepics/hero.gif)

## Why you'll love it

- 🐾 **A workspace that feels alive.** Cats, dogs, chickens, junimos and more wander, nap and ask for attention while you write.
- 🧑‍🌾 **41 villagers, each one themselves.** Abigail plays her flute, Clint hammers at his anvil, Emily dances. Every animation is hand-picked from the original game sheets.
- 💬 **They notice your notes.** With an AI provider connected, right-click a villager for an in-character comment on whatever you're writing.
- 🧠 **They remember you.** Villagers hold on to a few core memories — your novel, your exams, your favourite tea — and bring them up later.
- 🪟 **Panel or overlay.** Keep everyone in a dockable side panel, or let them roam the whole Obsidian window.

## Meet the villagers

![Eight villagers performing their activities](readmepics/villagers.gif)

All 41 characters walk, idle and react in their own style, and many have signature activities: Clint at the anvil, Abigail's flute, Emily's dancing, Sam on his skateboard, the Wizard's cauldron, Leah sculpting, Maru welding, Robin hammering — and plenty more.

Turn on **Scheduled visits** and Pelican Town comes to you. Everyone keeps their own daily routine, the roster rotates each day, and you choose how many villagers can be in town at once (1–6). Pets are unaffected.

## Pets

![Nine pet species, animated](readmepics/pets.gif)

Nine species — cats, dogs, chickens, cows, ducks, dinosaurs, parrots, junimos and turtles — with **40 colour combinations**. Name them whatever you like and adopt as many as you want.

They wander, sit, sleep, and never say a word. Click one for a heart.

## They read over your shoulder

![Right-clicking Sebastian in Obsidian to get a comment on the current note](readmepics/obsidian-rightclick.gif)

Connect an OpenAI-compatible AI provider and villagers can:

- **comment on your current note** when you right-click them;
- **speak up on their own** at a natural, adjustable rate;
- **remember durable facts about you** and bring them up in later conversations.

Each villager has their own personality and voice: Sebastian is dry and nocturnal, Evelyn fusses over you, Shane is having a day. No API key? Everything else still works — only the dialogue needs AI.

## They talk to each other

![Dragging Sebastian onto Abigail to start a conversation](readmepics/obsidian-banter.gif)

Drop one villager onto another and they'll walk to a spot, turn to face each other, and chat — nearby animals come over to watch. Prefer to be surprised? Leave **Villager conversations** on and they'll start chats on their own while you work.

*Both demos were recorded in Obsidian. Dialogue is sample text; the walking, drag-and-drop, bubbles and reactions are the real plugin.*

## Two ways to hang out

- **Panel mode** — a resizable pet panel you can dock anywhere in your workspace.
- **Overlay mode** — a transparent layer over the entire Obsidian window, so pets stay with you as you move between notes.
- **Interact** — drag anyone to a new spot, click for a heart, or right-click a villager to talk.

## 🚀 Get started

1. **Install.** Go to **Settings → Community Plugins → Browse**, search for **Stardew Valley Pals**, then **Install → Enable**.
2. **Adopt a companion.** Open the pet panel with the 🐱 ribbon icon, then run **Add a pet** from the command palette and pick a pet or villager. Pets can be named.
3. **Make it yours.** Open **Settings → Stardew Valley Pals** to switch between panel and overlay, change size and speed, or turn on scheduled visits.

> **Desktop only.** Requires Obsidian 1.13 or newer.

<details>
<summary><strong>Install with BRAT or manually</strong></summary>

**BRAT**

1. Install the **BRAT** plugin from the Community Plugins store.
2. Open **Settings → BRAT → Add Beta Plugin**.
3. Enter `https://github.com/miaowuduck/stardew-valley-pals`.
4. Enable **Stardew Valley Pals** in **Settings → Community Plugins**.

**Manual**

1. Download the latest release from the [Releases page](https://github.com/miaowuduck/stardew-valley-pals/releases).
2. Extract the folder into `.obsidian/plugins/` in your vault.
3. Reload Obsidian and enable the plugin.

</details>

## 🤖 Optional: give them a voice

1. Get an API key from **OpenAI**, **Google Gemini**, **DeepSeek**, or any OpenAI-compatible provider.
2. In Obsidian, open **Settings → Stardew Valley Pals → AI configuration**.
3. Pick an Obsidian secret holding your key under **API key secret** (create one in Obsidian's secret manager if needed), set the provider's **API endpoint** and **model**, then hit **Test connection**.
4. Leave **NPC speech** enabled and right-click a villager to say hello.

The default endpoint is `https://api.openai.com/v1` with the model `gpt-5-mini`. A **Chinese language** mode is available for all AI interactions.

## ⚙️ Settings at a glance

| Setting | What it does |
|---|---|
| **Overlay mode** | Roam the whole window instead of sitting in a side panel |
| **Pet size / Movement speed** | Scale from 0.5× to 3× and set how briskly pets wander |
| **My pets** | See everyone you've adopted and remove any of them |
| **Scheduled visits / Max visitors** | Let villagers arrive on their daily routines, up to six at a time |
| **NPC speech / Villager conversations** | Turn AI dialogue and villager-to-villager chats on or off |
| **Core memories** | Review what each villager remembers, or clear it all |
| **Automatic rants** | Messages per hour, conversation frequency, and whether to stay quiet in the background |
| **AI configuration** | Secret, endpoint, model, language, and a connection test |

## ⌨️ Commands

| Command | What it does |
|---|---|
| **Add a pet** | Choose a pet or villager to bring in |
| **Remove a specific pet** | Pick one companion to remove |
| **Remove all pets** | Clear the whole town at once |

## 🙏 Credits

- [stardew-pet-farm](https://github.com/PROF0UND/stardew-pet-farm) — the original Stardew pet concept and sprites
- [obsidian-pets](https://github.com/hiden2000/obsidian-pets) — the original Obsidian plugin
- [StardewValley-Assets](https://github.com/Huu-Yuu/StardewValley-Assets) by Huu-Yuu — extracted game art
- [vscode-pets](https://marketplace.visualstudio.com/items?itemName=tonybaloney.vscode-pets) — the original "pets in your editor" idea

All Stardew Valley art belongs to ConcernedApe. This is a fan project, not affiliated with or endorsed by ConcernedApe or Obsidian.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

*Made with ❤️ for Stardew Valley fans and Obsidian users alike.*
