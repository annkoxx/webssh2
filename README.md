# WebSSH

一个基于 Go + WebSocket 的 Web SSH 终端，支持密码和密钥认证，带有炫酷的毛玻璃 UI。

## 示例
效果图在最底下
#### render.com 托管


webssh-te0j.onrender.com

#### railway.com 托管

webssh.up.railway.app

## 一键部署
免费
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/a06342637/webssh2)

付费
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/github?repo=https://github.com/a06342637/webssh2)

## 功能特性

- 基于 xterm.js 的完整终端模拟
- 多标签 SSH（同时连接多台服务器，标签切换）
- 支持密码和 SSH 密钥两种认证方式
- SOCKS5 代理连接支持
- SFTP 文件管理（浏览/上传/下载）
- 系统信息监控（CPU/内存/磁盘/流量/负载）
- 终端字体大小调节 + 颜色自定义
- 连接书签 + 脚本书签（localStorage 存储）
- 毛玻璃 (Glassmorphism) UI + 粒子动画背景
- 支持 Docker Compose 一键部署
- 移动端 / iPad 响应式适配
- 支持以下 URL 格式自动登录（密码 & 私钥均支持）：

| URL 格式 | 解析结果 |
|----------|----------|
| `你的域名/192.168.1.1:22/mypass` | root@192.168.1.1:22，密码 mypass |
| `你的域名/192.168.1.1:2222/admin/mypass` | admin@192.168.1.1:2222，密码 mypass |
| `你的域名/192.168.1.1/22/mypass` | root@192.168.1.1:22，密码 mypass |
| `你的域名/192.168.1.1/22/admin/mypass` | admin@192.168.1.1:22，密码 mypass |
| `你的域名/192.168.1.1/admin/mypass` | admin@192.168.1.1:22（默认端口） |
| `你的域名/192.168.1.1/22/root/-----BEGIN RSA...` | root@192.168.1.1:22，**私钥登录** |

> 自动识别：最后一段若包含 `-----BEGIN` 或长度超过 200 字符，自动切换为私钥认证；否则视为密码。

- 底部版权页脚可在「设置」面板中随时隐藏/显示（适合不想对外展示的部署场景）
## 快速开始

### 1. 一键命令部署（推荐）

```bash
git clone https://github.com/a06342637/webssh2.git && cd webssh2 && sh setup.sh
```

运行后会有一个简短的交互向导，按提示回答即可：

```
服务端口 [默认 8008，直接回车跳过]:          ← 直接回车使用 8008
是否显示底部版权页脚？([回车]=显示  n=不显示): ← 回车=显示，输入 n=隐藏
是否启用 Web 登录验证？(y=启用  [回车]=不启用): ← 可选
管理员用户名 [默认 admin]:                    ← 回车使用 admin
管理员密码 [回车=自动随机生成；手动填写需大于 6 位]: ← 推荐生产环境手动设置
是否启用页面内版本更新？([回车]=启用  n=禁用): ← Docker Compose 可用
```

回答完成后自动 `docker compose up -d --build` 启动。启动成功后浏览器打开 `http://你的服务器IP:8008` 即可。

> 如果不需要交互向导，也可以直接运行：
> ```bash
> git clone https://github.com/a06342637/webssh2.git && cd webssh2 && docker compose up -d
> ```

### 2. Docker Compose 部署

```bash
# 克隆项目
git clone https://github.com/a06342637/webssh2.git
cd webssh2

# 启动（默认端口 8008）
docker compose up -d

# 自定义端口
PORT=3000 docker compose up -d

# 查看状态 / 日志
docker compose ps
docker compose logs -f

# 停止
docker compose down

# 更新
git pull && docker compose up -d --build
```

#### 管理员账号与云端脚本书签

WebSSH 会在首次启动时创建一个管理员账号，用于进入设置面板里的「版本更新」等管理员功能。
登录后的账号可以在「账号同步」弹窗中修改自己的密码；修改时需要输入当前密码。

- Docker Compose 默认用户名是 `admin`。
- 如果没有设置 `WEBSSH_ADMIN_PASSWORD`，系统会自动生成随机密码，并只在首次启动时打印到 Docker 日志。

查看默认管理员密码：

```bash
docker compose logs webssh | grep -A6 "WebSSH 管理员账号"
```

建议生产环境显式设置管理员账号和密码：

```bash
WEBSSH_ADMIN_USER=admin WEBSSH_ADMIN_PASSWORD='yourStrongPassword' docker compose up -d --build
```

管理员用户名必须大于 4 位且只能使用字母或数字；管理员密码必须大于 6 位。

也可以写入 `.env`：

```env
WEBSSH_ADMIN_USER=admin
WEBSSH_ADMIN_PASSWORD=yourStrongPassword
```

#### 忘记管理员密码：Docker 重置方法

Docker Compose 部署可以通过环境变量重置管理员密码：

```bash
WEBSSH_ADMIN_USER=admin \
WEBSSH_ADMIN_PASSWORD='newStrongPassword' \
WEBSSH_ADMIN_RESET=true \
docker compose up -d --build
```

重置成功后建议移除 `WEBSSH_ADMIN_RESET=true`，避免每次重启都重复重置。

#### 页面内更新版本（管理员）

设置面板底部有「版本更新」功能，只有管理员账号可以使用。Docker Compose 部署默认会挂载源码目录和 Docker socket。点击更新时，WebSSH 会启动一个临时 updater 容器来执行：

```bash
git fetch origin
git pull --ff-only origin 当前分支
docker compose up -d --build
```

这样 WebSSH 主容器被重启时，更新进程不会一起中断。页面会提示更新任务已启动，并在稍后自动刷新。

如果不想允许页面内更新，可以在 `.env` 中关闭：

```env
WEBSSH_ENABLE_SELF_UPDATE=false
```

页面内更新需要容器知道宿主机上的项目目录。使用 `setup.sh` 部署时会自动写入：

```env
WEBSSH_HOST_PROJECT_DIR=/你的宿主机/webssh2
```

如果你手动写 `.env`，建议也设置这个变量，并且必须是宿主机绝对路径；否则容器内执行 `docker compose up` 时可能因为宿主机路径不一致导致更新失败。

Render / Railway 这类托管平台通常不能在容器内控制 Docker，因此页面内更新会提示不可用；请使用平台的重新部署功能。

#### 启用 Web 页面登录验证

> **什么是 Web 登录验证？**
> 这是一道浏览器级别的门禁。启用后，访问 WebSSH 页面时浏览器会先弹出一个账号密码对话框，输入正确才能看到 SSH 登录界面。
> 适用于把 WebSSH 暴露在公网时，防止陌生人直接访问你的 SSH 工具页面。
> **注意**：这和 SSH 本身的账号密码是两回事，是两层独立的验证。

通过 `setup.sh` 部署时向导会直接询问是否启用。也可以手动编辑 `docker-compose.yml`，取消 `authInfo` 那行的注释并设置账号密码：

```yaml
environment:
  - authInfo=admin:your_password
```
### 更新
```yaml
cd webssh2
git pull
docker compose up -d --build
```

### 3. 从源码运行

```bash
# 需要 Go 1.22+
go mod tidy
go run .

# 自定义端口
go run . -p 3000

# 启用登录验证
go run . -a admin:password
```

### 4. Railway 部署

点击上方 **Deploy on Railway** 按钮，或手动：

1. Fork 本仓库
2. 在 [Railway](https://railway.app) 新建项目，选择 GitHub 仓库
3. 设置环境变量：
   - `PORT=8008`
   - `WEBSSH_ADMIN_USER=admin`
   - `WEBSSH_ADMIN_PASSWORD=你的管理员密码`
4. 部署完成后获取公网 URL

> Railway 一键部署如果忘记管理员密码，建议在 Railway 控制台重新设置 `WEBSSH_ADMIN_PASSWORD` 后重新部署；如果没有持久化数据卷，也可以重新部署生成新环境。

### 5. Render 部署

点击上方 **Deploy to Render** 按钮，或手动：

1. Fork 本仓库
2. 在 [Render](https://render.com) 新建 Web Service，选择 Docker
3. 自动读取 `render.yaml` 配置
4. 在环境变量中设置：
   - `WEBSSH_ADMIN_USER=admin`
   - `WEBSSH_ADMIN_PASSWORD=你的管理员密码`
5. 部署完成后获取公网 URL

> Render 一键部署如果忘记管理员密码，请在 Render 控制台重新设置 `WEBSSH_ADMIN_PASSWORD` 并重新部署；如果旧数据仍保留且需要强制重置，可同时设置 `WEBSSH_ADMIN_RESET=true` 后重新部署一次，成功后再移除该变量。

## 使用说明

### 连接 SSH 服务器

1. 打开浏览器访问 WebSSH 页面
2. 填写主机地址、端口、用户名
3. 选择密码或密钥认证
4. 可选：勾选「检测系统信息」、「使用 SOCKS5 代理」
5. 点击 **连接终端**

### 终端功能

| 功能 | 说明 |
|------|------|
| 多标签 | 顶栏标签切换，`+` 新建连接 |
| 字体调节 | 顶栏 🔍-/🔍+ 调整大小 |
| 颜色自定义 | 顶栏调色盘按钮，选择文字/背景/光标色 |
| 脚本书签 | 保存常用命令，点击自动执行 |
| SFTP | 顶栏文件夹按钮，浏览/上传/下载文件 |
| 系统监控 | CPU/内存/磁盘/负载/流量 每分钟刷新 |
| 快捷键 | `Esc` 断开连接返回登录页 |

### Cloudflare Worker 反代

如果需要通过 CF Worker 反代 WebSSH，使用以下代码：

```javascript
export default {
  async fetch(request) {
    const TARGET_IP = "你的服务器IP";
    const TARGET_PORT = "8008";
    const url = new URL(request.url);
    url.hostname = TARGET_IP;
    url.port = TARGET_PORT;
    url.protocol = "http:";
    if (request.headers.get("Upgrade") === "websocket") {
      return fetch(url.toString(), request);
    }
    return fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });
  },
};
```

## 配置参数

| 参数 | 环境变量 | 默认值 | 说明 |
|------|----------|--------|------|
| `-p` | `port` | 8008 | 服务端口 |
| `-a` | `authInfo` | 空 | Web 登录验证，格式 `user:pass` |
| `-t` | — | 120 | SSH 连接超时时间（分钟） |
| `-s` | `savePass` | true | 是否保存密码 |
| — | `WEBSSH_ADMIN_USER` | admin | 页面管理员用户名 |
| — | `WEBSSH_ADMIN_PASSWORD` | 自动随机生成 | 页面管理员密码，必须大于 6 位；Render/Railway 建议首次部署前显式设置 |
| — | `WEBSSH_ADMIN_RESET` | false | 设置为 true 并提供 `WEBSSH_ADMIN_PASSWORD` 可重置管理员密码 |
| — | `WEBSSH_ENABLE_SELF_UPDATE` | Docker Compose 为 true | 是否允许管理员在页面里执行版本更新 |
| — | `WEBSSH_SOURCE_DIR` | `/app/source` | 页面更新功能使用的源码目录 |
| — | `WEBSSH_HOST_PROJECT_DIR` | 当前项目目录 | Docker Compose 页面更新时使用的宿主机源码目录 |

## 技术栈

- **后端**: Go + Gin + gorilla/websocket + golang.org/x/crypto/ssh + golang.org/x/net/proxy
- **前端**: 原生 HTML/CSS/JS + xterm.js
- **部署**: Docker + Docker Compose / Railway / Render
- ## 效果图
<img width="1280" height="675" alt="image" src="https://github.com/user-attachments/assets/f3ef06c5-9479-4123-9c93-9b4ac69f007f" />
<img width="1280" height="415" alt="image" src="https://github.com/user-attachments/assets/2bcf4d98-3a95-4d43-867b-f4af5fd94948" />
<img width="1280" height="512" alt="image" src="https://github.com/user-attachments/assets/5040cc7d-bd31-44c9-9b94-4382fb59764e" />

<img width="369" height="634" alt="image" src="https://github.com/user-attachments/assets/b6978860-c82e-413a-ab3e-3e29c4776a9a" />
<img width="521" height="737" alt="image" src="https://github.com/user-attachments/assets/e8dfbd1c-87ae-495d-a8bb-cabf714f0878" />
<img width="1042" height="249" alt="image" src="https://github.com/user-attachments/assets/b6d99e78-563e-4572-b094-1ebf36dd440a" />
<img width="525" height="466" alt="image" src="https://github.com/user-attachments/assets/c2a573d2-1af3-42dd-b6c2-76b3eabbe0ea" />

<img width="375" height="70" alt="image" src="https://github.com/user-attachments/assets/00048723-2590-4e56-868f-3921228d1127" />
<img width="669" height="329" alt="image" src="https://github.com/user-attachments/assets/fe2478f0-1118-4c72-b29e-1d183029936b" />
<img width="1733" height="868" alt="image" src="https://github.com/user-attachments/assets/d6a275cc-5800-4830-8c19-870ca1e9a559" />
<img width="208" height="336" alt="image" src="https://github.com/user-attachments/assets/b560fabd-c6d7-4566-8a88-9c95c6607025" />

