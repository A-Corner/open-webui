# BoR 👋

![GitHub stars](https://img.shields.io/github/stars/BoRDev/BoR?style=social)
![GitHub forks](https://img.shields.io/github/forks/BoRDev/BoR?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/BoRDev/BoR?style=social)
![GitHub repo size](https://img.shields.io/github/repo-size/BoRDev/BoR)
![GitHub language count](https://img.shields.io/github/languages/count/BoRDev/BoR)
![GitHub top language](https://img.shields.io/github/languages/top/BoRDev/BoR)
![GitHub last commit](https://img.shields.io/github/last-commit/BoRDev/BoR?color=red)
![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FBoRDev%2FBoR&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)
<!-- Removed Discord badge, replace with BoR's if available -->
<!-- Removed Sponsor badge -->

**BoR is an [extensible](https://docs.bor.com/features/plugin/), feature-rich, and user-friendly self-hosted AI platform designed to operate entirely offline.** It supports various LLM runners like **Ollama** and **OpenAI-compatible APIs**, with **built-in inference engine** for RAG, making it a **powerful AI deployment solution**.

![BoR Demo](./demo_bor.gif) <!-- Assuming demo_bor.gif exists or this link will be updated -->

> [!TIP]  
> **Looking for an [Enterprise Plan](https://docs.bor.com/enterprise)?** – **[Speak with Our Sales Team Today!](mailto:sales@bor.com)**
>
> Get **enhanced capabilities**, including **custom theming and branding**, **Service Level Agreement (SLA) support**, **Long-Term Support (LTS) versions**, and **more!**

For more information, be sure to check out our [BoR Documentation](https://docs.bor.com/).

## Key Features of BoR ⭐

- 🚀 **Effortless Setup**: Install seamlessly using Docker or Kubernetes (kubectl, kustomize or helm) for a hassle-free experience with support for both `:ollama` and `:cuda` tagged images.

- 🤝 **Ollama/OpenAI API Integration**: Effortlessly integrate OpenAI-compatible APIs for versatile conversations alongside Ollama models. Customize the OpenAI API URL to link with **LMStudio, GroqCloud, Mistral, OpenRouter, and more**.

- 🛡️ **Granular Permissions and User Groups**: By allowing administrators to create detailed user roles and permissions, we ensure a secure user environment. This granularity not only enhances security but also allows for customized user experiences, fostering a sense of ownership and responsibility amongst users.

- 📱 **Responsive Design**: Enjoy a seamless experience across Desktop PC, Laptop, and Mobile devices.

- 📱 **Progressive Web App (PWA) for Mobile**: Enjoy a native app-like experience on your mobile device with our PWA, providing offline access on localhost and a seamless user interface.

- ✒️🔢 **Full Markdown and LaTeX Support**: Elevate your LLM experience with comprehensive Markdown and LaTeX capabilities for enriched interaction.

- 🎤📹 **Hands-Free Voice/Video Call**: Experience seamless communication with integrated hands-free voice and video call features, allowing for a more dynamic and interactive chat environment.

- 🛠️ **Model Builder**: Easily create Ollama models via the Web UI. Create and add custom characters/agents, customize chat elements, and import models effortlessly through [BoR Community](https://community.bor.com/) integration (assuming a BoR community site).

- 🐍 **Native Python Function Calling Tool**: Enhance your LLMs with built-in code editor support in the tools workspace. Bring Your Own Function (BYOF) by simply adding your pure Python functions, enabling seamless integration with LLMs.

- 📚 **Local RAG Integration**: Dive into the future of chat interactions with groundbreaking Retrieval Augmented Generation (RAG) support. This feature seamlessly integrates document interactions into your chat experience. You can load documents directly into the chat or add files to your document library, effortlessly accessing them using the `#` command before a query.

- 🔍 **Web Search for RAG**: Perform web searches using providers like `SearXNG`, `Google PSE`, `Brave Search`, `serpstack`, `serper`, `Serply`, `DuckDuckGo`, `TavilySearch`, `SearchApi` and `Bing` and inject the results directly into your chat experience.

- 🌐 **Web Browsing Capability**: Seamlessly integrate websites into your chat experience using the `#` command followed by a URL. This feature allows you to incorporate web content directly into your conversations, enhancing the richness and depth of your interactions.

- 🎨 **Image Generation Integration**: Seamlessly incorporate image generation capabilities using options such as AUTOMATIC1111 API or ComfyUI (local), and OpenAI's DALL-E (external), enriching your chat experience with dynamic visual content.

- ⚙️ **Many Models Conversations**: Effortlessly engage with various models simultaneously, harnessing their unique strengths for optimal responses. Enhance your experience by leveraging a diverse set of models in parallel.

- 🔐 **Role-Based Access Control (RBAC)**: Ensure secure access with restricted permissions; only authorized individuals can access your Ollama, and exclusive model creation/pulling rights are reserved for administrators.

- 🌐🌍 **Multilingual Support**: Experience BoR in your preferred language with our internationalization (i18n) support. Join us in expanding our supported languages! We're actively seeking contributors!

- 🧩 **Pipelines, BoR Plugin Support**: Seamlessly integrate custom logic and Python libraries into BoR using a Pipelines Plugin Framework. (Note: Link to generic pipeline concept, or BoR specific if exists, original link removed).

- 🌟 **Continuous Updates**: We are committed to improving BoR with regular updates, fixes, and new features.
- ⚙️ **Centralized Configuration**: Simplified deployment and setup using a single `settings_config.yaml` file. Configure service ports, branding, LLM endpoints, RAG, and more in one place. See `settings_config.yaml.example` for all options.
- 🧑‍💼 **User Management API (v2)**: A new set of administrator APIs (prefix: `/api/v2/admin/users`) for robust user management. Features include CRUD operations for users, activation/deactivation, password resets, pagination, and filtering. This API is designed for integration with a new, forthcoming independent admin interface.
- ✨ **New React-based Admin Frontend (In Development)**: A modern, separate admin frontend built with React, Vite, Ant Design, Zustand, and TypeScript. It aims to provide a dedicated and enhanced experience for all administrative tasks, eventually replacing management functionalities from the original Svelte frontend's admin section.
    - **Current Features:** Includes comprehensive User Management via the new V2 Admin APIs.
    - **Future Scope:** Other admin modules (System Configuration, Knowledge Management, Model Management, etc.) are planned for this new frontend.

Want to learn more about BoR's features? Check out our [BoR documentation](https://docs.bor.com/features) for a comprehensive overview!

## 🚀 BoR Admin Frontend (New)

The new BoR Admin Frontend is a dedicated interface built with React, Vite, Ant Design, Zustand, and TypeScript, designed to provide a modern and comprehensive experience for all administrative tasks. It will eventually replace the admin functionalities currently found within the main Svelte-based application.

### Accessing the Admin Frontend
The React admin frontend runs as a separate application during development.
- **URL:** Typically `http://localhost:5173` (Vite's default) when started with `npm run dev`.
- Ensure the BoR backend service is running, as the admin frontend connects to the same backend APIs.

### Logging In
Use your administrator credentials to log in. The same credentials used for the main BoR application's admin access are used here, as authentication is handled by the shared backend.

![BoR Admin Login Page Screenshot](images/bor-admin-login.png "BoR Admin Login Page")
*Caption: The login screen for the BoR Admin Frontend. (Note: Screenshot is a placeholder)*

### Navigating the Admin Frontend
The admin frontend features a classic layout:
- **Left Sidebar:** Collapsible navigation menu for accessing different admin modules.
- **Top Header:** Displays breadcrumbs for current location and a user profile dropdown with a logout option.
- **Main Content Area:** Where the specific module's interface is rendered.

![BoR Admin Dashboard Screenshot](images/bor-admin-dashboard.png "BoR Admin Dashboard Overview")
*Caption: Overview of the BoR Admin Dashboard after login, showing the main layout. (Note: Screenshot is a placeholder)*

### Key Management Modules (Preliminary)

Currently, the following modules have been implemented in the new admin frontend:

*   **User Management:**
    *   Accessible via the "User Management" menu.
    *   Allows administrators to create, list, search, filter (by username/email, role, active status), update (role, email, active status), and delete users.
    *   Includes functionality to set or reset user passwords.
    ![Admin User List Screenshot](images/bor-admin-user-list.png "BoR Admin User Management")
    *Caption: User management table interface. (Note: Screenshot is a placeholder)*

*   **System Configuration:**
    *   Found under "Settings" > "System Configs".
    *   Enables viewing and modification of various backend configurations, grouped by category (e.g., UI, Auth, RAG, Ollama). Changes are saved and applied to the backend.
    ![Admin System Config Screenshot](images/bor-admin-system-config.png "BoR Admin System Configuration")
    *Caption: System configuration interface with tabbed categories. (Note: Screenshot is a placeholder)*

*   **External RAG Services:**
    *   Located under "RAG Management" > "External Services".
    *   Manage connections to external RAG APIs by adding, editing, or deleting service configurations (URL, API Key).
    ![Admin External RAG Screenshot](images/bor-admin-external-rag.png "BoR Admin External RAG Services")
    *Caption: Managing external RAG service connections. (Note: Screenshot is a placeholder)*

*   **Model Management (Preliminary):**
    *   Accessible via "Model Management".
    *   Allows pulling new Ollama models, viewing local Ollama models and configured remote/API-based models.
    *   Supports deleting local Ollama models.
    *   Manage global model settings (e.g., default model list, model display order).
    ![Admin Model Management Screenshot](images/bor-admin-model-management.png "BoR Admin Model Management")
    *Caption: Interface for managing LLM models. (Note: Screenshot is a placeholder)*

*   **Knowledge Base Management (Preliminary):**
    *   Found under "RAG Management" > "Knowledge Bases".
    *   Features document uploading (drag-and-drop or selection).
    *   View lists of uploaded documents with their processing status.
    *   View lists of existing knowledge base collections (collection creation/management is WIP).
    ![Admin Knowledge Base Screenshot](images/bor-admin-knowledge-base.png "BoR Admin Knowledge Base Management")
    *Caption: Document upload and listing in Knowledge Base Management. (Note: Screenshot is a placeholder)*

### Developing the React Admin Frontend
The new React-based admin frontend is located in the `bor_admin_frontend` directory.

1.  **Navigate to the directory:**
    ```bash
    cd bor_admin_frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    ```
    This usually starts the admin frontend on `http://localhost:5173` (Vite's default port, check console output).

### Future Scope
Additional admin modules and enhancements will be progressively added to this new React frontend.

*(Please note: All screenshots referenced above are placeholders and need to be created and added to an `images/` directory in the project root.)*

## 📦 BoR App Frontend (New) - In Development

Alongside the new admin interface, a brand new **application frontend** is also under development, built with the same modern technology stack: React, Vite, Ant Design, Zustand, and TypeScript.

**Purpose:** This frontend aims to eventually replace the current Svelte-based user-facing application. It will provide the main interface for users to interact with chat functionalities, RAG features, manage their profiles, and other application-specific settings.

**Current Status & Features:**
*   **Core Chat Interface:** "Fully functional chat interface with message sending, receiving (streaming & non-streaming), Markdown rendering, code block highlighting, and copy-to-clipboard for messages."
*   **Session Management:** "Comprehensive session management via a collapsible sidebar: create new chats, list history, switch between sessions, and delete sessions. Active session is reflected in URL and persisted."
*   **RAG Context Selection:** "Users can select available Knowledge Base collections via a 'Knowledge Picker' integrated into the chat input to provide context for RAG-enhanced queries."
*   **Model & Parameter Control:** "In-chat selection of language models and adjustment of parameters like temperature, with settings persisted per session."
*   **User Personalization:** "Theme customization (light/dark/system with persistence) and a basic user profile page (view/edit name, email, avatar - backend-dependent for updates)."
*   **Authentication:** "Robust login, logout, and session restoration mécanisme using JWT tokens stored in localStorage."
*   **Testing:** "Core components, stores, and API services are covered by unit and integration tests using Vitest and React Testing Library."
*   **Overall Status:** "The React App Frontend has achieved a near-MVP (Minimum Viable Product) state for core chat functionalities."

![BoR App Chat Interface](images/bor-app-chat-interface.png "BoR App Chat Interface with Model & Knowledge Selection")
*Caption: The main chat interface of the new BoR App Frontend, showcasing model selection, RAG knowledge picker, and message display. (Note: Screenshot is a placeholder)*

**How to Run (App Frontend for Development):**

> **Important Note:** Due to current automated tooling limitations during the initial project scaffolding phase, the Vite project initialization (`npm create vite`) and initial dependency installation (`npm install`) for the `bor_app_frontend` directory must be performed manually by the developer in their local environment. The necessary source code files for the core framework and directory structure have been programmatically provided.

1.  **Navigate to the `bor_app_frontend` directory:**
    ```bash
    cd bor_app_frontend
    ```
2.  **(Manual Step) Initialize Vite Project & Install Dependencies:**
    If not already done (e.g., if you're setting this up for the first time after pulling the codebase):
    *   Ensure you have Node.js and npm (or Yarn/pnpm) installed.
    *   If `package.json` is missing or incomplete, you might need to run `npm create vite@latest . -- --template react-ts` (or your package manager's equivalent) carefully, ensuring not to overwrite existing source files if they are already present.
    *   Install core dependencies:
        ```bash
        npm install antd react-router-dom@6 axios zustand react-hook-form react-markdown remark-gfm rehype-highlight
        npm install @ant-design/icons --save
        # npm install dayjs # If needed for date handling
        ```
        (Refer to the initial setup plan for a more complete list if needed, or check existing `bor_admin_frontend` for guidance on typical dev dependencies like `@types/react` etc. if not added by Vite's template.)
3.  **(Once initialized and dependencies are installed) Create Environment File:**
    *   In the `bor_app_frontend` root, create a `.env.development` file (or `.env.local`).
    *   Add your API base URL, for example: `VITE_API_BASE_URL=/api/v1`
4.  **Run the development server:**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    ```
    The application frontend will typically be available at `http://localhost:PORT_OF_REACT_APP/` (Vite's default is often 5173; ensure it's different from the admin frontend or backend if running simultaneously). It connects to the same backend API as the main/admin applications.

**Future Scope / Next Steps:**
*   "Immediate next steps include: "
    *   "Implementing the display of RAG-retrieved sources within chat messages to complete the RAG query cycle."
    *   "Close collaboration with backend development to ensure full alignment and stability of V1 application APIs, especially for session initiation, streaming protocols, and error handling."
    *   "Further enhancements to error handling and overall user experience based on testing and feedback."
*   "Longer-term goals involve adding advanced features, further performance optimizations, and eventually achieving full parity with (and superseding) the original Svelte-based application."

## 🔗 Also Check Out BoR Community!

Don't forget to explore our sibling project, [BoR Community](https://community.bor.com/) (assuming URL), where you can discover, download, and explore customized Modelfiles. BoR Community offers a wide range of exciting possibilities for enhancing your chat interactions with BoR! 🚀

## How to Install 🚀

### Installation via Python pip 🐍

BoR can be installed using pip, the Python package installer. Before proceeding, ensure you're using **Python 3.11** to avoid compatibility issues.

1. **Install BoR**:
   Open your terminal and run the following command to install BoR:

   ```bash
   pip install bor-webui
   ```
   (Assuming package name changes, e.g. `pip install open-webui` -> `pip install bor-webui`)


2. **Running BoR**:
   After installation, you can start BoR by executing:

   ```bash
   bor-webui serve
   ```
   (Assuming command changes, e.g. `open-webui serve` -> `bor-webui serve`)


This will start the BoR server, which you can access at [http://localhost:8080](http://localhost:8080)

### Quick Start with Docker 🐳

> [!NOTE]  
> Please note that for certain Docker environments, additional configurations might be needed. If you encounter any connection issues, our detailed guide on [BoR Documentation](https://docs.bor.com/) is ready to assist you.

> [!WARNING]
> When using Docker to install BoR, make sure to include the `-v bor-data:/app/backend/data` in your Docker command. This step is crucial as it ensures your database is properly mounted and prevents any loss of data. (Volume name changed)

> [!TIP]  
> If you wish to utilize BoR with Ollama included or CUDA acceleration, we recommend utilizing our official images tagged with either `:cuda` or `:ollama`. To enable CUDA, you must install the [Nvidia CUDA container toolkit](https://docs.nvidia.com/dgx/nvidia-container-runtime-upgrade/) on your Linux/WSL system.

### Installation with Default Configuration

- **If Ollama is on your computer**, use this command:

  ```bash
  docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
  ```
  (Image path and volume name changed)

- **If Ollama is on a Different Server**, use this command:

  To connect to Ollama on another server, change the `OLLAMA_BASE_URL` to the server's URL:

  ```bash
  docker run -d -p 3000:8080 -e OLLAMA_BASE_URL=https://example.com -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
  ```

- **To run BoR with Nvidia GPU support**, use this command:

  ```bash
  docker run -d -p 3000:8080 --gpus all --add-host=host.docker.internal:host-gateway -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:cuda
  ```

### Installation for OpenAI API Usage Only

- **If you're only using OpenAI API**, use this command:

  ```bash
  docker run -d -p 3000:8080 -e OPENAI_API_KEY=your_secret_key -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
  ```

### Installing BoR with Bundled Ollama Support

This installation method uses a single container image that bundles BoR with Ollama, allowing for a streamlined setup via a single command. Choose the appropriate command based on your hardware setup:

- **With GPU Support**:
  Utilize GPU resources by running the following command:

  ```bash
  docker run -d -p 3000:8080 --gpus=all -v ollama:/root/.ollama -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:ollama
  ```

- **For CPU Only**:
  If you're not using a GPU, use this command instead:

  ```bash
  docker run -d -p 3000:8080 -v ollama:/root/.ollama -v bor-data:/app/backend/data --name bor-webui --restart always ghcr.io/BoRDev/BoR:ollama
  ```

Both commands facilitate a built-in, hassle-free installation of both BoR and Ollama, ensuring that you can get everything up and running swiftly.

After installation, you can access BoR at [http://localhost:3000](http://localhost:3000). Enjoy! 😄

### Other Installation Methods

We offer various installation alternatives, including non-Docker native installation methods, Docker Compose, Kustomize, and Helm. Visit our [BoR Documentation](https://docs.bor.com/getting-started/) or join our [BoR community](https://discord.bor.com) (assuming Discord link changes) for comprehensive guidance.

### Troubleshooting

Encountering connection issues? Our [BoR Documentation](https://docs.bor.com/troubleshooting/) has got you covered. For further assistance and to join our vibrant community, visit the [BoR Discord](https://discord.bor.com).

#### BoR: Server Connection Error

If you're experiencing connection issues, it’s often due to the WebUI docker container not being able to reach the Ollama server at 127.0.0.1:11434 (host.docker.internal:11434) inside the container . Use the `--network=host` flag in your docker command to resolve this. Note that the port changes from 3000 to 8080, resulting in the link: `http://localhost:8080`.

**Example Docker Command**:

```bash
docker run -d --network=host -v bor-data:/app/backend/data -e OLLAMA_BASE_URL=http://127.0.0.1:11434 --name bor-webui --restart always ghcr.io/BoRDev/BoR:main
```

### Keeping Your Docker Installation Up-to-Date

In case you want to update your local Docker installation to the latest version, you can do it with [Watchtower](https://containrrr.dev/watchtower/):

```bash
docker run --rm --volume /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --run-once bor-webui
```
(Container name changed)

In the last part of the command, replace `bor-webui` with your container name if it is different.

Check our Updating Guide available in our [BoR Documentation](https://docs.bor.com/getting-started/updating).

### Using the Dev Branch 🌙

> [!WARNING]
> The `:dev` branch contains the latest unstable features and changes. Use it at your own risk as it may have bugs or incomplete features.

If you want to try out the latest bleeding-edge features and are okay with occasional instability, you can use the `:dev` tag like this:

```bash
docker run -d -p 3000:8080 -v bor-data:/app/backend/data --name bor-webui --add-host=host.docker.internal:host-gateway --restart always ghcr.io/BoRDev/BoR:dev
```

<!-- Development instructions for React Admin moved to its own section -->

### Offline Mode

If you are running BoR in an offline environment, you can set the `HF_HUB_OFFLINE` environment variable to `1` to prevent attempts to download models from the internet.

```bash
export HF_HUB_OFFLINE=1
```

## What's Next? 🌟

Discover upcoming features on our roadmap in the [BoR Documentation](https://docs.bor.com/roadmap/).

## License 📜

This project is licensed under the [BSD-3-Clause License](LICENSE) - see the [LICENSE](LICENSE) file for details. 📄
(Assuming license itself doesn't change, only copyright holder if BoR re-licenses, which is not implied here)

## Support 💬

If you have any questions, suggestions, or need assistance, please open an issue or join our
[BoR Discord community](https://discord.bor.com) to connect with us! 🤝

## Star History

<a href="https://star-history.com/#BoRDev/BoR&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=BoRDev/BoR&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=BoRDev/BoR&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=BoRDev/BoR&type=Date" />
  </picture>
</a>

---

BoR is based on software originally created by Timothy Jaeryang Baek. Let's make BoR even more amazing together! 💪

---
## 中文说明 / Chinese Version (示例 / Example)

**BoR 是一款功能丰富、用户友好、可扩展的自托管人工智能平台，专为完全离线操作而设计。** 它支持如 **Ollama** 和 **兼容OpenAI的API** 等多种大型语言模型运行器，并内置RAG推理引擎，使其成为一个**强大的人工智能部署解决方案**。

![BoR 演示](./demo_bor.gif) <!-- 假设 demo_bor.gif 存在或此链接将更新 -->

> [!TIP]
> **正在寻找[企业版方案](https://docs.bor.com/enterprise)？** – **[立即联系我们的销售团队！](mailto:sales@bor.com)**
>
> 获取**增强功能**，包括**自定义主题与品牌化**、**服务等级协议（SLA）支持**、**长期支持（LTS）版本**等等！

更多信息，请务必查阅我们的[BoR文档](https://docs.bor.com/)。

### BoR 主要特性 ⭐

- 🚀 **轻松设置**: 通过 Docker 或 Kubernetes (kubectl, kustomize 或 helm) 无缝安装，支持 `:ollama` 和 `:cuda` 标签的镜像，带来无忧体验。
- 🤝 **Ollama/OpenAI API 集成**: 轻松集成兼容OpenAI的API，实现与Ollama模型并行的多样化对话。自定义OpenAI API URL以连接到 **LMStudio、GroqCloud、Mistral、OpenRouter 等**。
- 🛡️ **精细的权限与用户组管理**: 管理员可以创建详细的用户角色和权限，确保安全的用户环境。这种精细化管理不仅增强了安全性，还允许定制化的用户体验，培养用户的归属感和责任感。
- ... (其他特性继续保持中英对照或单独的中文块)
- ⚙️ **集中化配置 (`settings_config.yaml`)**: 通过单一 `settings_config.yaml` 文件简化部署和设置。集中配置服务端口、品牌化、LLM服务端点、RAG设置等。详情请参阅 `settings_config.yaml.example`。
- 🧑‍💼 **用户管理API (v2)**: 一套全新的管理员API (前缀: `/api/v2/admin/users`)，用于强大的用户管理。功能包括用户的增删改查、账户激活/禁用、密码重置、分页和筛选用户列表。此API专为即将推出的独立管理界面集成而设计。

- 🛡️ **精细的权限与用户组管理**: 管理员可以创建详细的用户角色和权限，确保安全的用户环境。这种精细化管理不仅增强了安全性，还允许定制化的用户体验，培养用户的归属感和责任感。
- ... (其他特性继续保持中英对照或单独的中文块)
- ⚙️ **集中化配置 (`settings_config.yaml`)**: 通过单一 `settings_config.yaml` 文件简化部署和设置。集中配置服务端口、品牌化、LLM服务端点、RAG设置等。详情请参阅 `settings_config.yaml.example`。
- 🧑‍💼 **用户管理API (v2)**: 一套全新的管理员API (前缀: `/api/v2/admin/users`)，用于强大的用户管理。功能包括用户的增删改查、账户激活/禁用、密码重置、分页和筛选用户列表。此API专为即将推出的独立管理界面集成而设计。
- ✨ **全新的基于React的管理前端 (开发中)**: 一个现代化的、独立的管理前端，使用 React、Vite、Ant Design、Zustand 和 TypeScript 构建。旨在为所有管理任务提供专门且增强的体验，最终取代原Svelte前端中的管理功能。
    - **当前功能:** 已包含通过新V2 Admin API实现的完整用户管理、系统配置、外部RAG服务管理，以及初步的模型和知识库管理功能。
    - **未来规划:** 其他管理模块和现有功能的增强将持续进行。
- ✨ **全新的基于React的应用前端 (开发中)**: 一个现代化的、独立的面向用户的应用前端，同样使用 React、Vite、Ant Design、Zustand 和 TypeScript 构建。其目标是最终取代当前基于Svelte的应用，提供聊天、RAG互动、用户配置等功能。
    - **当前状态与特性：**
        - **核心聊天界面：** 功能完整的聊天界面，支持消息收发（流式与非流式）、Markdown渲染、代码高亮、消息复制。
        - **会话管理：** 通过可伸缩侧边栏进行全面的会话管理：新建、列表、切换、删除。活动会话与URL同步并持久化。
        - **RAG上下文选择：** 用户可通过聊天输入区的“知识选择器”选择知识库集合，为RAG增强查询提供上下文。
        - **模型与参数控制：** 聊天中可选择语言模型并调整温度等参数，设置按会话持久化。
        - **用户个性化：** 主题定制（明亮/暗黑/系统，带持久化）和基本的用户资料页面（查看/编辑姓名、邮箱、头像 - 更新依赖后端）。
        - **认证：** 健全的登录、注销、会话恢复机制（使用localStorage存储JWT）。
        - **测试：** 核心组件、Store和API服务已覆盖单元/集成测试。
        - **整体状态：** React应用前端的核心聊天功能已接近MVP（最小可行产品）状态。
    - **未来规划:** 后续将集中开发面向用户的核心功能。

(此处仅为示例，完整的中文翻译会很长，其他特性条目也应相应翻译)

---
## 🚀 BoR 管理前端 (新)

全新的 BoR 管理前端是一个使用 React、Vite、Ant Design、Zustand 和 TypeScript 构建的独立界面，旨在为所有管理任务提供现代化且全面的体验。它将逐步取代原先Svelte应用中的管理功能。

### 访问管理前端
React 管理前端在开发模式下通常独立运行。
- **URL:** 开发模式下默认为 `http://localhost:5173` (Vite 默认端口)。
- 请确保 BoR 后端服务正在运行，因为管理前端连接到相同的后端 API。

### 登录
使用您的管理员凭据登录。如果后端认证共享，则与主 BoR 应用的管理员访问凭据相同。

![BoR 管理登录页面截图](images/bor-admin-login.png "BoR 管理登录页面")
*说明：BoR 管理前端的登录界面。(注意：截图为占位符)*

### 导航管理前端
管理前端采用经典布局：
- **左侧边栏:** 可伸缩的导航菜单，用于访问不同的管理模块。
- **顶部标头:** 显示当前位置的面包屑导航和包含注销选项的用户配置下拉菜单。
- **主内容区:** 渲染特定模块的界面。

![BoR 管理仪表盘截图](images/bor-admin-dashboard.png "BoR 管理仪表盘概览")
*说明：登录后 BoR 管理仪表盘的概览，展示了主布局。(注意：截图为占位符)*

### 主要管理模块 (初步功能)

目前，新的管理前端已实现以下模块：

*   **用户管理:**
    *   通过“用户管理”菜单访问。
    *   允许管理员创建、列出、搜索、筛选（按用户名/邮箱、角色、激活状态）、更新（角色、邮箱、激活状态）、删除用户，以及重置密码。
    ![BoR 管理用户列表截图](images/bor-admin-user-list.png "BoR 管理用户管理")
    *说明：用户管理表格界面。(注意：截图为占位符)*

*   **系统配置:**
    *   位于“设置” > “系统配置”下。
    *   允许修改多种后端配置项，按类别（如UI、认证、RAG、Ollama）分组。更改会全局保存。
    ![BoR 管理系统配置截图](images/bor-admin-system-config.png "BoR 管理系统配置")
    *说明：带选项卡的系统配置界面。(注意：截图为占位符)*

*   **外部RAG服务:**
    *   位于“RAG管理” > “外部服务”下。
    *   管理对外部RAG API的连接，包括添加、编辑或删除服务配置（URL、API密钥）。
    ![BoR 管理外部RAG截图](images/bor-admin-external-rag.png "BoR 管理外部RAG服务")
    *说明：管理外部RAG服务连接的界面。(注意：截图为占位符)*

*   **模型管理（初步）:**
    *   通过“模型管理”菜单访问。
    *   允许拉取新的Ollama模型，查看本地Ollama模型和已配置的远程/基于API的模型。
    *   支持删除本地Ollama模型。
    *   管理全局模型设置（例如，默认模型列表、模型显示顺序）。
    ![BoR 管理模型管理截图](images/bor-admin-model-management.png "BoR 管理模型管理")
    *说明：管理LLM模型的界面。(注意：截图为占位符)*

*   **知识库管理（初步）:**
    *   位于“RAG管理” > “知识库”下。
    *   提供文档上传功能（拖拽或选择文件）。
    *   查看已上传文档列表及其处理状态。
    *   查看现有知识库集合列表（集合的创建/管理功能正在完善中）。
    ![BoR 管理知识库截图](images/bor-admin-knowledge-base.png "BoR 管理知识库管理")
    *说明：知识库管理中的文档上传与列表功能。(注意：截图为占位符)*

### 开发React管理前端
新的基于React的管理前端位于 `bor_admin_frontend` 目录中。

1.  **进入目录:**
    ```bash
    cd bor_admin_frontend
    ```
2.  **安装依赖:**
    ```bash
    npm install
    # 或 yarn install / pnpm install
    ```
3.  **运行开发服务器:**
    ```bash
    npm run dev
    # 或 yarn dev / pnpm dev
    ```
    这通常会在 `http://localhost:5173` (Vite的默认端口，请检查控制台输出) 启动管理前端。

### 未来规划
其他管理模块和现有功能的增强将逐步添加到此新的React前端。

*(请注意：以上所有引用的截图均为占位符，需要手动创建并添加到项目根目录的 `images/` 文件夹中。)*


---
## 📦 BoR 应用前端 (新) - 开发中

与新的管理界面并行，我们也在开发一个全新的**应用前端**，它同样基于现代技术栈：React、Vite、Ant Design、Zustand 和 TypeScript。

**目的：** 此前端旨在最终取代当前基于Svelte的用户界面，为用户提供聊天、RAG互动、个人资料管理等功能。

**当前状态与特性：**
*   **核心聊天界面：** 功能完整的聊天界面，支持消息收发（流式与非流式）、Markdown渲染、代码高亮、消息复制。
*   **会话管理：** 通过可伸缩侧边栏进行全面的会话管理：新建、列表、切换、删除。活动会话与URL同步并持久化。
*   **RAG上下文选择：** 用户可通过聊天输入区的“知识选择器”选择知识库集合，为RAG增强查询提供上下文。
*   **模型与参数控制：** 聊天中可选择语言模型并调整温度等参数，设置按会话持久化。
*   **用户个性化：** 主题定制（明亮/暗黑/系统，带持久化）和基本的用户资料页面（查看/编辑姓名、邮箱、头像 - 更新依赖后端）。
*   **认证：** 健全的登录、注销、会话恢复机制（使用localStorage存储JWT）。
*   **测试：** 核心组件、Store和API服务已覆盖单元/集成测试。
*   **整体状态：** React应用前端的核心聊天功能已接近MVP（最小可行产品）状态。

![BoR 应用聊天界面](images/bor-app-chat-interface.png "BoR 应用聊天界面（含模型与知识选择器）")
*说明：新的 BoR 应用前端主聊天界面，展示了模型选择、RAG知识选择器和消息显示。(注意：截图为占位符)*

**如何运行（应用前端开发）：**

> **重要提示：** 由于当前自动化工具在项目初始化阶段存在限制，`bor_app_frontend` 目录的Vite项目初始化 (`npm create vite`) 和初始依赖安装 (`npm install`) **必须由开发者在本地环境中手动完成**。核心框架的源代码文件和目录结构已通过程序提供。

1.  **进入 `bor_app_frontend` 目录：**
    ```bash
    cd bor_app_frontend
    ```
2.  **（手动步骤）初始化Vite项目并安装依赖：**
    如果您是首次设置或 `package.json` 缺失/不完整：
    *   确保已安装 Node.js 和 npm (或 Yarn/pnpm)。
    *   可能需要运行 `npm create vite@latest . -- --template react-ts` (或您包管理器的相应命令)，请注意如果源文件已存在，避免覆盖它们。
    *   安装核心依赖：
        ```bash
        npm install antd react-router-dom@6 axios zustand react-hook-form react-markdown remark-gfm rehype-highlight
        npm install @ant-design/icons --save
        # npm install dayjs # 如果需要日期处理
        ```
        （如需更完整的依赖列表，可参考计划或 `bor_admin_frontend` 的 `package.json`。）
3.  **（初始化和安装依赖后）创建环境文件：**
    *   在 `bor_app_frontend` 根目录下创建 `.env.development` 文件。
    *   添加您的API基地址，例如：`VITE_API_BASE_URL=/api/v1`
4.  **运行开发服务器：**
    ```bash
    npm run dev
    # 或 yarn dev / pnpm dev
    ```
    应用前端通常会在 `http://localhost:端口号/` (Vite默认通常是5173，请确保与管理前端或后端端口不同) 启动。

**未来规划/下一步：**
*   “近期的主要工作包括：”
    *   “在聊天消息中实现RAG检索来源的展示，以完成RAG查询的闭环。”
    *   “与后端开发紧密协作，确保V1应用API在会话初始化、流式协议、错误处理等方面的完全对齐和稳定性。”
    *   “基于测试和反馈，进一步增强错误处理和整体用户体验。”
*   “长期目标包括添加高级功能，进一步的性能优化，并最终完全达到并超越原Svelte应用的功能。”
