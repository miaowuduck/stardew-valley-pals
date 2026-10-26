# 🐾 Stardew Valley Pals

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian](https://img.shields.io/badge/Obsidian-%23483699.svg?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md)

Bring the charming world of **Stardew Valley** into your Obsidian vault. Adopt adorable pets, befriend iconic villagers, and let them keep you company while you work — they wander, settle into their own little activities, chat with each other, comment on your notes, and remember what matters to you.

---

## 📸 Demo

### Pets and Villagers in Action

*① Pets wandering around, idling, and sleeping in your vault.*

*② Stardew Valley villagers walking and interacting with your notes.*

![readmepics/pets-demo.gif](readmepics/pets-demo.gif)

### AI Speech Bubbles

*③ Right-click a villager to get a contextual comment about your current note.*

![readmepics/speech-bubble-demo.gif](readmepics/speech-bubble-demo.gif)

### Overlay Mode

*④ Pets roaming freely across your entire Obsidian window.*

![readmepics/overlay-demo.gif](readmepics/overlay-demo.gif)

---

## ✨ What's new in 3.1 — little legs, fixed

- **Toddler walking fixed.** The four toddler characters were using their floor/crawl sprite row as a side-facing travel animation, so moving left or right looked like sliding along the ground. They now walk with their regular left/right cycle.

### Still fresh from 3.0 — villagers that *live* in your vault

Previous versions used only the walking frames of each villager sprite sheet, so everyone did little more than pace around and stand still. 3.0 unlocks the full animation sets:

- **Every villager has real animations again.** 41 characters, each hand-curated frame by frame from the original game sheets: gestures, sitting/resting poses, and character-specific activities.
- **Villagers settle into a scene.** After walking somewhere, a villager picks something to do and sticks with it for **3–10 minutes** — Clint hammers at his anvil, Willy casts a line, Abigail plays her flute. Hovering, speech bubbles, and conversations still interrupt, and the activity resumes afterwards.
- **The AI can act, not just talk.** Speech responses may include a body action (`gesture`, `rest`, or `activity`), so a villager can lean into what they're saying. A model that returns only text behaves exactly as before.
- **Small touches:** a few villagers have the vanilla "shocked" hop-and-gesture reaction; skateboarders use their side-facing travel frames while moving; frame rates were tuned per animation so nothing looks jittery or sped up.

---

## ✨ Features

### 🐱 Pets & 👥 Villagers

![readmepics/pets.gif](readmepics/pets.gif)
![readmepics/NPCs.gif](readmepics/NPCs.gif)

| Category | Details |
|---|---|
| **Pets** | 15 pet species with 55+ color variants — cats, dogs, chickens, cows, ducks, rabbits, dinosaurs, parrots, junimos, turtles, goats, sheep, pigs, ostriches, and raccoons. Name them whatever you like and adopt as many as you want |
| **Villagers** | 41 Stardew Valley characters — Abigail, Sebastian, Lewis, Robin, Emily, Shane, and many more. Each villager is **one of a kind** and keeps their official name, just like in the game |
| **Animations** | Pets idle, walk, sit, and sleep. Villagers add gestures, resting poses, and character-specific activities on top of their walk cycles |
| **Art Style** | All sprites use authentic Stardew Valley pixel art |

### 🎭 Villager Activities

Each villager's activity set comes from their own sprite sheet, so it always fits who they are:

| Villager(s) | Activities |
|---|---|
| Clint | Hammering at the anvil, inspecting a bar of iron |
| Willy & Dick | Casting a fishing line (bobber and float included), drinking |
| Elliott | Fishing, reading, sunglasses-and-swagger |
| Abigail | Playing the flute and guitar |
| Emily | Dancing (two routines), meditating |
| Sam | Sweeping, kicking around on his skateboard, riding it while he walks |
| Maru | Operating machines, welding with sparks |
| Robin | Hammering, aerobics, clapping |
| Caroline & Jodi | Exercise routines |
| Pam | Mopping |
| Shane | Drinking, holding a chicken |
| Sebastian | Smoking, idling on his motorbike |
| Penny & Harvey | Sitting and reading |
| Alex | Lifting weights |
| Jas, Marnie, Vincent | Jump rope, playing on the beach, dancing |
| Wizard | Stirring a cauldron |
| …and more | Leah sculpting and painting, Haley taking photos, Gus cooking, Pierre at the counter, Morris, Lewis, Linus, Evelyn, George, Kent, Demetrius, Marcello, the toddlers… |

Some villagers also have a short **shocked gesture** (click them to see it). All animation clips were reviewed frame by frame, with unusable frames — filler cells, wedding/formal outfits, motion-linked rows — deliberately left out rather than forced into a loop.

### 🕰️ Villager Visits (Schedule Mode)

Don't feel like managing villagers by hand? Turn on **Scheduled visits** and Pelican Town comes to you:

- Every villager keeps their own **Stardew-style daily schedule** — Willy shows up at dawn, Gus around noon, Sebastian in the late afternoon
- The roster is stable within a day and **rotates daily**, so there's always someone new to meet
- Choose how many villagers can be in town at once (1–6)
- Pets are unaffected — your animals stay right where they are

### 💬 Villager Conversations

Two villagers in town will occasionally **walk up to each other, face off, and strike up a conversation** — generated by AI from their personalities, your current note, and what they remember about you. Nearby animals gather around to watch (silently, of course).

### 🧠 Core Memories

Villagers pay attention. After speaking, a villager may distill a **durable fact about you** — that you're writing a novel, studying for an exam, learning Japanese — and remember it in future conversations. Every villager keeps their own memory (up to 10 entries each), and you can review or clear them anytime in settings.

### 🖥️ Display Modes

- **Panel mode**: Companions live in a resizable side panel dockable anywhere in your workspace
- **Overlay mode**: Companions roam freely across your entire Obsidian window as a transparent overlay
- **Interaction**: Click a companion to see a heart ❤️ (villagers may also react with a gesture), right-click a villager to trigger an AI speech bubble
- **Drag & Drop**: Reposition pets manually or let them wander on their own

### 🤖 AI-Powered Speech Bubbles

Villagers comment on your notes using AI, with authentic in-game voices:

- **Right-click** a villager to get a contextual comment about your current note
- **Auto-rant mode**: Villagers periodically speak up on their own at random intervals
- Supports any **OpenAI-compatible API** (OpenAI, Google Gemini, DeepSeek, and more)
- Each villager has a unique personality and voice that shapes their dialogue — Sebastian mutters like a coder at 3 AM, Evelyn fusses over you with cookies
- Optional Chinese-language prompt mode for all AI interactions
- Animals never talk — they express themselves with hearts, animations, and enthusiastic spectating

---

## 📦 Installation

### Method 1: Community Plugins (Recommended)

1. Open Obsidian and go to **Settings → Community Plugins**
2. Ensure **Restricted Mode** is turned off
3. Click **Browse** and search for **"Stardew Valley Pals"**
4. Click **Install**, then **Enable**
5. You're all set! Use the **"Add a pet"** command to get started

### Method 2: BRAT (Beta Reviewer's Auto-update Tester)

> BRAT lets you install plugins that are not yet in the community plugin store, and automatically checks for updates.

1. Install the **BRAT** plugin from the Community Plugins store
2. Open **Settings → BRAT → Beta Plugin List**
3. Click **Add Beta Plugin**
4. Enter the repository URL:
   ```
   https://github.com/miaowuduck/stardew-valley-pals
   ```
5. BRAT will install the plugin — go to **Settings → Community Plugins** and enable **Stardew Valley Pals**
6. To update, run the **BRAT: Update all plugins and themes** command

### Method 3: Manual Installation

1. Download the latest release from the [Releases page](https://github.com/miaowuduck/stardew-valley-pals/releases)
2. Extract the folder into your vault's `.obsidian/plugins/` directory
3. Restart Obsidian (or go to **Settings → Community Plugins** and click **Reload plugins**)
4. Enable **Stardew Valley Pals**

---

## 🚀 Getting Started

1. Enable the plugin — a welcome notice will guide you on first launch
2. Use the **"Add a pet"** command, the `+` button in the pet panel, or the **Pet Management** section in settings to choose a companion
3. The pet panel opens automatically — your new friend will start wandering around
4. Manage your pets anytime in **Settings → Pet Management** — add, view, or remove pets from one place
5. (Optional) Turn on **Scheduled visits** in **Settings → Villager Visits** to let villagers drop by on their own
6. (Optional) Configure AI speech in **Settings** to let your villagers talk

Click the 🐱 ribbon icon in the left sidebar to toggle the pet view on and off.

---

## ⌨️ Commands

| Command | Description |
|---|---|
| `Add a pet` | Choose a pet or villager (pets can be named; villagers are unique) |
| `Remove a specific pet` | Pick a pet to remove from the list |
| `Remove all pets` | Clear all pets at once |

---

## ⚙️ Settings

### Display

| Setting | Description | Default |
|---|---|---|
| Overlay mode | Full-window transparent overlay vs side panel | Off |
| Pet size | Scale pets from 0.5x to 3.0x | 1.0x |
| Movement speed | How fast pets wander (0.5x to 3.0x) | 1.0x |

### Pet Management

| Setting | Description |
|---|---|
| Current pets | View all your companions with their names and species, remove any of them with one click |
| Add a new pet | Opens the selector — free-form pets plus one-of-a-kind villagers |

### Villager Visits

| Setting | Description | Default |
|---|---|---|
| Scheduled visits | Villagers arrive/leave on their own daily schedule (replaces manual villager management) | Off |
| Max visitors | How many villagers can be in town at once | 3 |
| Currently in town | Read-only list of who's visiting right now | — |

### AI Configuration

| Setting | Description | Default |
|---|---|---|
| API key | OpenAI-compatible API key (masked in UI) | — |
| API endpoint | Base URL for the AI provider | `https://api.openai.com/v1` |
| Model | Model name (e.g. `gpt-4o-mini`, `gemini-2.5-flash`) | `gpt-5-mini` |
| Chinese prompt | Use Chinese-language AI prompts | Off |
| Test connection | Verify API credentials with a minimal request | — |

### Speech Bubbles

| Setting | Description | Default |
|---|---|---|
| NPC speech | Allow villagers to show speech bubbles | On |
| Villager conversations | Let two villagers walk up and chat with each other | On |

### Villager Memory

| Setting | Description | Default |
|---|---|---|
| Core memories | Villagers distill durable facts about you and remember them | On |
| Per-villager entries | Review what each villager remembers; clear individually or all at once | — |

### Random Page Rant

| Setting | Description | Default |
|---|---|---|
| Random page rants | Enable periodic auto-speech | Off |
| Only rant when focused | Suppress rants when Obsidian is in the background | On |
| Rant interval (min) | Minimum time between rants | 5 min |
| Rant interval (max) | Maximum time between rants | 20 min |
| Page context length | Characters of note content sent as AI context | 1200 chars |

A **Reset to defaults** button is available at the bottom of the settings tab.

---

## 🔧 AI Setup

To enable speech bubbles, configure an API provider in settings:

1. Get an API key from your preferred provider:
   - [OpenAI](https://platform.openai.com/api-keys)
   - [Google Gemini](https://aistudio.google.com/)
   - [DeepSeek](https://api-docs.deepseek.com/)
2. Set the **API endpoint** (e.g. `https://api.openai.com/v1` for OpenAI, or `https://generativelanguage.googleapis.com/v1beta/openai/` for Gemini)
3. Enter the **model** name for your provider
4. Click **Test connection** to verify everything works
5. Enable NPC speech bubbles and optionally random page rants

Villagers will now comment in-character on your notes — and remember what they learn about you. The model may also pick a matching body action from the villager's animation set; if it doesn't, the villager simply keeps standing as before. Any malformed response degrades gracefully to plain text.

---

## 🛠️ Development

```bash
npm install
npm run dev      # watch build
npm run build    # type-check + production bundle
```

The `scripts/` folder contains read-only Python tools used to curate the sprite sheets (they require Pillow and are not part of the plugin bundle):

| Script | Purpose |
|---|---|
| `make-contact-sheets.py` | Enlarged, labeled contact sheets for each NPC sheet |
| `analyze-edges.py` | Per-cell edge/pixel analysis to spot split-cell composite frames |
| `verify-frames.py` | Fails if any frame referenced by the animation table is empty, filler, or off-sheet |
| `export-animations.py` | Exports every animation as a labeled strip + GIF for manual review |

Generated images are written to `scripts/out/` and are git-ignored.

---

## 🙏 Credits

### Origin Projects
- [stardew-pet-farm](https://github.com/PROF0UND/stardew-pet-farm) — Original Stardew Valley pet concept and sprites
- [obsidian-pets](https://github.com/hiden2000/obsidian-pets) — Original Obsidian plugin implementation

### Art Assets
All pet sprites, villager character sprites, and images are sourced from [StardewValley-Assets](https://github.com/Huu-Yuu/StardewValley-Assets) by Huu-Yuu, which provides extracted Stardew Valley game assets.

### Inspiration
- [vscode-pets](https://marketplace.visualstudio.com/items?itemName=tonybaloney.vscode-pets) — The original VSCode pets extension

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 💬 Feedback

Found a bug or have a suggestion? Open an issue on [GitHub](https://github.com/miaowuduck/stardew-valley-pals/issues).

---

*Made with ❤️ for Stardew Valley fans and Obsidian users alike.*
