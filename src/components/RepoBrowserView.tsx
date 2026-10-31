import React, { useState } from 'react';
import { 
  FileCode, Copy, Check, Download, Folder, FileText, CheckCircle2, Info
} from 'lucide-react';

interface RepoFile {
  filename: string;
  path: string;
  category: string;
  description: string;
  content: string;
}

export const RepoBrowserView: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('Jenkinsfile');
  const [copied, setCopied] = useState<boolean>(false);

  const files: RepoFile[] = [
    {
      filename: 'Jenkinsfile',
      path: 'Jenkinsfile',
      category: 'CI/CD Pipeline',
      description: 'Declarative Jenkins pipeline script automating Checkout, Maven Test, SonarQube Quality Gate, Docker Build & Push, and Kubernetes Rollout.',
      content: `pipeline {
    agent any

    tools {
        maven 'Maven-3.9'
        jdk 'JDK-17'
    }

    environment {
        DOCKER_HUB_USER   = 'yourusername'
        IMAGE_NAME        = 'devops-java-app'
        IMAGE_TAG         = "build-\${env.BUILD_NUMBER}"
        FULL_IMAGE_NAME   = "\${DOCKER_HUB_USER}/\${IMAGE_NAME}:\${IMAGE_TAG}"
        LATEST_IMAGE      = "\${DOCKER_HUB_USER}/\${IMAGE_NAME}:latest"
        DOCKER_CRED_ID    = 'dockerhub-credentials'
        SONAR_SERVER_NAME = 'SonarQube-Server'
        K8S_NAMESPACE     = 'default'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '5'))
        timeout(time: 30, unit: 'MINUTES')
        ansiColor('xterm')
        disableConcurrentBuilds()
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo ">>> Pulling latest source code from GitHub repository... <<<"
                checkout scm
                sh 'git log -1 --stat'
            }
        }

        stage('2. Build & Unit Tests') {
            steps {
                echo ">>> Compiling Java source code and running JUnit 5 tests via Maven... <<<"
                sh 'mvn clean test -B'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('3. SonarQube Analysis') {
            steps {
                echo ">>> Performing Static Code Analysis & Security Scan via SonarQube... <<<"
                withSonarQubeEnv(SONAR_SERVER_NAME) {
                    sh '''
                        mvn sonar:sonar \\
                          -Dsonar.projectKey=devops-java-app \\
                          -Dsonar.projectName="DevOps Java Application" \\
                          -Dsonar.java.binaries=target/classes \\
                          -B
                    '''
                }
            }
        }

        stage('4. Quality Gate Check') {
            steps {
                echo ">>> Waiting for SonarQube Quality Gate webhook callback... <<<"
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()
                        if (qg.status != 'OK') {
                            error "Pipeline aborted: SonarQube Quality Gate status is \${qg.status}!"
                        }
                    }
                }
            }
        }

        stage('5. Docker Image Build') {
            steps {
                echo ">>> Building multi-stage Docker image: \${FULL_IMAGE_NAME} ... <<<"
                sh """
                    docker build -t \${FULL_IMAGE_NAME} -t \${LATEST_IMAGE} .
                    docker images | grep \${IMAGE_NAME}
                """
            }
        }

        stage('6. Vulnerability Scan') {
            steps {
                echo ">>> Scanning Docker image for critical vulnerabilities using Trivy... <<<"
                sh """
                    if command -v trivy >/dev/null 2>&1; then
                        trivy image --severity HIGH,CRITICAL --light \${FULL_IMAGE_NAME} || true
                    else
                        echo "Trivy not installed; skipping scan."
                    fi
                """
            }
        }

        stage('7. Push Image to Docker Hub') {
            steps {
                echo ">>> Authenticating and pushing images to Docker Hub... <<<"
                withCredentials([usernamePassword(credentialsId: DOCKER_CRED_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        docker push \${FULL_IMAGE_NAME}
                        docker push \${LATEST_IMAGE}
                        docker logout
                    """
                }
            }
        }

        stage('8. Deploy to Kubernetes') {
            steps {
                echo ">>> Applying Kubernetes manifests to cluster... <<<"
                sh """
                    sed -i "s|image: .*devops-java-app:.*|image: \${FULL_IMAGE_NAME}|g" k8s/deployment.yaml
                    kubectl apply -f k8s/configmap.yaml -n \${K8S_NAMESPACE}
                    kubectl apply -f k8s/deployment.yaml -n \${K8S_NAMESPACE}
                    kubectl apply -f k8s/service.yaml -n \${K8S_NAMESPACE}
                """
            }
        }

        stage('9. Verify Deployment Rollout') {
            steps {
                echo ">>> Verifying Kubernetes rolling update status... <<<"
                sh """
                    kubectl rollout status deployment/devops-java-app -n \${K8S_NAMESPACE} --timeout=90s
                    kubectl get pods -l app=devops-java-app -n \${K8S_NAMESPACE} -o wide
                    kubectl get svc devops-java-app-service -n \${K8S_NAMESPACE}
                """
            }
        }
    }

    post {
        always {
            echo ">>> Cleaning up dangling build images on agent disk... <<<"
            sh 'docker image prune -f --filter "until=24h" || true'
        }
        success {
            echo "SUCCESS: Build #\${env.BUILD_NUMBER} deployed successfully to Kubernetes!"
        }
        failure {
            echo "FAILED: Pipeline failed at stage: \${env.STAGE_NAME}"
        }
    }
}`
    },
    {
      filename: 'Dockerfile',
      path: 'Dockerfile',
      category: 'Containerization',
      description: 'Multi-stage production Dockerfile: Stage 1 compiles Java with Maven; Stage 2 runs with lightweight Alpine JRE under a non-root user.',
      content: `# --- Stage 1: Build stage ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy Maven descriptor first to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Production Runtime stage ---
FROM eclipse-temurin:17-jre-alpine AS runner

LABEL maintainer="DevOps Team <devops@example.com>"
LABEL project="End-to-End DevOps Pipeline"

WORKDIR /app

# Non-root user compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled JAR artifact
COPY --from=builder /build/target/devops-java-app-1.0.0.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

# CGroup memory constraints
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]`
    },
    {
      filename: 'deployment.yaml',
      path: 'k8s/deployment.yaml',
      category: 'Kubernetes Manifests',
      description: 'Kubernetes Deployment with 2 replicas, RollingUpdate strategy (zero downtime), CPU/RAM limits, and health probes.',
      content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-java-app
  labels:
    app: devops-java-app
    tier: backend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: devops-java-app
  template:
    metadata:
      labels:
        app: devops-java-app
        tier: backend
    spec:
      containers:
      - name: devops-java-app
        image: yourusername/devops-java-app:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
          name: http
        envFrom:
        - configMapRef:
            name: devops-java-app-config
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8080
          initialDelaySeconds: 45
          periodSeconds: 15
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          runAsNonRoot: true
          runAsUser: 100
          allowPrivilegeEscalation: false`
    },
    {
      filename: 'service.yaml',
      path: 'k8s/service.yaml',
      category: 'Kubernetes Manifests',
      description: 'Exposes application on NodePort 30080 for direct public access on AWS EC2 without requiring expensive load balancers.',
      content: `apiVersion: v1
kind: Service
metadata:
  name: devops-java-app-service
  labels:
    app: devops-java-app
    tier: backend
spec:
  type: NodePort
  selector:
    app: devops-java-app
  ports:
  - port: 8080
    targetPort: 8080
    nodePort: 30080
    protocol: TCP
    name: http`
    },
    {
      filename: 'configmap.yaml',
      path: 'k8s/configmap.yaml',
      category: 'Kubernetes Manifests',
      description: 'ConfigMap decoupling runtime configurations (logging levels, profile) from container images.',
      content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: devops-java-app-config
  labels:
    app: devops-java-app
    tier: backend
data:
  APP_ENV: "production-aws"
  SERVER_PORT: "8080"
  LOGGING_LEVEL_ROOT: "INFO"`
    },
    {
      filename: 'hpa.yaml',
      path: 'k8s/hpa.yaml',
      category: 'Kubernetes Manifests',
      description: 'Horizontal Pod Autoscaler scaling pods from 2 to 5 when average CPU utilization exceeds 70%.',
      content: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devops-java-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devops-java-app
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70`
    },
    {
      filename: 'pom.xml',
      path: 'pom.xml',
      category: 'Build Descriptor',
      description: 'Maven configuration for Java 17, Spring Boot Web, Spring Actuator, Surefire Test runner, and SonarQube Scanner.',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.3</version>
        <relativePath/>
    </parent>
    <groupId>com.devops.demo</groupId>
    <artifactId>devops-java-app</artifactId>
    <version>1.0.0</version>
    <name>devops-java-app</name>
    <description>Enterprise CI/CD Demonstration Web Application</description>

    <properties>
        <java.version>17</java.version>
        <sonar.projectKey>devops-java-app</sonar.projectKey>
        <sonar.projectName>DevOps Java Application</sonar.projectName>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
            <plugin>
                <groupId>org.sonarsource.scanner.maven</groupId>
                <artifactId>sonar-maven-plugin</artifactId>
                <version>3.11.0.3922</version>
            </plugin>
        </plugins>
    </build>
</project>`
    },
    {
      filename: 'setup-ec2-prerequisites.sh',
      path: 'scripts/setup-ec2-prerequisites.sh',
      category: 'Automation Scripts',
      description: 'One-click shell script installing Java 17, Maven 3.9, Docker CE, Jenkins LTS, SonarQube container, and K3s on Ubuntu 22.04 LTS.',
      content: `#!/bin/bash
set -e

echo ">>> Updating system package index..."
sudo apt-get update -y
sudo apt-get install -y curl wget git openjdk-17-jdk maven

echo ">>> Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins || true
sudo chmod 666 /var/run/docker.sock || true

echo ">>> Installing Jenkins LTS..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y && sudo apt-get install -y jenkins
sudo systemctl enable jenkins && sudo systemctl start jenkins

echo ">>> Launching SonarQube..."
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
docker run -d --name sonarqube -p 9000:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true --restart always sonarqube:lts-community

echo ">>> Installing K3s Kubernetes..."
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p "$HOME/.kube" && sudo cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config" && sudo chown $(id -u):$(id -g) "$HOME/.kube/config"

echo "Setup complete! Jenkins: 8080, Sonar: 9000, App NodePort: 30080"`
    }
  ];

  const currentFile = files.find(f => f.path === selectedFilePath) || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* File Tree Explorer (Left Column) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 sticky top-24 space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-4 h-4 text-cyan-400" />
            <span>Repository File Tree</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Production configuration manifests</p>
        </div>

        <div className="space-y-1">
          {files.map((file) => {
            const isSelected = file.path === selectedFilePath;

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 text-white'
                    : 'border-slate-800/60 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="font-mono truncate">{file.path}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">{file.category.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Git Repository Ready</div>
            <p className="text-[11px] leading-relaxed">
              All files are already created in this project directory under <span className="font-mono text-cyan-300">sample-java-app/</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer (Right Column) */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        
        {/* File Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-cyan-400">{currentFile.path}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{currentFile.category}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentFile.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed max-h-[700px] selection:bg-cyan-900">
          {currentFile.content}
        </div>

      </div>

    </div>
  );
};
