# YOUR-COMPANY-NAME 外贸网站

**多语言 B2B 外贸产品介绍网站 · 纯静态 HTML · SEO 友好**

## 网站结构

```
/                                # 语言选择入口（自动跳转 + 手动选择）
├── index.html                   # 语言选择页
├── sitemap.xml                  # SEO 站点地图
├── robots.txt                   # 爬虫规则
└── site/                        # 实际网站文件
    ├── assets/                  # CSS / JS / 图片
    │   ├── css/style.css
    │   └── js/main.js
    ├── en/                      # 英语（默认）
    ├── zh/                      # 简体中文
    ├── es/                      # 西班牙语
    ├── ru/                      # 俄语
    └── ar/                      # 阿拉伯语（RTL）
```

每种语言下均有：
- `index.html` 首页
- `about.html` 关于我们
- `products.html` 产品列表
- `contact.html` 联系我们
- `products/` 5 个产品详情页（CNC加工中心、液压机、精密车床、工业泵、电动工具套装）

## 技术栈

| 类别       | 技术                                |
|-----------|--------------------------------------|
| 页面       | 纯静态 HTML（无框架）                |
| 样式       | 原生 CSS（手写，无依赖）             |
| 脚本       | 原生 JavaScript（约 100 行）         |
| 图像       | SVG（矢量图，无外部依赖）            |
| 表单       | mailto + WhatsApp                    |
| 字体       | 系统字体栈（Google Fonts 之后可选）   |

## 部署方式

适合部署在以下静态托管平台（全部免费）：

### 选项 1 - Cloudflare Pages（推荐全球访问最快）
1. 登录 https://pages.cloudflare.com
2. 创建项目 → 上传 site/ 目录
3. 自定义域名绑定
4. 自动 HTTPS、全球 CDN

### 选项 2 - Netlify
1. 登录 https://app.netlify.com
2. 拖拽 site/ 文件夹到页面
3. 立即获得 *.netlify.app 子域名
4. 自定义域名绑定

### 选项 3 - GitHub Pages
1. 创建 GitHub 仓库
2. 推送代码
3. Settings → Pages → 选择 main 分支
4. 绑定自定义域名

### 选项 4 - 阿里云 OSS / 腾讯云 COS + CDN
1. 创建存储桶，开启"静态网站托管"
2. 上传 site/ 目录
3. 绑定自定义域名 + CDN 加速

## ⚠️ 部署前必做 - 全局替换占位符

打开 site/ 下所有 HTML，全局替换以下占位符：

| 占位符                          | 替换为                              | 出现位置                    |
|----------------------------------|--------------------------------------|------------------------------|
| `YOUR-COMPANY-NAME`              | 你的真实公司名                        | 全站标题、footer             |
| `info@yourcompany.com`           | 你的真实邮箱                          | Topbar、Contact、Footer      |
| `+86-XXX-XXXX-XXXX`              | 你的真实电话（含国家代码）            | Topbar、WhatsApp 链接        |
| `86XXXXXXXXXX`                   | 同上但无 `+` 和 `-`                  | WhatsApp `wa.me` 链接内      |
| `Industrial Park, ...`           | 你的真实公司地址                      | Contact 页面                 |
| `www.yourcompany.com`            | 你的域名                             | sitemap.xml                 |

**推荐工具：** VSCode 全局搜索替换，或者用 sed：

```bash
# 例如 (Linux / WSL / Git Bash):
find site/ -name "*.html" -exec sed -i "s/YOUR-COMPANY-NAME/Real Company Name/g" {} \;
find site/ -name "*.html" -exec sed -i "s/info@yourcompany.com/sales@realcompany.com/g" {} \;
# ... 等等
```

## 产品真实图片替换

当前所有产品图片均使用 SVG 占位图（带规格文字）。

要换成真实产品图：

1. 把图片放进 `site/assets/img/`
2. 推荐尺寸 800×600px（产品），宽高比 4:3
3. 编辑对应的产品 HTML，把：
   ```html
   <div class="main-img" data-svg="CNC MACHINING CENTER" data-color="#1e3a5f"></div>
   ```
   改为：
   ```html
   <img src="../../assets/img/cnc-1.jpg" alt="CNC Machining Center VMC-1060L" class="main-img">
   ```
4. CSS 已有 `.main-img { width:100%; height:420px; object-fit:cover; }` 兜底

## SEO 已优化项

✅ 每页独立 `<title>` 和 `<meta description>`
✅ Open Graph + Twitter Card 标签（准备好，需域名）
✅ `hreflang` 多语言互链（5 种语言）
✅ `x-default` 默认语言回退
✅ 语义化 HTML5（`header`, `nav`, `main`, `footer`, `section`）
✅ 结构化数据 JSON-LD（Organization、Product）— 见各页面 `<head>`
✅ sitemap.xml（含 `xhtml:link` 互链）
✅ robots.txt
✅ 加载速度快（无外部资源，矢量图）
✅ 移动端响应式（980+ 移动端断点）

## 询盘接收

- **邮箱**：表单提交时打开用户邮件客户端，预填所有字段，无需后端
- **WhatsApp**：每个产品页和浮动按钮都有直联，预填充首次问候语
- 后续可升级：接 Formspree / Getform（每月免费 50-100 单）

## 后续可扩展

| 需求              | 方案                                  |
|-------------------|--------------------------------------|
| 真实图片管理       | 接 Cloudinary 或七牛云                   |
| 多图库管理         | 改用 [VitePress](https://vitepress.dev) 或 [Astro](https://astro.build) |
| 后台表单          | 接 Formspree (https://formspree.io) 免费版即可 |
| 自动邮件跟进       | 接 Resend / SendGrid                |
| 实时统计          | Google Analytics 4 + Google Search Console |
| 询盘数据采集      | 接 CRM (HubSpot / 销售易)             |

## 当前展示效果

```bash
# 本地预览 - 仅在具备 Python 环境时
cd site
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## License

私有商业用途。本模板代码可修改使用。
