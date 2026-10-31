#!/bin/bash
# ==============================================================================
# Automated Provisioning Script for AWS EC2 (Ubuntu 22.04 LTS)
# Installs: Git, OpenJDK 17, Maven 3.9, Docker, Jenkins LTS, SonarQube, and K3s (K8s)
# Recommended Instance: AWS EC2 t2.medium / t2.large or 2x t2.micro
# ==============================================================================

set -e

echo "=========================================================="
echo " Starting DevOps Automated Server Provisioning Script     "
echo "=========================================================="

# 1. Update OS package repositories
echo ">>> [1/7] Updating system package index..."
sudo apt-get update -y
sudo apt-get install -y curl wget apt-transport-https ca-certificates gnupg lsb-release software-properties-common git

# 2. Install OpenJDK 17 & Maven
echo ">>> [2/7] Installing OpenJDK 17 and Apache Maven..."
sudo apt-get install -y openjdk-17-jdk maven
java -version
mvn -version

# 3. Install Docker Engine
echo ">>> [3/7] Installing Docker Engine..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user and set docker socket permissions
sudo usermod -aG docker "$USER"
sudo systemctl enable docker
sudo systemctl start docker
sudo chmod 666 /var/run/docker.sock || true

# 4. Install Jenkins LTS
echo ">>> [4/7] Installing Jenkins LTS..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y jenkins
sudo usermod -aG docker jenkins || true
sudo systemctl enable jenkins
sudo systemctl start jenkins

# 5. Configure Kernel for SonarQube & Run SonarQube via Docker
echo ">>> [5/7] Deploying SonarQube LTS container..."
# SonarQube requires vm.max_map_count >= 262144 for Elasticsearch
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -w fs.file-max=65536
echo "fs.file-max=65536" | sudo tee -a /etc/sysctl.conf

if [ ! "$(docker ps -q -f name=sonarqube)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=sonarqube)" ]; then
        docker rm sonarqube
    fi
    docker run -d --name sonarqube \
      -p 9000:9000 \
      -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
      --restart always \
      sonarqube:lts-community
fi

# 6. Install Lightweight Kubernetes (K3s) & kubectl
echo ">>> [6/7] Installing Lightweight Kubernetes (K3s)..."
curl -sfL https://get.k3s.io | sh -
# Allow non-root users (like jenkins and ubuntu) to access kubeconfig
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p "$HOME/.kube"
sudo cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config"
sudo chown $(id -u):$(id -g) "$HOME/.kube/config"

# Also allow jenkins user to use kubectl
sudo mkdir -p /var/lib/jenkins/.kube || true
sudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config || true
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube || true

# Alias kubectl if needed
if ! command -v kubectl &> /dev/null; then
    sudo ln -s /usr/local/bin/k3s /usr/local/bin/kubectl || true
fi

# 7. Verification & Summary Output
echo "=========================================================="
echo " Installation Complete! Tool Versions & Endpoints:        "
echo "=========================================================="
echo "Java:       $(java -version 2>&1 | head -n 1)"
echo "Maven:      $(mvn -version 2>&1 | head -n 1)"
echo "Docker:     $(docker --version)"
echo "Kubernetes: $(kubectl version --client --output=yaml | grep gitVersion | head -n 1)"
echo "Jenkins:    http://$(curl -s ifconfig.me):8080"
echo "SonarQube:  http://$(curl -s ifconfig.me):9000 (Default login: admin / admin)"
echo "App NodePort: http://$(curl -s ifconfig.me):30080"
echo "----------------------------------------------------------"
echo "Jenkins Initial Admin Password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword || echo "Pending Jenkins startup..."
echo "=========================================================="
