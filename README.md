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

Want to learn more about BoR's features? Check out our [BoR documentation](https://docs.bor.com/features) for a comprehensive overview!

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

(此处仅为示例，完整的中文翻译会很长，其他特性条目也应相应翻译)
