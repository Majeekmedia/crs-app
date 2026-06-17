# Antigravity Kit — Global Agent Protocols

> **Location:** `C:\Users\HP\.agent\`
> **Full version:** `~/.copilot/instructions/antigravity-kit.instructions.md`
> The AI MUST follow these protocols in ALL workspaces.

---

## 🔴 CRITICAL: AGENT & SKILL PROTOCOL

**MANDATORY:** Before performing ANY implementation:

1. Read this file for global protocols
2. Read `C:\Users\HP\.agent\rules\GEMINI.md` for full universal rules (P0 priority)
3. Check the project's `.agent/` folder if it exists (project overrides take priority)
4. Apply agent routing based on request classification

---

## 📥 REQUEST CLASSIFIER

| Type | Keywords | Protocol |
|------|----------|----------|
| **QUESTION** | "what is", "how does" | Direct text response |
| **SIMPLE CODE** | "fix", "add", "change" (single file) | Inline edit |
| **COMPLEX CODE** | "build", "create", "implement" | Plan first |
| **DESIGN/UI** | "design", "UI", "page" | Plan + implement |

---

## 🤖 INTELLIGENT AGENT ROUTING

**ALWAYS ACTIVE:** Before writing ANY code, complete this checklist:

| Step | Check |
|------|-------|
| 1 | Identify correct agent for this domain |
| 2 | READ the agent's `.md` file (or recall its rules) |
| 3 | Announce `🤖 Applying knowledge of @[agent]...` |
| 4 | Load required skills from agent's frontmatter |

### Agent Selection Quick Reference

| Intent | Agent(s) |
|--------|----------|
| Auth/Security | `security-auditor` + `backend-specialist` |
| Web Frontend | `frontend-specialist` |
| Mobile | `mobile-developer` |
| API / Backend | `backend-specialist` |
| Database / Schema | `database-architect` |
| Bug Fix | `debugger` |
| Tests | `test-engineer` |
| DevOps / Deploy | `devops-engineer` |
| Security Review | `security-auditor` + `penetration-tester` |
| Performance | `performance-optimizer` |
| Planning | `project-planner` |
| New Feature (multi-domain) | `orchestrator` → ASK FIRST |
| Documentation | `documentation-writer` (only if asked) |

---

## 🛑 SOCRATIC GATE

Every request MUST pass: New Feature → ask 3+ questions; Bug Fix → confirm impact; Vague → clarify; List → ask trade-offs.

## 🧹 GLOBAL CODE RULES

1. Clean Code: concise, direct, no over-engineering
2. File Dependency Awareness: update ALL affected files together
3. Read → Understand → Apply: understand WHY before coding
4. Project Routing: MOBILE→`mobile-developer`, WEB→`frontend-specialist`, BACKEND→`backend-specialist`

---

## 🧩 SKILLS & WORKFLOWS

**Skills** at `C:\Users\HP\.agent\skills\`: `clean-code` (always active), `frontend-design`, `api-patterns`, `database-design`, `testing-patterns`, `tailwind-patterns`, `behavioral-modes`, `architecture`, `plan-writing`, `systematic-debugging`, `powershell-windows`, `bash-linux`

**Workflows** at `C:\Users\HP\.agent\workflows\`: `/brainstorm`, `/create`, `/debug`, `/deploy`, `/enhance`, `/orchestrate` (3+ agents), `/plan`, `/preview`, `/status`, `/test`, `/ui-ux-pro-max`

---

## 🔄 PRIORITY

**P0** = `GEMINI.md` > **P1** = Agent `.md` > **P2** = Skill `SKILL.md`. All binding. No skipping.
