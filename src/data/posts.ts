export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  tags: string[];
  category: 'blog' | 'ai-news';
}

import { aiNewsPosts } from './generated_news';

export const initialPosts: Post[] = [
  ...aiNewsPosts,
  {
    id: 'setup-kubernetes-cluster',
    title: '从零开始：使用 Kubeadm 搭建高可用 Kubernetes 集群',
    summary: '本文详细记录了在 CentOS 7 环境下，使用 Kubeadm 手动搭建一个包含 3 个 Master 节点和 3 个 Worker 节点的高可用 Kubernetes (v1.28) 集群的全过程。',
    date: '2026-05-30',
    tags: ['Kubernetes', 'Kubeadm', '容器化', '高可用'],
    category: 'blog',
    content: `
# 从零开始：使用 Kubeadm 搭建高可用 Kubernetes 集群

在大规模容器化应用的今天，Kubernetes（简称 K8s）已经成为容器编排的事实标准。本文将手把手带你使用 \`kubeadm\` 部署一个具备高可用能力（HA）的生产级 Kubernetes 集群。

## 1. 架构规划

为了实现高可用，我们采用外部负载均衡器（HAProxy + Keepalived）来代理 Master 节点的 API Server。

- **VIP (虚拟IP)**: 192.168.10.100 (Port: 6443)
- **Master 1**: 192.168.10.11
- **Master 2**: 192.168.10.12
- **Master 3**: 192.168.10.13
- **Worker 1**: 192.168.10.21
- **Worker 2**: 192.168.10.22

## 2. 基础环境准备 (所有节点)

在开始安装之前，必须在所有节点上进行系统优化和配置准备。

### 2.1 关闭防火墙与 SELinux

\`\`\`bash
# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 关闭 SELinux
setenforce 0
sed -i 's/^SELINUX=enforcing$/SELINUX=disabled/' /etc/selinux/config
\`\`\`

### 2.2 关闭 Swap 分区

Kubernetes 强制要求关闭 Swap。

\`\`\`bash
swapoff -a
sed -ri 's/.*swap.*/#&/' /etc/fstab
\`\`\`

### 2.3 加载内核模块与网络配置

\`\`\`bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置所需的 sysctl 参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

# 应用 sysctl 参数
sudo sysctl --system
\`\`\`

## 3. 安装容器运行时 (Containerd)

我们选择稳定高效的 \`containerd\` 作为容器运行时。

\`\`\`bash
# 安装 containerd
yum install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install -y containerd.io

# 初始化默认配置
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 修改配置以使用 SystemdCgroup
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml

# 启动并自启
systemctl daemon-reload
systemctl enable --now containerd
\`\`\`

## 4. 安装 Kubeadm, Kubelet 和 Kubectl

\`\`\`bash
# 添加 Kubernetes 阿里云 YUM 源
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=0
EOF

# 安装特定版本
yum install -y kubelet-1.28.2 kubeadm-1.28.2 kubectl-1.28.2 --disableexcludes=kubernetes

# 启动 kubelet
systemctl enable --now kubelet
\`\`\`

## 5. 部署 Load Balancer (以 HAProxy & Keepalived 为例)

在两台独立的虚拟机或直接在 Master 节点上配置负载均衡，确保 API Server 高可用。

*(详情略，请确保 VIP 192.168.10.100:6443 可用)*

## 6. 初始化 Master 节点 (在 Master 1 执行)

编写 \`kubeadm-config.yaml\` 文件：

\`\`\`yaml
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
kubernetesVersion: v1.28.2
controlPlaneEndpoint: "192.168.10.100:6443" # 负载均衡虚拟IP
imageRepository: registry.aliyuncs.com/google_containers
networking:
  podSubnet: "10.244.0.0/16"
\`\`\`

执行初始化：

\`\`\`bash
kubeadm init --config=kubeadm-config.yaml --upload-certs
\`\`\`

初始化成功后，会输出加入控制平面（Control Plane）和工作节点（Worker）的命令。

### 示例控制平面加入命令：
\`\`\`bash
kubeadm join 192.168.10.100:6443 --token xxxxx \\
    --discovery-token-ca-cert-hash sha256:xxxxx \\
    --control-plane --certificate-key xxxxx
\`\`\`

## 7. 安装网络插件 (Calico)

\`\`\`bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/custom-resources.yaml
\`\`\`

## 8. 总结

至此，一个高可用的 Kubernetes 集群已经搭建完毕。通过负载均衡 VIP，即便单个控制节点宕机，集群控制面依旧可以正常响应。后续我们可以部署 Ingress Controller 和 StorageClass 开启集群的生产化应用。
    `
  },
  {
    id: 'nginx-cache-optimization',
    title: '深入 Nginx 缓存优化：大幅提升静态资源 CDN 缓存命中率',
    summary: '针对大流量企业官网及图片管理后台，如何通过合理配置 Nginx 缓存头、URL 重写与防盗链，将静态资源的 CDN 缓存命中率从 45% 提升到 95% 以上？',
    date: '2026-05-28',
    tags: ['Nginx', 'CDN', '缓存优化', '性能调优'],
    category: 'blog',
    content: `
# 深入 Nginx 缓存优化：大幅提升静态资源 CDN 缓存命中率

在运维大流量网站时，CDN 缓存命中率直接决定了源站服务器的负载以及用户的页面加载耗时。如果配置不合理，许多可以缓存在客户端或 CDN 边缘节点的静态资源（图片、JS、CSS）会反复穿透回源，浪费大量带宽和计算资源。

本文将以一个实际的图片管理后台为例，深度剖析如何通过 Nginx 配置优化，将缓存命中率从 **45% 飙升至 95% 以上**。

## 1. 为什么你的缓存命中率低下？

常见的“缓存杀手”有以下几点：
1. **HTTP Headers 缺失**：没有正确发送 \`Cache-Control\` 或 \`Expires\` 头部。
2. **URL 参数污染**：同一个图片，加上不同的 query 参数（如 \`?t=123\`）导致 CDN 认为这是不同的资源，进而重复回源。
3. **Vary 头部使用不当**：如发送了 \`Vary: *\`，会让所有 CDN 和浏览器缓存失效。
4. **Cookie 干扰**：响应头中携带了 \`Set-Cookie\`，多数 CDN 默认不缓存带 Cookie 的响应。

## 2. Nginx 核心优化配置

### 2.1 针对静态资源的缓存控制

我们要为静态资源（如 jpg, png, css, js 等）强制加上超长的强缓存时间，同时去除无用的响应头。

\`\`\`nginx
server {
    listen 80;
    server_name blog.fugenmv.com;
    root /var/www/blog;

    # 匹配常见静态资源
    location ~* \\.(jpg|jpeg|gif|png|ico|css|js|woff2|webp)$ {
        # 设置强缓存时间为 365天
        expires 365d;
        
        # 开启 public 缓存，确保 CDN 和代理都可以缓存
        add_header Cache-Control "public, no-transform";
        
        # 移除可能干扰缓存的 header
        proxy_hide_header Set-Cookie;
        fastcgi_hide_header Set-Cookie;
        
        # 允许跨域（可选）
        add_header Access-Control-Allow-Origin "*";
        
        # 关闭访问日志以减小 I/O 压力
        access_log off;
        log_not_found off;
    }
}
\`\`\`

### 2.2 防抖动与防盗链 (Valid Referers)

防止其他站点恶意盗刷你的图片流量，降低回源开销。

\`\`\`nginx
location ~* \\.(gif|jpg|png|webp)$ {
    # 仅允许本站域名和几家友链访问
    valid_referers none blocked server_names *.fugenmv.com *.whclst.cn;
    if ($invalid_referer) {
        return 403;
    }
    expires 30d;
    add_header Cache-Control "public";
}
\`\`\`

## 3. CDN 侧的配合优化

仅在 Nginx 配置是不够的，还需要在腾讯云 EdgeOne / CDN 控制台进行如下设置：

### 3.1 忽略参数缓存 (Ignore Query String)

在 CDN 缓存配置中，开启“忽略 URL 参数缓存”。这样，无论用户请求的是 \`logo.png\`、\`logo.png?v=1.0\` 还是 \`logo.png?width=200\`，CDN 都会命中同一个缓存缓存块。

### 3.2 智能分片 (Range GETs)

对于较大的压缩包、PDF、视频等文件，在 CDN 侧开启 **Range回源**（分片回源），避免因为用户下载到一半中断导致 CDN 丢弃缓存重来。

## 4. 优化效果评估

经过这一系列调优，我们通过 \`iftop\` 等工具监控网卡流量，发现回源流量骤降 80%。CDN 控制台的缓存命中率曲线非常完美地稳定在 **96.4%**。

如果你也在饱受回源成本高昂、网站打开慢的困扰，不妨立即检查并实施这些 Nginx 缓存优化策略！
`
  },
  {
    id: 'playwright-ssl-automation',
    title: '基于 Playwright 自动化获取与配置 SSL 证书',
    summary: '针对多域名、无 API 的云服务商，如何使用 Python + Playwright 自动签发并更新免费的 SSL 证书？分享一套实用的 DevOps 自动化脚本思路。',
    date: '2026-05-25',
    tags: ['DevOps', 'Playwright', 'SSL证书', 'Python'],
    category: 'blog',
    content: `
# 基于 Playwright 自动化获取与配置 SSL 证书

在企业 IT 运维中，SSL 证书的生命周期管理是一项繁琐且关键的工作。虽然有 Let's Encrypt 这样支持 Let's Encrypt / ACME 协议的免费证书服务，但对于某些受限于国内特定云服务商（或是没有开放 API 的老旧 CMDB 系统），自动化变得异常困难。

本文将分享如何利用 **Playwright (Python)** 模拟人工浏览器操作，实现无 API 云服务商处免费 SSL 证书的自动化申请与配置分发。

## 1. 核心流程设计

整体自动化工具 \`ssl_auto_issue.py\` 分为四大步骤：

1. **到期检测**：检查目标域名（如 \`fugenmv.com\`, \`whclst.cn\` 等）的当前证书到期时间，若有效期小于或等于 5 天则触发自动更新流程。
2. **模拟登录与申请**：通过 Playwright 启动无头浏览器，登录至证书提供商后台，填写申请表单并提交。
3. **DNS 验证自动化**：在申请过程中，获取提供商给出的 DNS TXT 记录，随后通过 DNS API（如腾讯云云解析 DNS API）自动写入 TXT 记录，并等待生效。
4. **下载与分发部署**：审核通过后自动下载证书 ZIP，解压后通过 Ansible 或 SCP 分发部署到 Nginx 目标服务器并执行 reload。

## 2. Playwright 关键实现代码片段

以下是使用 Python 3.13.12 编写的登录并提交申请的核心逻辑：

\`\`\`python
import asyncio
from playwright.async_api import async_playwright

async def apply_ssl_certificate(domain):
    async with async_playwright() as p:
        # 启动 Chromium
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # 1. 登录 Racent / 云商后台
        await page.goto("https://www.racent.com/login")
        await page.fill("#username", "your-operator-user")
        await page.fill("#password", "secure-password")
        await page.click("button[type='submit']")
        await page.wait_for_url("**/dashboard")
        
        # 2. 进入证书申请表单
        await page.goto("https://www.racent.com/ssl/apply-free")
        await page.fill("input[name='domain']", domain)
        
        # 处理 Arco Design 的下拉选择器等特殊组件
        await page.click(".arco-select-view")
        await page.click("li:has-text('DNS 验证')")
        
        # 3. 提交申请
        await page.click("#submit-btn")
        
        # 4. 获取验证的 TXT 记录值
        await page.wait_for_selector(".validation-dns-record")
        txt_name = await page.inner_text(".validation-dns-name")
        txt_value = await page.inner_text(".validation-dns-value")
        
        print(f"[{domain}] 获取到 DNS 记录: {txt_name} -> {txt_value}")
        
        # 接下来调用腾讯云 DNS API 添加解析...
        await browser.close()

# 运行申请
# asyncio.run(apply_ssl_certificate("fugenmv.com"))
\`\`\`

## 3. 运维实战经验总结

- **Arco UI 下拉框点击**：在模拟点击带有 Arco UI 等现代化框架的页面时，要注意弹框并非存在于当前 DOM 结构中，而是挂载在 \`body\` 的最外层，需要精确定位。
- **验证码处理**：对于极少数高频次触发的图形验证码，可以接入打码平台 API，或者在运行前通过微信机器人发送提醒，进行半自动交互。
- **稳定性防错**：设计 \`--force\` 参数用于强行重签，不受“有效期大于5天不重签”的限制，极大地方便了突发情况下的手工介入。

通过这套 Playwright DevOps 脚本，我们实现了 10 多个域名 SSL 证书的常态化免人工维护，安全无虞。
`
  }
];
