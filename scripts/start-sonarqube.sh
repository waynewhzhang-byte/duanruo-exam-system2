#!/usr/bin/env bash
# 在本地启动 SonarQube 服务端（不依赖 Docker）
# 前置：1) 安装 Java 17/21  2) 下载并解压 SonarQube Community ZIP，设置 SONARQUBE_HOME

set -e

# 1) 确定 Java（优先使用 Homebrew 的 openjdk@21，避免使用系统占位 java）
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
  JAVA="$JAVA_HOME/bin/java"
elif [ -x "/usr/local/opt/openjdk@21/bin/java" ]; then
  export JAVA_HOME=/usr/local/opt/openjdk@21
  JAVA="$JAVA_HOME/bin/java"
elif [ -x "/opt/homebrew/opt/openjdk@21/bin/java" ]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21
  JAVA="$JAVA_HOME/bin/java"
elif command -v java >/dev/null 2>&1; then
  JAVA=java
else
  echo "未检测到 Java 17/21。请先安装，例如："
  echo "  brew install openjdk@21"
  echo "  export JAVA_HOME=\$(brew --prefix openjdk@21)"
  exit 1
fi

"$JAVA" -version 2>&1 || { echo "Java 版本异常，需要 17 或 21"; exit 1; }

# 2) 确定 SonarQube 目录
if [ -n "$SONARQUBE_HOME" ] && [ -f "$SONARQUBE_HOME/bin/macosx-universal-64/sonar.sh" ]; then
  SONAR_SCRIPT="$SONARQUBE_HOME/bin/macosx-universal-64/sonar.sh"
elif [ -n "$SONARQUBE_HOME" ] && [ -f "$SONARQUBE_HOME/bin/linux-x86-64/sonar.sh" ]; then
  SONAR_SCRIPT="$SONARQUBE_HOME/bin/linux-x86-64/sonar.sh"
else
  echo "未找到 SonarQube。请："
  echo "  1) 从 https://www.sonarsource.com/products/sonarqube/downloads/ 下载 Community Edition ZIP"
  echo "  2) 解压到目录，例如: unzip sonarqube-*.zip -d ~/apps"
  echo "  3) 设置环境变量: export SONARQUBE_HOME=~/apps/sonarqube-<version>"
  echo "  4) 再执行本脚本: $0"
  exit 1
fi

echo "使用 Java: $JAVA"
echo "使用 SonarQube: $SONARQUBE_HOME"
echo "启动 SonarQube（约 1–2 分钟后可访问 http://localhost:9000）..."
"$SONAR_SCRIPT" start
