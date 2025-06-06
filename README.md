# BoR 👋

<!-- GitHub Badges -->
![GitHub stars](https://img.shields.io/github/stars/BoRDev/BoR?style=social)
![GitHub forks](https://img.shields.io/github/forks/BoRDev/BoR?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/BoRDev/BoR?style=social)
![GitHub repo size](https://img.shields.io/github/repo-size/BoRDev/BoR)
![GitHub language count](https://img.shields.io/github/languages/count/BoRDev/BoR)
![GitHub top language](https://img.shields.io/github/languages/top/BoRDev/BoR)
![GitHub last commit](https://img.shields.io/github/last-commit/BoRDev/BoR?color=red)
![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FBoRDev%2FBoR&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)

**BoR 是一款功能丰富、用户友好、可扩展的自托管人工智能平台，专为完全离线操作而设计。**
(BoR is an extensible, feature-rich, and user-friendly self-hosted AI platform designed to operate entirely offline.)

---

## 📖 BoR (原 Open-WebUI) 简介

BoR (原名 Open-WebUI) 是一个开源的自托管AI平台，致力于为用户提供本地化、可定制且功能强大的大语言模型（LLM）交互体验。我们的目标是打造一个集聊天、检索增强生成（RAG）、模型管理、用户管理和个性化设置为一体的综合性AI工作台。

**核心价值：**
*   **数据隐私与控制：** 完全自托管，确保数据安全与隐私。
*   **高度可扩展：** 支持多种LLM运行器（Ollama, OpenAI兼容API等），并提供插件框架。
*   **用户友好：** 简洁直观的界面设计，注重用户体验。
*   **离线优先：** 核心功能支持完全离线运行。
*   **社区驱动：** 积极听取社区反馈，持续迭代与创新。

---

## ✨ 主要特性

*   🚀 **轻松设置**: 通过 Docker 或 Kubernetes (kubectl, kustomize 或 helm) 无缝安装，支持 `:ollama` 和 `:cuda` 标签的镜像。
*   🤝 **多LLM后端支持**:
    *   轻松集成 **Ollama**，支持其所有模型。
    *   支持连接兼容 **OpenAI API** 的服务端点，如 LMStudio, Groq, Mistral AI, OpenRouter 等。
*   📚 **检索增强生成 (RAG):**
    *   内置RAG引擎，支持从文档（PDF, TXT, MD等）中提取内容并作为聊天上下文。
    *   支持通过 `#` 命令快速指定知识库集合或文档进行查询。
    *   支持通过URL加载网页内容作为RAG数据源。
    *   集成网页搜索功能 (SearXNG, Google PSE, Brave Search等)，将搜索结果注入聊天。
*   💬 **核心聊天功能:**
    *   完整的聊天界面，支持消息收发（流式与非流式）。
    *   Markdown 及 LaTeX 渲染，代码块高亮。
    *   消息操作：复制，（未来支持）编辑、删除。
    *   多模态输入占位（如图片上传，功能开发中）。
*   🛠️ **模型与参数控制:**
    *   聊天中动态选择语言模型。
    *   调整温度（Temperature）等模型参数。
    *   模型与参数设置可按会话持久化。
*   🔄 **会话管理:**
    *   通过可伸缩侧边栏进行全面的会话管理：新建、历史列表、切换、删除。
    *   活动会话状态与URL同步并持久化。
*   🎨 **用户个性化:**
    *   主题定制（明亮/暗黑/跟随系统），偏好设置持久化。
    *   用户资料页面（查看/编辑姓名、邮箱、头像 - 头像和部分信息更新依赖后端API支持）。
*   🔐 **用户与权限管理:**
    *   基于角色的访问控制 (RBAC)。
    *   管理员可通过独立的React管理后台进行用户创建、管理、权限分配。
    *   支持通过 `settings_config.yaml` 设置默认用户角色和权限细节。
*   ⚙️ **集中化配置 (`settings_config.yaml`):**
    *   通过单一 `settings_config.yaml` 文件简化部署和核心服务配置。
    *   可配置内容包括：服务端口、JWT密钥、默认主题、Ollama及OpenAI兼容API端点、RAG参数（模型、块大小等）、网页搜索API密钥、代码解释器设置、默认用户权限等。
*   🖼️ **图像生成集成**: 支持 AUTOMATIC1111、ComfyUI (本地) 及 OpenAI DALL-E (外部) 等。
*   🗣️ **语音交互**: 支持语音输入 (STT) 和语音输出 (TTS)。
*   📱 **响应式设计与PWA**: 适配桌面与移动设备，支持PWA。
*   🌐 **多语言支持 (i18n)**: 支持多种界面语言，欢迎社区贡献翻译。
*   🔧 **模型构建器**: Web UI内创建Ollama Modelfile。
*   🐍 **Python函数调用工具**: 内置代码编辑器，支持自定义Python工具函数与LLM集成。
*   ➕ **持续更新与社区支持**: 定期更新，活跃的社区支持。

<details>
<summary>✨ Key Features (English Summary)</summary>

*   🚀 **Effortless Setup**: Docker or Kubernetes.
*   🤝 **Multiple LLM Backends**: Ollama, OpenAI-compatible APIs (LMStudio, Groq, Mistral AI, etc.).
*   📚 **Retrieval Augmented Generation (RAG):** Built-in engine, document upload (PDF, TXT, MD), query with `#collection_name`, web page loading via URL, web search integration.
*   💬 **Core Chat Features:** Streaming/non-streaming messages, Markdown/LaTeX, code highlighting, copy messages, (WIP: edit/delete), multimodal input placeholder.
*   🛠️ **Model & Parameter Control:** In-chat model selection, temperature adjustment, persisted per session.
*   🔄 **Session Management:** Collapsible sidebar for new/list/switch/delete chats, URL sync, persisted.
*   🎨 **User Personalization:** Theme (light/dark/system), profile page (view/edit - backend dependent for updates).
*   🔐 **User & Permission Management:** RBAC, dedicated React admin UI, default roles via `settings_config.yaml`.
*   ⚙️ **Centralized Configuration (`settings_config.yaml`):** Ports, JWT, themes, LLM endpoints, RAG settings, search APIs, code interpreter, default permissions.
*   🖼️ **Image Generation:** AUTOMATIC1111, ComfyUI, DALL-E.
*   🗣️ **Voice Interaction:** STT/TTS.
*   📱 **Responsive Design & PWA**.
*   🌐 **Multilingual Support (i18n)**.
*   🔧 **Model Builder**: Create Ollama Modelfiles in UI.
*   🐍 **Python Function Calling Tool**.
*   ➕ **Continuous Updates & Community Support**.
</details>

---

## 🛠️ 技术栈 (Tech Stack)

*   **后端 (Backend):** Python (FastAPI), SQLAlchemy, Alembic
*   **原用户前端 (Svelte - 维护模式):** SvelteKit, TypeScript
*   **React管理前端 (Admin Frontend):** React, Vite, Ant Design, Zustand, TypeScript
*   **React应用前端 (App Frontend):** React, Vite, Ant Design, Zustand, TypeScript, React Router
*   **数据库 (Database):** SQLite (默认), PostgreSQL
*   **容器化 (Containerization):** Docker, Kubernetes (Kustomize, Helm)

---

## 🖼️ 截图展示 (Screenshots - 中文界面)

*未来将在此处替换为中文界面的实际截图。*

1.  **BoR 应用主聊天界面 (含模型与知识库选择器):**
    `![BoR应用聊天界面截图](images/bor-app-chat-interface_zh.png "BoR应用聊天界面（中文），展示模型选择、RAG知识选择器和消息区")`
    *说明：新的 BoR 应用前端主聊天界面，清晰展示模型选择下拉菜单、知识库选择器、聊天历史记录区以及消息输入区。*

2.  **BoR 应用会话管理侧边栏:**
    `![BoR应用会话管理侧边栏截图](images/bor-app-sidebar_zh.png "BoR应用会话管理侧边栏（中文）")`
    *说明：展示了可伸缩的会话历史列表侧边栏，包含新建聊天按钮、会话搜索（如果实现）和会话条目。*

3.  **BoR 应用用户个性化设置 - 外观主题选择:**
    `![BoR应用外观设置截图](images/bor-app-appearance-settings_zh.png "BoR应用外观设置页面（中文）")`
    *说明：用户在设置中选择“明亮”、“暗黑”或“跟随系统”主题的界面。*

4.  **BoR 应用用户个性化设置 - 个人资料页面:**
    `![BoR应用个人资料页截图](images/bor-app-profile-page_zh.png "BoR应用个人资料页面（中文）")`
    *说明：用户查看和编辑其用户名、邮箱及更换头像的界面。*

5.  **BoR React管理后台 - 用户管理:**
    `![BoR管理后台用户管理截图](images/bor-admin-user-management_zh.png "BoR管理后台用户管理界面（中文）")`
    *说明：管理员在新的React管理后台中管理用户列表、编辑用户角色和状态的界面。*

6.  **BoR React管理后台 - 系统配置:**
    `![BoR管理后台系统配置截图](images/bor-admin-system-config_zh.png "BoR管理后台系统配置界面（中文）")`
    *说明：管理员在React管理后台中配置各项系统参数的界面，如UI设置、认证设置等。*

*(请注意：以上所有引用的截图均为占位符，需要实际生成中文界面的截图并替换。)*

---

## 🚀 快速开始 / 安装部署

我们推荐使用 Docker 进行快速部署。对于本地开发或更复杂的部署场景，也提供了手动安装选项。

### 核心配置: `settings_config.yaml`
在开始任何部署之前，请了解 `settings_config.yaml` 文件。它是BoR后端的中央配置文件，用于管理服务端口、品牌化、LLM服务端点、RAG参数、数据库连接等。
1.  复制项目根目录下的 `settings_config.yaml.example` 为 `settings_config.yaml`。
2.  根据您的需求修改此文件。**至少，您需要配置Ollama或兼容OpenAI的API端点才能开始聊天。**
3.  确保此文件被正确挂载到后端服务的数据目录中（例如，Docker部署时的Volume映射，或本地运行时位于 `DATA_DIR` 指定的路径下）。

### Docker 部署 (推荐)

> [!NOTE]
> 对于特定的Docker环境，可能需要额外配置。如遇连接问题，请参考我们的 [BoR文档](https://docs.bor.com/) (链接待更新)。
> [!WARNING]
> 使用Docker安装BoR时，请务必在Docker命令中包含 `-v bor-data:/app/backend/data` (或您自定义的数据目录)。此步骤至关重要，它能确保您的数据库和配置文件正确挂载且数据不会丢失。
> [!TIP]
> 若需使用包含Ollama或CUDA加速的BoR版本，我们推荐使用官方提供的 `:cuda` 或 `:ollama` 标签镜像。启用CUDA需在您的Linux/WSL系统上安装 [Nvidia CUDA容器工具包](https://docs.nvidia.com/dgx/nvidia-container-runtime-upgrade/)。

**1. 基础配置 (连接到您本地已有的Ollama服务):**
   ```bash
   docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
   ```
   *   `-p 3000:8080`: 将容器的8080端口映射到主机的3000端口。您可以通过 `http://localhost:3000` 访问BoR。
   *   `--add-host=host.docker.internal:host-gateway`: 允许容器访问宿主机的Ollama服务 (通常在 `http://host.docker.internal:11434`)。
   *   `-v ./bor-data:/app/backend/data`: **非常重要！** 将您本地当前目录下的 `bor-data` 文件夹映射为容器内后端数据目录。**请确保 `bor-data` 文件夹中包含您的 `settings_config.yaml` 文件。**

**2. 连接到不同服务器上的Ollama:**
   修改 `-e OLLAMA_BASE_URL` 环境变量：
   ```bash
   docker run -d -p 3000:8080 -e OLLAMA_BASE_URL=http://your-ollama-server-ip:11434 -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
   ```

**3. 使用Nvidia GPU运行 (需本地Ollama支持GPU):**
   ```bash
   docker run -d -p 3000:8080 --gpus all --add-host=host.docker.internal:host-gateway -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:cuda
   ```

**4. 仅使用兼容OpenAI的API (不使用Ollama):**
   在您的 `settings_config.yaml` 中配置 `openai_compatible_api` 相关参数。然后运行基础Docker命令。如果API密钥需要在环境变量中传递（不推荐，优先使用配置文件），则：
   ```bash
   docker run -d -p 3000:8080 -e OPENAI_API_KEY_PLACEHOLDER=your_secret_key -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
   ```
   *(注意：此处的 `OPENAI_API_KEY_PLACEHOLDER` 仅为示例，实际应通过 `settings_config.yaml` 配置。)*

**5. 使用捆绑Ollama的镜像 (一体化部署):**
   此镜像内置Ollama，简化部署。
   *   **GPU支持:**
       ```bash
       docker run -d -p 3000:8080 --gpus=all -v ollama_data:/root/.ollama -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:ollama
       ```
       (`ollama_data` 用于持久化Ollama模型)
   *   **仅CPU:**
       ```bash
       docker run -d -p 3000:8080 -v ollama_data:/root/.ollama -v ./bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:ollama
       ```
   访问地址仍为 `http://localhost:3000`。

**保持Docker安装更新:**
使用 [Watchtower](https://containrrr.dev/watchtower/) 自动更新：
```bash
docker run --rm --volume /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --run-once bor-webui
```
(将 `bor-webui` 替换为您的容器名)
更多更新指南请查阅 [BoR文档](https://docs.bor.com/getting-started/updating) (链接待更新)。

### 手动安装 / 本地开发部署

适用于开发者或需要更细致控制的场景。

**1. 后端 (Python FastAPI):**
   *   确保您已安装 Python 3.10+。
   *   克隆仓库: `git clone https://github.com/BoRDev/BoR.git`
   *   进入后端目录: `cd BoR/backend`
   *   创建并激活虚拟环境 (推荐):
       ```bash
       python -m venv venv
       source venv/bin/activate  # Linux/macOS
       # venv\Scripts\activate    # Windows
       ```
   *   安装依赖: `pip install -r requirements.txt`
   *   准备数据目录和配置文件:
       *   在 `backend` 目录下创建 `data` 文件夹 (或通过环境变量 `DATA_DIR` 指定其他路径)。
       *   将项目根目录的 `settings_config.yaml.example` 复制到您的数据目录 (例如 `backend/data/settings_config.yaml`) 并进行配置。
   *   运行数据库迁移 (如果使用数据库): `alembic upgrade head` (需要先配置好 `settings_config.yaml` 中的数据库连接)
   *   启动后端服务: `uvicorn main:app --host 0.0.0.0 --port 8080 --reload`
       (后端默认运行在 `http://localhost:8080`)

**2. React管理前端 (`bor_admin_frontend`):**
   *   进入目录: `cd ../bor_admin_frontend` (假设您在 `BoR/backend` 下)
   *   安装依赖: `npm install`
   *   创建 `.env.development` 文件，并设置 `VITE_API_BASE_URL=http://localhost:8080/api/v2/admin` (指向您的后端V2 Admin API地址)
   *   启动开发服务器: `npm run dev`
       (通常运行在 `http://localhost:5173`)

**3. React应用前端 (`bor_app_frontend`):**
   *   进入目录: `cd ../bor_app_frontend`
   *   **(手动步骤) 初始化Vite项目并安装依赖 (如果尚未完成):**
       请参照前面 "📦 BoR 应用前端 (新) - 开发中" > "如何运行" 部分的详细说明完成项目初始化和依赖安装。
   *   创建 `.env.development` 文件，并设置 `VITE_API_BASE_URL=http://localhost:8080/api/v1` (指向您的后端V1应用API地址)
   *   启动开发服务器: `npm run dev`
       (通常运行在 `http://localhost:5174` 或其他未被占用的端口，请检查Vite输出)

**4. Svelte旧版前端 (如需访问):**
   Svelte前端与后端集成在同一个Python服务中。当您通过 `uvicorn` 启动后端时，Svelte前端通常可以通过后端端口（例如 `http://localhost:8080`）直接访问，除非在 `settings_config.yaml` 中禁用了前端服务。

### 其他安装方式
包括非Docker本地安装、Docker Compose、Kustomize和Helm等。请访问我们的 [BoR文档](https://docs.bor.com/getting-started/) (链接待更新) 或加入我们的社区获取详细指南。

### 故障排除
连接问题？请查阅 [BoR文档的故障排除部分](https://docs.bor.com/troubleshooting/) (链接待更新)。

---

## 📖 使用指南 (BoR React应用前端)

新的React应用前端提供了现代化的用户体验。

1.  **登录:** 打开React应用前端地址 (如 `http://localhost:5174`)，使用您的账户凭据登录。
2.  **主界面:**
    *   **左侧边栏:** 管理您的聊天会话。点击“新建聊天”开始新的对话，或从列表中选择历史会话。
    *   **聊天区:** 显示当前会话的消息。您发送的消息和AI的回复会在这里展示。
    *   **顶部操作栏:**
        *   **模型选择器:** 选择本次对话希望使用的语言模型。
        *   **温度滑块:** 调整模型的创造性（温度值越低越保守，越高越随机）。
        *   **清空会话:** 清除当前聊天窗口的所有消息（仅影响本地显示，如需永久删除需后端支持）。
    *   **输入区:**
        *   **知识选择器:** (可选) 在输入消息前，从这里选择一个或多个已配置的知识库集合。选择后，您的提问将结合所选知识库内容进行检索增强。
        *   **消息输入框:** 输入您的问题或指令。支持Markdown。
        *   **(占位)附件按钮:** 未来将支持图片等多模态输入。
        *   **发送/停止按钮:** 发送消息，或在AI回复过程中停止生成。
3.  **消息操作:**
    *   **复制:** 每条消息旁都有复制按钮，方便复制代码或文本。
    *   **编辑/删除 (用户消息):** 您自己发送的消息旁边会有编辑和删除按钮（需后端API支持）。编辑操作会将消息内容填入输入框（或其他编辑模式）供修改。
4.  **用户菜单 (右上角):**
    *   **个人资料:** 查看和修改您的用户名、邮箱，更换头像（部分功能依赖后端）。
    *   **外观设置:** 切换应用的主题（明亮、暗黑或跟随系统）。
    *   **退出登录。**

---

## ⚙️ 管理后台使用指南 (BoR React管理前端)

新的React管理后台 (`bor_admin_frontend`) 提供了一个独立的、功能更全面的管理界面。

1.  **访问与登录:**
    *   打开React管理前端地址 (如 `http://localhost:5173`)。
    *   使用管理员账户登录。
2.  **主要模块:**
    *   **用户管理:** 创建、查看、编辑、删除用户，重置密码，分配角色。
    *   **系统配置:** (路径: 设置 > 系统配置) 查看和修改BoR后端的各项配置参数，如UI设置、认证参数、RAG设置、Ollama/OpenAI API端点等。配置项按类别分组。
    *   **RAG管理:**
        *   **外部服务:** 管理外部RAG API服务的连接（增删改查）。
        *   **知识库 (初步):** 上传文档到默认知识库，查看文档列表和状态。未来将扩展集合管理等功能。
    *   **模型管理 (初步):** 拉取新的Ollama模型，查看和删除本地Ollama模型，查看已配置的远程API模型。管理全局模型设置。
3.  **导航:** 使用左侧菜单栏进行模块切换。顶部面包屑指示当前位置，用户菜单提供注销选项。

---

## 🛠️ 开发 (Development)

### 项目结构简介
BoR项目主要包含以下几个部分：
*   `backend/`: Python FastAPI 后端服务，包含API实现、数据库模型、RAG逻辑等。
*   `frontend/` (或 `webui/`): 原Svelte用户前端 (目前维护模式)。
*   `bor_admin_frontend/`: 新的React管理前端。
*   `bor_app_frontend/`: 新的React应用前端。
*   `settings_config.yaml.example`: 后端核心配置文件示例。
*   `Dockerfile`, `docker-compose.yml` (如果提供): Docker相关配置。

### 后端开发指引
*   **环境:** Python 3.10+。
*   **主要框架/库:** FastAPI, SQLAlchemy, Alembic, Pydantic。
*   **API版本:**
    *   `/api/v1/*`: 主要供应用前端使用。
    *   `/api/v2/admin/*`: 主要供React管理前端使用。
*   **数据库迁移:** 使用 `alembic` 管理数据库结构变更。
    *   生成迁移脚本: `alembic revision -m "your_migration_message"`
    *   应用迁移: `alembic upgrade head`
*   **配置:** 核心配置通过 `settings_config.yaml` 管理，由 `backend/open_webui/config.py` (或类似路径) 加载和解析。
*   **运行:** `uvicorn main:app --reload`

### React管理前端开发指引 (`bor_admin_frontend/`)
*   **环境:** Node.js (推荐LTS版本), npm/yarn/pnpm。
*   **主要框架/库:** React, Vite, Ant Design, Zustand, TypeScript, React Router。
*   **API交互:** 通过 `src/api/` 下的服务模块与后端 `/api/v2/admin/*` API 通信。
*   **状态管理:** Zustand (`src/store/`)。
*   **启动:**
    1.  `cd bor_admin_frontend`
    2.  `npm install`
    3.  (可选) 创建 `.env.development` 并设置 `VITE_API_BASE_URL` (例如 `http://localhost:8080/api/v2/admin`)。
    4.  `npm run dev` (通常运行在 `http://localhost:5173`)

### React应用前端开发指引 (`bor_app_frontend/`)
*   **环境:** Node.js, npm/yarn/pnpm。
*   **主要框架/库:** React, Vite, Ant Design, Zustand, TypeScript, React Router。
*   **API交互:** 通过 `src/api/` 下的服务模块与后端 `/api/v1/*` API 通信。
*   **状态管理:** Zustand (`src/store/`)。
*   **启动:**
    1.  `cd bor_app_frontend`
    2.  **(手动步骤) 确保项目已正确初始化并安装依赖。** (参考前面 "如何运行（应用前端开发）" 部分的说明)
    3.  (可选) 创建 `.env.development` 并设置 `VITE_API_BASE_URL` (例如 `http://localhost:8080/api/v1`)。
    4.  `npm run dev` (通常运行在 `http://localhost:5174` 或其他可用端口)

---

## 🤝 贡献指南 (Contribution Guide)

我们热烈欢迎来自社区的各种贡献！无论是代码、文档、翻译、功能建议还是Bug报告，都对BoR项目至关重要。

<details>
<summary>主要的贡献方式 (How to Contribute)</summary>

1.  **报告Bug:** 如果您发现了Bug，请在GitHub Issues中提交详细报告，包括复现步骤、环境信息和期望行为。
2.  **提交功能请求:** 对于新功能或改进建议，也请通过GitHub Issues提出，并尽可能详细地描述您的想法和使用场景。
3.  **参与代码开发:**
    *   Fork本仓库。
    *   创建新的特性分支 (`git checkout -b feature/YourAmazingFeature`)。
    *   进行修改和开发。确保遵循项目编码规范（ESLint, Prettier等，如果配置了的话）。
    *   为您的修改添加适当的单元测试或集成测试。
    *   提交您的更改 (`git commit -m 'Add some YourAmazingFeature'`)。
    *   推送代码到您的fork仓库 (`git push origin feature/YourAmazingFeature`)。
    *   创建Pull Request到主仓库的 `main` (或 `dev`) 分支，并清晰描述您的PR内容。
4.  **完善文档:** 如果您发现文档有不清晰、不准确或缺失之处，欢迎提交PR改进。
5.  **国际化与翻译:** BoR致力于提供多语言支持。您可以帮助我们翻译新的语言，或改进现有语言的翻译。翻译文件通常位于各前端项目的 `src/locales/` 或类似路径下。
6.  **社区互助:** 在Issue列表、论坛或社区聊天中积极帮助其他用户解答问题。
</details>

我们期待您的参与！

---

## 📜 许可证 (License)

本项目基于 [BSD-3-Clause License](LICENSE) 授权。详情请参阅 [LICENSE](LICENSE) 文件。

---
## (可选) 英文版内容概要 / English Summary (Collapsed)
<details>
<summary><strong>Project Overview (English)</strong></summary>

BoR (formerly Open-WebUI) is an open-source, self-hosted AI platform designed for offline operation, offering rich features and extensibility. It supports various LLM runners (Ollama, OpenAI-compatible APIs) and includes a built-in RAG engine.

**Key Features (Summary):**
*   Easy setup (Docker, Kubernetes).
*   Ollama & OpenAI API integration.
*   Advanced RAG capabilities (document upload, web search, URL loading).
*   Full-featured chat interface (Markdown, code highlighting, model/parameter control per session, session management).
*   User personalization (themes, profile).
*   RBAC and user management via a new React-based Admin UI.
*   Centralized configuration with `settings_config.yaml`.
*   Image generation, voice interaction, PWA, multilingual support.

**Tech Stack (Summary):**
*   Backend: Python (FastAPI)
*   Frontends: Svelte (maintenance), React/Vite/AntD (new Admin & App UIs)

**Development & Installation (Summary):**
*   Refer to specific sections above for Docker (recommended) and manual/local development setup for the backend and React frontends.
*   The `settings_config.yaml` file is central to backend configuration.
*   The new React Admin UI (`bor_admin_frontend`) and React App UI (`bor_app_frontend`) have their own development workflows (typically `npm install && npm run dev`).

</details>

---

BoR 基于 Timothy Jaeryang Baek 最初创建的软件。让我们一起让BoR更加出色！ 💪
(BoR is based on software originally created by Timothy Jaeryang Baek. Let's make BoR even more amazing together!)
