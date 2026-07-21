#!/bin/sh
# WebSSH 部署向导
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         WebSSH 部署向导              ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 检测宿主机是否同时具有全局 IPv6 地址和默认 IPv6 路由。
# 优先使用 iproute2；精简 Linux 系统则读取 /proc 作为回退。
has_usable_ipv6() {
    if command -v ip >/dev/null 2>&1; then
        if ip -6 addr show scope global 2>/dev/null | grep -q 'inet6 ' && \
           ip -6 route show default 2>/dev/null | grep -q '^default'; then
            return 0
        fi
        return 1
    fi

    if [ -r /proc/net/if_inet6 ] && [ -r /proc/net/ipv6_route ]; then
        if awk '$4 == "00" && $6 != "lo" { found = 1 } END { exit !found }' /proc/net/if_inet6 2>/dev/null && \
           awk '$1 == "00000000000000000000000000000000" && $2 == "00000000" && $10 != "lo" { found = 1 } END { exit !found }' /proc/net/ipv6_route 2>/dev/null; then
            return 0
        fi
    fi

    return 1
}

# ── 1. 端口 ──────────────────────────────────────────────────────────────────
printf "服务端口 [默认 8008，直接回车跳过]: "
read PORT_INPUT
if [ -z "$PORT_INPUT" ]; then
    PORT_INPUT=8008
fi

# ── 2. 页脚 ──────────────────────────────────────────────────────────────────
echo ""
printf "是否显示底部版权页脚？([回车]=显示  n=不显示): "
read FOOTER_INPUT
if [ "$FOOTER_INPUT" = "n" ] || [ "$FOOTER_INPUT" = "N" ]; then
    SHOW_FOOTER=false
else
    SHOW_FOOTER=true
fi

# ── 3. Web 登录验证 ───────────────────────────────────────────────────────────
echo ""
echo "  [Web 登录验证说明] 启用后浏览器打开页面时会先弹出账号密码对话框，"
echo "  输入正确才能看到 SSH 登录界面。适合将 WebSSH 暴露在公网时使用。"
echo "  与 SSH 本身的账号密码无关，是两层独立的验证。"
printf "是否启用 Web 登录验证？(y=启用  [回车]=不启用): "
read AUTH_INPUT
AUTH_INFO=""
if [ "$AUTH_INPUT" = "y" ] || [ "$AUTH_INPUT" = "Y" ]; then
    printf "  用户名: "
    read AUTH_USER
    printf "  密码: "
    read AUTH_PASS
    if [ -n "$AUTH_USER" ] && [ -n "$AUTH_PASS" ]; then
        AUTH_INFO="${AUTH_USER}:${AUTH_PASS}"
    fi
fi

# ── 4. 管理员账号 ─────────────────────────────────────────────────────────────
echo ""
echo "  [管理员账号说明] 管理员可以在页面设置里检测版本和更新版本。"
echo "  默认用户名是 admin；密码留空时会自动随机生成，并只在首次启动的 Docker 日志里显示。"
while :; do
    printf "管理员用户名 [默认 admin]: "
    read ADMIN_USER
    if [ -z "$ADMIN_USER" ]; then
        ADMIN_USER=admin
    fi
    if printf "%s" "$ADMIN_USER" | grep -Eq '^[A-Za-z0-9]{5,32}$'; then
        break
    fi
    echo "  用户名只能使用 5-32 位字母或数字。"
done

while :; do
    printf "管理员密码 [回车=自动随机生成；手动填写需大于 6 位]: "
    if [ -t 0 ] && command -v stty >/dev/null 2>&1; then
        stty -echo
        read ADMIN_PASS
        stty echo
        echo ""
    else
        read ADMIN_PASS
    fi
    if [ -z "$ADMIN_PASS" ] || [ ${#ADMIN_PASS} -ge 7 ]; then
        break
    fi
    echo "  管理员密码必须大于 6 位；也可以直接回车自动随机生成。"
done

# ── 5. 页面内更新 ─────────────────────────────────────────────────────────────
echo ""
echo "  [页面内更新说明] 启用后管理员可以在设置里执行 git pull + docker compose up -d --build。"
echo "  该功能需要 Docker Compose 部署，并会挂载当前源码目录和 Docker socket。"
printf "是否启用页面内版本更新？([回车]=启用  n=禁用): "
read UPDATE_INPUT
if [ "$UPDATE_INPUT" = "n" ] || [ "$UPDATE_INPUT" = "N" ]; then
    ENABLE_SELF_UPDATE=false
else
    ENABLE_SELF_UPDATE=true
fi

HOST_PROJECT_DIR=$(pwd -P 2>/dev/null || pwd)

# ── 写入 .env ─────────────────────────────────────────────────────────────────
cat > .env <<EOF
PORT=${PORT_INPUT}
SHOW_FOOTER=${SHOW_FOOTER}
WEBSSH_ADMIN_USER=${ADMIN_USER}
WEBSSH_ADMIN_PASSWORD=${ADMIN_PASS}
WEBSSH_ENABLE_SELF_UPDATE=${ENABLE_SELF_UPDATE}
WEBSSH_HOST_PROJECT_DIR=${HOST_PROJECT_DIR}
EOF

if [ -n "$AUTH_INFO" ]; then
    echo "AUTH_INFO=${AUTH_INFO}" >> .env
fi

echo ""
echo "✅ 配置已写入 .env"
if [ -z "$ADMIN_PASS" ]; then
    echo "🔐 管理员密码将自动生成；启动后运行下面命令查看："
    echo "   docker compose logs webssh | grep -A6 \"WebSSH 管理员账号\""
else
    echo "🔐 管理员账号: ${ADMIN_USER}"
fi
echo ""

# ── IPv6 网络检测 ─────────────────────────────────────────────────────────────
# 有可用 IPv6 时保持安静；只有未检测到 IPv6 时才提示并等待确认。
if ! has_usable_ipv6; then
    echo "⚠️  本机没有检测到可用的 IPv6 网络。"
    echo "   IPv6 服务器将不能通过本机直接连接 SSH。"
    echo "   如果需要支持 IPv6，请更换支持 IPv6 的服务器。"
    printf "按回车继续..."
    read IPV6_CONTINUE
    echo ""
fi

# ── 启动 ──────────────────────────────────────────────────────────────────────
echo "🚀 正在启动 WebSSH..."
docker compose up -d --build

echo ""
echo "🌐 启动成功！浏览器打开: http://你的服务器IP:${PORT_INPUT}"
if [ -z "$ADMIN_PASS" ]; then
    echo "🔐 随机管理员密码查看命令: docker compose logs webssh | grep -A6 \"WebSSH 管理员账号\""
fi
echo ""
