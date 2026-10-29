# Manuel Caipo | Machine Learning Engineer & Mechanical Engineer

Welcome to my professional portfolio. I specialize in **AI-powered Predictive Maintenance** and **scalable data architectures**, bridging heavy industry (Mechanical Engineering) with advanced Machine Learning.

**Live portfolio:** https://manuelcaipocc.github.io/

---

## Professional Profile

Machine Learning Engineer with a strong **Data Engineering** and **Industrial IoT** focus. I build end-to-end solutions (data pipelines → modeling → deployment) that target measurable impact in reliability, availability, and OEE.

- **Location:** Blaustein, Germany  
- **Current role:** Master’s Student & Data Scientist, Bosch Rexroth (Ulm)  

---

## Technical Stack

- **Languages:** Python (Pandas, PyTorch, scikit-learn), SQL, MATLAB, C/C++  
- **Machine Learning:** Time-series modeling (LSTM/Attention), CNNs, XGBoost, interpretability (SHAP, PDP)  
- **Data Engineering:** ETL/ELT pipelines, Snowflake, Databricks, Azure ML, SQL/NoSQL  
- **Industrial Tech:** MQTT, OPC UA, ROS/ROS2, PLC (TIA Portal), Bosch Rexroth ctrlX

---

## Run locally

Requires [Hugo **extended 0.136.5**](https://github.com/gohugoio/hugo/releases/tag/v0.136.5) and [Go](https://go.dev/dl/) (Hugo modules).

```bash
hugo server -D          # dev server -> http://localhost:1313
hugo --gc --minify      # production build -> public/
```

Windows with the portable Hugo in `%LOCALAPPDATA%`:

```powershell
$env:PATH = "$env:LOCALAPPDATA\hugo-0.136.5;$env:PATH"; hugo server -D
```

Deploy: a normal `git push` to `main` -> GitHub Actions builds and publishes to GitHub Pages (`.github/workflows/publish.yaml`).

---

## Where to edit

| I want to change... | File |
|---|---|
| Name, bio, photo, social links, education, work, skills, awards, interest areas | `content/authors/admin/_index.md` (+ `avatar.*` in the same folder) |
| Order of home sections, their titles, Highlights, Interests visuals, Lab, Contact | `content/_index.md` |
| Publications | `content/publication/<name>/index.md` + `cite.bib` |
| CV (PDF) | `static/uploads/resume.pdf` |
| Colors, gradients, layout | `assets/css/custom.css` (palette variables at `:root` / `html.dark`) |
| Navbar | `config/_default/menus.yaml` |
| Site title, SEO, analytics | `config/_default/hugo.yaml`, `config/_default/params.yaml`, `layouts/partials/hooks/head-end/` |
| Interactive visuals (optimization, fluid, attention) | `assets/js/viz/<kind>.js` |
| Company / university logos | `assets/media/companies/` |

### Interests visuals: where the code lives

| Visual (home › Interests) | Code | Text / on-off | Based on | License |
|---|---|---|---|---|
| Numerical Optimization | `assets/js/viz/optimization.js` | `visuals` in `content/_index.md` | Own code, inspired by [Gradient Lab](https://github.com/NeoVand/GradientDescent) (no code copied) | — |
| Computational Fluid Dynamics | `assets/js/viz/fluid.js` | `visuals` in `content/_index.md` | Adapted from [WebGL Fluid Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation), © 2017 Pavel Dobryakov | MIT (full notice kept in the file header and in the published JS) |
| Lab › Attention Simulator | `assets/js/viz/attention.js` | `lab` in `content/_index.md` | Ported from [attention-visualizer](https://github.com/zasa4/attention-visualizer) | Upstream repo has no license file |

Shared pieces: HTML in `layouts/partials/blox/community/mc-interests.html`, lazy loading in `assets/js/mc.js`, styles in `assets/css/custom.css` ("Scientific visualizations" / "Lab").
The original repositories are not part of this repo; only the adapted files above are.

- There is no `visuals/` folder: `visuals:` and `lab:` are YAML keys inside `content/_index.md` (block `mc-interests`). Each entry's `kind` loads `assets/js/viz/<kind>.js`.
- Self-contained: plain JavaScript, no npm, no CDN, no external APIs. The GitHub Actions build only needs Hugo; the upstream repos (kept locally in the git-ignored `temp/`) are not used at build or run time and can be deleted.
- Add a new visual: create `assets/js/viz/<name>.js` and add an entry with `kind: <name>` under `visuals:`.

---

## About This Repository

This site is built with **Hugo** using a concise Academic-style CV template (Hugo Blox / Academic CV). I use it to present:
- Publications and references (BibTeX integration)
- Technical documentation (LaTeX-friendly content)
- A structured project portfolio

### Attribution
Theme framework: Hugo Blox Builder (Academic CV)  
Docs: https://docs.hugoblox.com/  
Theme repository: https://github.com/HugoBlox/theme-academic-cv  
Third-party code in the interactive visuals: see [Interests visuals](#interests-visuals-where-the-code-lives).

---

_Last updated: 2026 — Developed by Manuel Caipo_
