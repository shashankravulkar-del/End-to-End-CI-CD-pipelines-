import { LabStage, TroubleshootingItem, InterviewQA } from '../types';

export const LAB_STAGES: LabStage[] = [
  {
    id: 0,
    slug: 'aws-infrastructure',
    title: 'AWS EC2 Server Provisioning & Security Groups',
    category: 'Cloud Infrastructure',
    duration: '15 mins',
    mentorNote: 'As a DevOps engineer, proper infrastructure sizing and firewall configuration prevent 80% of pipeline networking issues. Always use Ubuntu 22.04 LTS and configure your Security Groups before launching services.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['AWS Free Tier Account', 'SSH Key Pair (.pem) generated', 'Terminal / Git Bash'],
    commands: [
      {
        label: 'Connect to EC2 Instance via SSH',
        description: 'Connect securely using your downloaded keypair file.',
        code: `chmod 400 your-keypair.pem\nssh -i "your-keypair.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>`,
        expectedOutput: `Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 6.5.0-1014-aws x86_64)\n * Documentation:  https://help.ubuntu.com\n * Management:     https://landscape.canonical.com\nubuntu@ip-172-31-42-10:~$ `
      },
      {
        label: 'Check Server Resources (Memory & CPU)',
        description: 'Ensure instance has at least 4GB RAM (t2.medium) or configure swap memory.',
        code: `free -h\nlscpu | grep "CPU(s):"`,
        expectedOutput: `              total        used        free      shared  buff/cache   available\nMem:          3.8Gi       210Mi       3.1Gi       1.0Mi       520Mi       3.4Gi\nSwap:            0B          0B          0B\nCPU(s):                   2`
      },
      {
        label: 'Create 2GB Swap Memory (Crucial for Low-RAM EC2)',
        description: 'Prevents the Linux Out-Of-Memory (OOM) killer from crashing Jenkins or Maven builds.',
        code: `sudo fallocate -l 2G /swapfile\nsudo chmod 600 /swapfile\nsudo mkswap /swapfile\nsudo swapon /swapfile\necho '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`,
        expectedOutput: `Setting up swapspace version 1, size = 2 GiB (2147479552 bytes)\nno label, UUID=a47b1932-841f-4b09-b695-8120e6c5188f`
      }
    ],
    pitfalls: [
      {
        error: 'SSH Connection Timeout / Operation timed out',
        cause: 'Security Group Port 22 is either blocked or bound to a changed public IP.',
        solution: 'In AWS EC2 Console > Security Groups > Inbound Rules, add SSH (port 22) from My IP (or 0.0.0.0/0 for testing).'
      },
      {
        error: 'Permissions 0644 for your-keypair.pem are too open',
        cause: 'SSH client rejects private keys that other users can read.',
        solution: 'Run chmod 400 your-keypair.pem (on Windows, use ICACLS to remove inherited permissions).'
      }
    ],
    verificationSteps: [
      'Successfully logged in as ubuntu user',
      'Port 22, 8080 (Jenkins), 9000 (SonarQube), 30080 (App) added to AWS Security Group',
      'Swap memory active (verified with free -h)'
    ]
  },
  {
    id: 1,
    slug: 'linux-tool-setup',
    title: 'Linux Server Setup & DevOps Toolchain Installation',
    category: 'System Administration',
    duration: '20 mins',
    mentorNote: 'Automate installations using shell scripts. Notice how we add the "jenkins" user to the "docker" group so Jenkins can build container images without sudo privileges.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['SSH access to EC2 instance', 'Root/sudo privileges'],
    commands: [
      {
        label: 'Install Java 17 OpenJDK & Apache Maven',
        description: 'Java 17 is required for Spring Boot 3 and modern Jenkins LTS releases.',
        code: `sudo apt-get update -y\nsudo apt-get install -y openjdk-17-jdk maven git\njava -version\nmvn -version`,
        expectedOutput: `openjdk version "17.0.10" 2024-01-16\nOpenJDK Runtime Environment (build 17.0.10+7-Ubuntu-122.04.1)\nApache Maven 3.6.9 / 3.9.6\nMaven home: /usr/share/maven`
      },
      {
        label: 'Install Docker Engine & Configure Socket Permissions',
        description: 'Install official Docker CE and enable systemd daemon.',
        code: `curl -fsSL https://get.docker.com -o get-docker.sh\nsudo sh get-docker.sh\nsudo usermod -aG docker ubuntu\nsudo usermod -aG docker jenkins || true\nsudo chmod 666 /var/run/docker.sock\nsudo systemctl enable docker && sudo systemctl start docker\ndocker --version`,
        expectedOutput: `Docker version 25.0.3, build 4debf41\nDocker daemon is active and running.`
      },
      {
        label: 'Install Jenkins LTS',
        description: 'Add official Jenkins repository key and install via apt.',
        code: `curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \\\n  /usr/share/keyrings/jenkins-keyring.asc > /dev/null\necho deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \\\n  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \\\n  /etc/apt/sources.list.d/jenkins.list > /dev/null\nsudo apt-get update -y && sudo apt-get install -y jenkins\nsudo systemctl enable jenkins && sudo systemctl start jenkins`,
        expectedOutput: `Synchronizing state of jenkins.service with SysV service script...\njenkins.service is active (running).`
      },
      {
        label: 'Retrieve Jenkins Initial Admin Password',
        description: 'Required on the first login to unlock Jenkins UI.',
        code: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`,
        expectedOutput: `4f7b2c9a180d4e32a67e543679c8821d`
      },
      {
        label: 'Launch SonarQube Container via Docker',
        description: 'SonarQube Community Edition deployed on port 9000 with kernel memory adjustment.',
        code: `sudo sysctl -w vm.max_map_count=262144\ndocker run -d --name sonarqube -p 9000:9000 \\\n  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \\\n  --restart always sonarqube:lts-community\ndocker ps`,
        expectedOutput: `CONTAINER ID   IMAGE                    STATUS         PORTS                    NAMES\n9a8f21cd78e4   sonarqube:lts-community  Up 12 seconds  0.0.0.0:9000->9000/tcp   sonarqube`
      }
    ],
    pitfalls: [
      {
        error: 'dial unix /var/run/docker.sock: connect: permission denied',
        cause: 'The user executing the command (e.g. jenkins or ubuntu) is not in the docker group.',
        solution: 'Run sudo usermod -aG docker jenkins && sudo chmod 666 /var/run/docker.sock, then restart Jenkins.'
      },
      {
        error: 'SonarQube container exits immediately (Elasticsearch max_map_count check failed)',
        cause: 'Linux kernel default for vm.max_map_count is 65530, but SonarQube requires 262144.',
        solution: 'Execute sudo sysctl -w vm.max_map_count=262144 and add vm.max_map_count=262144 to /etc/sysctl.conf.'
      }
    ],
    verificationSteps: [
      'Java 17 and Maven commands respond with version numbers',
      'Docker service active and running',
      'Jenkins accessible at http://<EC2-IP>:8080',
      'SonarQube accessible at http://<EC2-IP>:9000'
    ]
  },
  {
    id: 2,
    slug: 'java-spring-boot-app',
    title: 'Java Spring Boot Web App & Maven Build Verification',
    category: 'Application Engineering',
    duration: '20 mins',
    mentorNote: 'In real companies, DevOps engineers must understand application health probes. Notice our /api/v1/health and /api/v1/ready endpoints; Kubernetes uses these to determine if the container is alive.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['Maven installed', 'Java 17 installed', 'Git installed'],
    commands: [
      {
        label: 'Clone Application Code into Workspace',
        description: 'Clone the repository or verify local files.',
        code: `git clone https://github.com/yourusername/devops-java-app.git\ncd devops-java-app`,
        expectedOutput: `Cloning into 'devops-java-app'...\nremote: Enumerating objects: 24, done.\nReceiving objects: 100% (24/24), done.`
      },
      {
        label: 'Compile and Execute Unit Tests Locally',
        description: 'Run Maven Surefire unit tests to ensure application code passes all assertions.',
        code: `mvn clean test`,
        expectedOutput: `[INFO] -------------------------------------------------------\n[INFO]  T E S T S\n[INFO] -------------------------------------------------------\n[INFO] Running com.devops.demo.DevOpsApplicationTests\n[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.842 s\n[INFO] BUILD SUCCESS`
      },
      {
        label: 'Package Application Artifact (JAR file)',
        description: 'Generate executable fat JAR file in target/ directory.',
        code: `mvn clean package -DskipTests\nls -lh target/*.jar`,
        expectedOutput: `-rw-r--r-- 1 ubuntu ubuntu 18M Oct 31 10:14 target/devops-java-app-1.0.0.jar`
      }
    ],
    pitfalls: [
      {
        error: 'Fatal error compiling: invalid target release: 17',
        cause: 'Maven is defaulting to Java 11 or Java 8 instead of Java 17.',
        solution: 'Export JAVA_HOME: export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 and verify with java -version.'
      }
    ],
    verificationSteps: [
      'mvn clean test passes with 0 failures',
      'target/devops-java-app-1.0.0.jar artifact created successfully',
      'Application runs locally with java -jar target/*.jar and responds to curl localhost:8080/api/v1/health'
    ]
  },
  {
    id: 3,
    slug: 'sonarqube-integration',
    title: 'SonarQube Integration & Quality Gate Enforcement',
    category: 'Code Quality & Security',
    duration: '25 mins',
    mentorNote: 'A Quality Gate is the bouncer of your CI/CD pipeline. If someone commits code with security vulnerabilities, high cyclomatic complexity, or missing unit tests, the build breaks before Docker images are created.',
    executionLocation: 'SonarQube Web UI',
    prerequisites: ['SonarQube running on port 9000', 'Jenkins running on port 8080'],
    commands: [
      {
        label: 'Run Maven Sonar Scanner from Terminal (Test Run)',
        description: 'Test scanning the application directly before wiring it into Jenkins.',
        code: `mvn sonar:sonar \\\n  -Dsonar.host.url=http://localhost:9000 \\\n  -Dsonar.token="your-generated-sonar-token" \\\n  -Dsonar.projectKey=devops-java-app \\\n  -Dsonar.projectName="DevOps Java Application"`,
        expectedOutput: `[INFO] Analysis report generated in /app/target/sonar\n[INFO] ANALYSIS SUCCESSFUL, you can browse http://localhost:9000/dashboard?id=devops-java-app\n[INFO] Quality Gate status: OK`
      }
    ],
    pitfalls: [
      {
        error: 'Quality Gate webhook timeout in Jenkins (waitForQualityGate hung)',
        cause: 'SonarQube does not know where to send the webhook response after analyzing.',
        solution: 'In SonarQube > Administration > Configuration > Webhooks, create webhook: URL = http://<EC2-IP>:8080/sonarqube-webhook/ (Notice trailing slash).'
      },
      {
        error: 'SonarQube token authentication failed (HTTP 401)',
        cause: 'Using default admin password instead of an analysis token.',
        solution: 'Generate a User Token in SonarQube > My Account > Security > Generate Token (type: Global Analysis Token).'
      }
    ],
    verificationSteps: [
      'SonarQube Project created under name devops-java-app',
      'SonarQube Server configured in Jenkins System settings',
      'SonarQube Webhook pointing to http://<EC2-IP>:8080/sonarqube-webhook/',
      'Quality Gate status verified as PASSED on SonarQube dashboard'
    ]
  },
  {
    id: 4,
    slug: 'docker-containerization',
    title: 'Multi-Stage Dockerfile & Docker Hub Registry Push',
    category: 'Containerization',
    duration: '25 mins',
    mentorNote: 'Multi-stage builds are standard practice. Stage 1 has Maven and build tools (800MB); Stage 2 copies ONLY the built JAR into a clean Alpine JRE (180MB) and runs as a non-root user for security.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['Docker daemon active', 'Docker Hub Account created'],
    commands: [
      {
        label: 'Build Docker Image Locally',
        description: 'Compile application artifact and package into container image.',
        code: `docker build -t yourusername/devops-java-app:1.0.0 -t yourusername/devops-java-app:latest .`,
        expectedOutput: `[+] Building 14.2s (14/14) FINISHED\n => [builder 1/4] FROM maven:3.9.6-eclipse-temurin-17-alpine\n => [runner 1/4] FROM eclipse-temurin:17-jre-alpine\n => copying /build/target/devops-java-app-1.0.0.jar to app.jar\n => naming to docker.io/yourusername/devops-java-app:1.0.0`
      },
      {
        label: 'Run Container and Test Health Endpoint',
        description: 'Verify container starts properly and non-root user is active.',
        code: `docker run -d --name test-app -p 8081:8080 yourusername/devops-java-app:1.0.0\ncurl -s http://localhost:8081/api/v1/health\ndocker exec test-app whoami`,
        expectedOutput: `{"status":"HEALTHY","message":"Service is up and responding to traffic"}\nappuser`
      },
      {
        label: 'Login and Push Image to Docker Hub',
        description: 'Authenticate with Docker Hub access token and push image tags.',
        code: `echo "your-docker-token" | docker login -u yourusername --password-stdin\ndocker push yourusername/devops-java-app:1.0.0\ndocker push yourusername/devops-java-app:latest`,
        expectedOutput: `The push refers to repository [docker.io/yourusername/devops-java-app]\n3b9a5c81d2: Pushed\nlatest: digest: sha256:7c9841f32a03... size: 1782`
      }
    ],
    pitfalls: [
      {
        error: 'denied: requested access to the resource is denied',
        cause: 'Image tag does not match your Docker Hub username, or you are not logged in.',
        solution: 'Tag image with your exact Docker Hub username: docker tag <image> <your-dockerhub-user>/<repo>:<tag> and run docker login.'
      }
    ],
    verificationSteps: [
      'Docker image built successfully with multi-stage Dockerfile',
      'Container executes as non-root user appuser',
      'Image pushed and visible on your public/private Docker Hub repository'
    ]
  },
  {
    id: 5,
    slug: 'kubernetes-cluster-setup',
    title: 'Kubernetes Cluster Setup & Manifest Configuration',
    category: 'Container Orchestration',
    duration: '30 mins',
    mentorNote: 'For single-server AWS EC2 deployments, K3s (certified lightweight Kubernetes) or Minikube gives you the exact same Kubernetes API and kubectl commands as AWS EKS without costing $73/month in control plane fees.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['AWS EC2 instance', 'kubectl installed or K3s installed'],
    commands: [
      {
        label: 'Install K3s Lightweight Kubernetes',
        description: 'Sets up fully-compliant production Kubernetes in under 30 seconds.',
        code: `curl -sfL https://get.k3s.io | sh -\nsudo chmod 644 /etc/rancher/k3s/k3s.yaml\nkubectl get nodes`,
        expectedOutput: `NAME               STATUS   ROLES                  AGE   VERSION\nip-172-31-42-10    Ready    control-plane,master   18s   v1.28.6+k3s2`
      },
      {
        label: 'Grant Jenkins Permission to Manage Kubernetes',
        description: 'Copies kubeconfig to Jenkins home directory so pipeline steps can run kubectl.',
        code: `sudo mkdir -p /var/lib/jenkins/.kube\nsudo cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config\nsudo chown -R jenkins:jenkins /var/lib/jenkins/.kube\nsudo -u jenkins kubectl get nodes`,
        expectedOutput: `NAME               STATUS   ROLES                  AGE   VERSION\nip-172-31-42-10    Ready    control-plane,master   2m    v1.28.6+k3s2`
      },
      {
        label: 'Apply Manifests to Kubernetes Cluster',
        description: 'Deploy ConfigMap, Deployment with 2 replicas, and NodePort Service.',
        code: `kubectl apply -f k8s/configmap.yaml\nkubectl apply -f k8s/deployment.yaml\nkubectl apply -f k8s/service.yaml\nkubectl get pods,svc -o wide`,
        expectedOutput: `NAME                                   READY   STATUS    RESTARTS   AGE\npod/devops-java-app-68c4d9bd6-8f2kx     1/1     Running   0          45s\npod/devops-java-app-68c4d9bd6-px94m     1/1     Running   0          45s\n\nNAME                             TYPE        CLUSTER-IP      PORT(S)          AGE\nservice/devops-java-app-service  NodePort    10.43.120.44    8080:30080/TCP   45s`
      }
    ],
    pitfalls: [
      {
        error: 'The connection to the server localhost:8080 was refused - did you specify the right host or port?',
        cause: 'kubectl cannot locate kubeconfig file in ~/.kube/config.',
        solution: 'Export KUBECONFIG: export KUBECONFIG=/etc/rancher/k3s/k3s.yaml or copy to ~/.kube/config.'
      },
      {
        error: 'Pod stuck in CrashLoopBackOff or ErrImagePull',
        cause: 'Docker Hub image does not exist or image tag in deployment.yaml is incorrect.',
        solution: 'Run kubectl describe pod <pod-name> to inspect Events; update image: yourusername/devops-java-app:latest.'
      }
    ],
    verificationSteps: [
      '2 Pods in Running state with 1/1 READY',
      'Service exposed on NodePort 30080',
      'curl http://localhost:30080/api/v1/info returns HTTP 200 with pod hostname'
    ]
  },
  {
    id: 6,
    slug: 'jenkins-pipeline-webhook',
    title: 'Declarative Jenkins Pipeline & GitHub Webhook Automation',
    category: 'CI/CD Automation',
    duration: '30 mins',
    mentorNote: 'This is where all components unite. With GitHub Webhooks configured, the moment a developer runs git push, GitHub notifies Jenkins, which runs tests, audits code, builds the container, and updates Kubernetes automatically!',
    executionLocation: 'Jenkins Web UI',
    prerequisites: ['Jenkins plugins installed', 'GitHub Webhook configured', 'Credentials created in Jenkins'],
    commands: [
      {
        label: 'Test GitHub Webhook Connectivity',
        description: 'Inspect webhook payload and response code on GitHub.',
        code: `# In GitHub Repo > Settings > Webhooks > Add Webhook:\n# Payload URL: http://<EC2-PUBLIC-IP>:8080/github-webhook/\n# Content type: application/json\n# Trigger: Just the push event`,
        expectedOutput: `GitHub sends ping payload -> Jenkins responds HTTP 200 OK (Green checkmark)`
      }
    ],
    pitfalls: [
      {
        error: 'GitHub Webhook delivery failed with HTTP 403 No valid crumb was included in the request',
        cause: 'Jenkins CSRF protection blocking anonymous webhook payloads.',
        solution: 'Ensure GitHub Integration Plugin is installed and URL has the trailing slash: http://<EC2-IP>:8080/github-webhook/.'
      },
      {
        error: 'Jenkins build fails at stage Push Image: docker: command not found',
        cause: 'Jenkins system path does not include /usr/bin/docker.',
        solution: 'In Jenkins > Manage Jenkins > System > Global properties > Environment variables, add PATH = $PATH:/usr/bin:/usr/local/bin.'
      }
    ],
    verificationSteps: [
      'Pushing code to GitHub automatically starts a Jenkins build',
      'Pipeline stages execute sequentially in Jenkins Blue Ocean / Stage View',
      'All stages (Checkout, Test, Sonar, Quality Gate, Docker Build, Push, K8s Deploy) show green'
    ]
  },
  {
    id: 7,
    slug: 'rolling-update-verification',
    title: 'Zero-Downtime Rolling Update & Error Resilience Verification',
    category: 'Production Verification',
    duration: '20 mins',
    mentorNote: 'Notice Kubernetes rolling updates: maxUnavailable=0 guarantees old pods keep answering traffic while new pods spin up. Traffic is routed to new pods only when readinessProbe returns 200 OK.',
    executionLocation: 'AWS EC2 Terminal',
    prerequisites: ['Pipeline successfully executed once', 'Browser open to NodePort 30080'],
    commands: [
      {
        label: 'Watch Pods During Rolling Deployment',
        description: 'Observe Kubernetes terminate old pods only AFTER new pods are healthy.',
        code: `kubectl get pods -l app=devops-java-app -w`,
        expectedOutput: `devops-java-app-68c4d9bd6-8f2kx   1/1   Running   0   5m\ndevops-java-app-68c4d9bd6-px94m   1/1   Running   0   5m\ndevops-java-app-79f5f8ce4-ab12c   0/1   Pending   0   0s\ndevops-java-app-79f5f8ce4-ab12c   1/1   Running   0   35s\ndevops-java-app-68c4d9bd6-8f2kx   1/1   Terminating 0 6m`
      },
      {
        label: 'Test Application Accessibility from External Browser / Curl',
        description: 'Verify public accessibility through AWS EC2 public IP.',
        code: `curl -i http://<YOUR-EC2-PUBLIC-IP>:30080/api/v1/info`,
        expectedOutput: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "application": "End-to-End DevOps Java Microservice",\n  "status": "UP",\n  "version": "1.0.0",\n  "hostname": "devops-java-app-79f5f8ce4-ab12c"\n}`
      }
    ],
    pitfalls: [
      {
        error: 'NodePort 30080 connection refused from external browser',
        cause: 'AWS Security Group is missing an inbound rule for Custom TCP port 30080.',
        solution: 'Open AWS EC2 Management Console > Security Groups > Edit Inbound Rules > Add Custom TCP Port 30080 from Anywhere (0.0.0.0/0).'
      }
    ],
    verificationSteps: [
      'Application responds on http://<EC2-PUBLIC-IP>:30080/api/v1/info',
      'Deployment rollout status completes with zero failures',
      'Zero downtime observed when updating application code'
    ]
  }
];

export const TROUBLESHOOTING_DATABASE: TroubleshootingItem[] = [
  {
    id: 'err-1',
    category: 'Docker',
    errorSnippet: 'dial unix /var/run/docker.sock: connect: permission denied',
    scenario: 'Jenkins pipeline fails during stage "Docker Image Build" or "Push Image".',
    rootCause: 'The user under which Jenkins daemon runs (jenkins) does not belong to the docker Linux group.',
    resolutionCommands: `sudo usermod -aG docker jenkins\nsudo chmod 666 /var/run/docker.sock\nsudo systemctl restart jenkins`,
    preventionTip: 'Always include the usermod command in your initial server setup script.'
  },
  {
    id: 'err-2',
    category: 'SonarQube',
    errorSnippet: 'SonarQube server [SonarQube-Server] can not be reached',
    scenario: 'Jenkins fails in stage "SonarQube Analysis" with java.net.ConnectException.',
    rootCause: 'SonarQube container exited due to memory constraints, or wrong IP was entered in Jenkins.',
    resolutionCommands: `docker ps -a | grep sonarqube\nsudo sysctl -w vm.max_map_count=262144\ndocker restart sonarqube`,
    preventionTip: 'Verify SonarQube is accessible at http://<server-ip>:9000 before running the Jenkins pipeline.'
  },
  {
    id: 'err-3',
    category: 'Kubernetes',
    errorSnippet: 'CrashLoopBackOff / OOMKilled (Exit Code 137)',
    scenario: 'Kubernetes pod repeatedly restarts every few seconds.',
    rootCause: 'Container memory exceeded resource limits (512Mi) or JVM heap memory was not constrained.',
    resolutionCommands: `kubectl describe pod <pod-name>\n# Fix JVM flags in Dockerfile:\nENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"`,
    preventionTip: 'Always use -XX:+UseContainerSupport in Dockerfile when running Java on Kubernetes.'
  },
  {
    id: 'err-4',
    category: 'Jenkins',
    errorSnippet: 'Quality Gate status is FAILED. Code bugs, vulnerabilities, or coverage criteria violated',
    scenario: 'Pipeline terminates at stage 4 with error abortPipeline: true.',
    rootCause: 'SonarQube detected bugs, critical code smells, or security hotspots exceeding the threshold.',
    resolutionCommands: `# View report at SonarQube dashboard\n# Fix identified bugs in Java controller/service\n# Push fix to GitHub to re-trigger build`,
    preventionTip: 'Run "mvn sonar:sonar" locally before pushing major changes.'
  },
  {
    id: 'err-5',
    category: 'AWS',
    errorSnippet: 'curl: (7) Failed to connect to <EC2-PUBLIC-IP> port 30080: Connection timed out',
    scenario: 'Application is running inside Kubernetes, but external users cannot load the web page.',
    rootCause: 'AWS EC2 Security Group inbound rule for port 30080 is missing.',
    resolutionCommands: `# In AWS Console > EC2 > Security Groups:\n# Add Inbound Rule -> Custom TCP -> Port Range: 30080 -> Source: 0.0.0.0/0`,
    preventionTip: 'Double check Security Group rules for all services (8080, 9000, 30080).'
  }
];

export const INTERVIEW_QUESTIONS: InterviewQA[] = [
  {
    id: 'q-1',
    category: 'Kubernetes',
    difficulty: 'Fresher',
    question: 'What is the difference between a Liveness Probe and a Readiness Probe in Kubernetes?',
    mentorAnswer: 'A Liveness Probe checks if the application container is still alive and running. If it fails, Kubernetes kills the pod and restarts a fresh container according to restartPolicy. A Readiness Probe checks if the application is ready to accept incoming traffic (e.g. database connected, caches warmed). If it fails, Kubernetes stops sending user traffic from the Service to that pod, but does NOT kill or restart it.',
    keyPhrases: ['Liveness = Restart on failure', 'Readiness = Remove from Service routing', 'Zero-downtime rolling deployments']
  },
  {
    id: 'q-2',
    category: 'Docker',
    difficulty: 'Fresher',
    question: 'Why do we use Multi-Stage Docker builds for Java applications?',
    mentorAnswer: 'In traditional single-stage builds, the final Docker image contains the full JDK (compiler, build tools, Maven/Gradle, cached dependencies), resulting in images exceeding 800MB-1GB. Multi-stage builds separate the build environment from the runtime environment. Stage 1 compiles the application using Maven and JDK. Stage 2 copies ONLY the packaged JAR into a stripped-down Alpine JRE runtime (150MB-180MB). This minimizes attack surface, removes build tools from production, and drastically speeds up image pull times in Kubernetes.',
    keyPhrases: ['Reduced image size by 70-80%', 'Enhanced security (minimal attack surface)', 'No compiler tools in production']
  },
  {
    id: 'q-3',
    category: 'CI/CD & Jenkins',
    difficulty: 'Junior',
    question: 'How does GitHub Webhook communicate with Jenkins, and how do you secure it?',
    mentorAnswer: 'When a developer pushes code to GitHub, GitHub sends an HTTP POST request containing JSON event data to the Jenkins endpoint (http://jenkins-server:8080/github-webhook/). Jenkins validates the repository payload, matches it to configured pipeline jobs, and immediately triggers the build. To secure it in production, we configure a Secret Token in the GitHub Webhook settings, which GitHub signs via HMAC SHA-256 header (X-Hub-Signature-256), and Jenkins validates before accepting execution.',
    keyPhrases: ['Event-driven automated triggers', 'HMAC SHA-256 payload signing', 'Zero manual build intervention']
  },
  {
    id: 'q-4',
    category: 'Code Quality',
    difficulty: 'Fresher',
    question: 'What is a SonarQube Quality Gate and what happens when it fails in a Jenkins pipeline?',
    mentorAnswer: 'A Quality Gate is a set of measurable threshold criteria (e.g., 0 Blocker/Critical bugs, < 3% duplicated code, > 80% test coverage) that new code must pass before reaching production. In our Jenkinsfile, we use waitForQualityGate(abortPipeline: true). When SonarQube completes analysis, it evaluates the Quality Gate and sends a webhook callback to Jenkins. If the status is NOT OK, the pipeline immediately halts, preventing Docker images from being built or deployed to Kubernetes.',
    keyPhrases: ['Fails build early (Shift-Left Security)', 'Webhook callback to Jenkins', 'Enforces clean code standards']
  },
  {
    id: 'q-5',
    category: 'Kubernetes',
    difficulty: 'Junior',
    question: 'How did you achieve zero downtime during deployment in this project?',
    mentorAnswer: 'We achieved zero downtime through three coordinated mechanisms: 1) Kubernetes RollingUpdate strategy with maxUnavailable: 0 and maxSurge: 1, ensuring old pods stay active while new pods spin up. 2) Readiness probes configured on /api/v1/ready with initialDelaySeconds: 30, preventing Kubernetes from routing traffic to new pods until Spring Boot is fully initialized. 3) Running at least 2 replica pods so that traffic is gracefully shifted without dropping connections.',
    keyPhrases: ['RollingUpdate with maxUnavailable: 0', 'Readiness Probes hold traffic', 'Multi-replica high availability']
  }
];

export const CODE_REPOSITORY_FILES = [
  {
    filename: 'Jenkinsfile',
    path: 'Jenkinsfile',
    language: 'groovy',
    description: 'Production declarative multi-stage CI/CD pipeline script.'
  },
  {
    filename: 'Dockerfile',
    path: 'Dockerfile',
    language: 'dockerfile',
    description: 'Multi-stage production build with non-root user and Alpine JRE.'
  },
  {
    filename: 'deployment.yaml',
    path: 'k8s/deployment.yaml',
    language: 'yaml',
    description: 'Kubernetes deployment with rolling update and health probes.'
  },
  {
    filename: 'service.yaml',
    path: 'k8s/service.yaml',
    language: 'yaml',
    description: 'Kubernetes NodePort service routing port 30080 to container port 8080.'
  },
  {
    filename: 'configmap.yaml',
    path: 'k8s/configmap.yaml',
    language: 'yaml',
    description: 'Kubernetes environment configuration map.'
  },
  {
    filename: 'pom.xml',
    path: 'pom.xml',
    language: 'xml',
    description: 'Maven build descriptor with Spring Boot Actuator and Sonar plugin.'
  },
  {
    filename: 'setup-ec2-prerequisites.sh',
    path: 'scripts/setup-ec2-prerequisites.sh',
    language: 'bash',
    description: 'One-click automated Ubuntu 22.04 LTS server provisioning script.'
  },
  {
    filename: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Professional GitHub documentation with architecture and instructions.'
  }
];
