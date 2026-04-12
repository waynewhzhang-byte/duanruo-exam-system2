# SonarQube 项目质量分析（本地）

本文档说明如何使用**本地部署的 SonarQube** 对本项目进行代码质量与安全分析。不连接 SonarCloud，不使用 Docker。

**说明**：本项目为 **TypeScript**（NestJS + Next.js），不使用 Java。SonarQube 只用于分析本仓库的 TS/TSX 代码；SonarQube 服务端是 Java 应用，需在本地单独安装并启动（与项目技术栈无关）。

## 本地启动 SonarQube 服务端

若本机尚未运行 SonarQube，按以下步骤启动（仅需一次准备）：

### 1. 安装 Java 17 或 21（仅用于运行 SonarQube 服务端）

```bash
brew install openjdk@21
export JAVA_HOME=$(brew --prefix openjdk@21)
```

### 2. 下载并解压 SonarQube Community Edition

- 打开 [SonarQube 下载页](https://www.sonarsource.com/products/sonarqube/downloads/)，下载 **Community Edition** 的 ZIP。
- 解压到任意目录（目录名勿以数字开头），例如：
  ```bash
  unzip ~/Downloads/sonarqube-*.zip -d ~/apps
  export SONARQUBE_HOME=~/apps/sonarqube-10.4.0.38045   # 按实际解压后的目录名
  ```

### 3. 启动服务

在项目根目录执行：

```bash
./scripts/start-sonarqube.sh
```

或手动启动：

```bash
export JAVA_HOME=$(brew --prefix openjdk@21)
$SONARQUBE_HOME/bin/macosx-universal-64/sonar.sh start   # macOS
# Linux: $SONARQUBE_HOME/bin/linux-x86-64/sonar.sh start
```

约 1–2 分钟后在浏览器打开 **http://localhost:9000**，默认账号 `admin` / `admin`，首次登录会要求修改密码。在 **My Account → Security** 生成 User Token，供下方扫描使用。

## 前置条件（执行扫描时）

1. **可访问的 SonarQube 服务**：本地已按上文启动，或使用内网 SonarQube 地址（默认 `http://localhost:9000`）。
2. **认证信息**：在 SonarQube Web 界面用 admin 登录，在 **My Account → Security** 生成 User Token。

## 环境变量

在项目根目录执行扫描前，只需设置 Token（主机地址已在配置中固定为本地）：

```bash
export SONAR_TOKEN=你的本地_SonarQube_用户Token
```

或在执行时传入（不要将 token 提交到仓库）：

```bash
npx @sonar/scan -Dsonar.token=YOUR_TOKEN
```

若 SonarQube 不在本机或端口非 9000，可覆盖地址：

```bash
npx @sonar/scan -Dsonar.host.url=http://其他主机:端口 -Dsonar.token=YOUR_TOKEN
```

## 运行分析

在**项目根目录**执行：

```bash
# 安装依赖（仅首次或 package.json 变更时）
npm install

# 执行 SonarQube 扫描（需已设置 SONAR_TOKEN，且本地 SonarQube 已启动）
npm run sonar
```

## 可选：带覆盖率

若希望 SonarQube 展示后端单元测试覆盖率，请先生成覆盖率报告再扫描：

```bash
cd server && npm run test:cov && cd ..
npm run sonar
```

覆盖率报告路径已在 `sonar-project.properties` 中配置为 `server/coverage/lcov.info`。

## 配置说明

- **配置文件**：根目录 `sonar-project.properties`
- **分析范围**：`server/src`（NestJS）、`web/src`（Next.js）
- **测试识别**：`*.spec.ts`、`*.spec.tsx`、`*.test.ts`、`*.test.tsx` 及 `test/`、`tests/` 目录
- **排除**：`node_modules`、`dist`、`.next`、`coverage`、OpenAPI 生成文件等

修改分析范围或排除规则时，直接编辑 `sonar-project.properties`。
