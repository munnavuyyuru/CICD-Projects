<h1 align="center">TaskFlow</h1>
<p align="center">Human-First Task Management -- CI/CD Pipeline on Amazon EKS</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white">
  <img src="https://img.shields.io/badge/EKS-FF9900?logo=amazoneks&logoColor=white">
  <img src="https://img.shields.io/badge/SonarQube-4E9BCD?logo=sonarqube&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white">
  <img src="https://img.shields.io/badge/License-MIT-green">
</p>

---

## Table of Contents

1. Overview
2. Architecture
3. CI/CD Pipeline
4. Prerequisites
5. Quick Start (Create)
6. Destroy (Clean Up)
7. Cost Reference
8. Tech Stack
9. Resolved Issues
10. License

---

## Overview

TaskFlow is a task management application built with React + Vite (frontend) and Express + TypeScript (backend), using Supabase for database and authentication. The project is structured as an npm workspaces monorepo with shared types.

The key deliverable is a fully automated CI/CD pipeline using GitHub Actions (self-hosted runner) that builds, tests, scans, and deploys the application to Amazon EKS with zero manual intervention after the initial cluster setup.

Monorepo structure:

```
project-2-task-flow/
├── apps/
│   ├── api/              Express + TypeScript (port 4000)
│   └── web/              React + Vite (port 80)
├── packages/
│   └── shared/           Shared types, utilities
├── k8s/                  Kubernetes manifests
│   ├── namespace.yaml
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   ├── web-deployment.yaml
│   ├── web-service.yaml
│   └── ingress.yaml
├── .github/workflows/    CI/CD pipeline definition
├── docker-compose.yml    Local development
└── sonar-project.properties
```

---

## Architecture

```mermaid
graph TB
    subgraph DEV["Developer"]
        GIT[git push]
    end

    subgraph GH["GitHub Actions (Self-Hosted Runner)"]
        direction TB
        BUILD[build + typecheck + lint]
        TEST[test]
        GITLEAKS[gitleaks]
        SONAR[sonarqube]
        DOCKER[docker-build]
        TRIVY[trivy scan]
        PUSH[push to Docker Hub]
        DEPLOY[deploy-to-eks]
        BUILD --> TEST --> GITLEAKS --> SONAR --> DOCKER --> TRIVY --> PUSH --> DEPLOY
    end

    subgraph DH["Docker Hub"]
        API_IMAGE[bhargav072/taskflow-api]
        WEB_IMAGE[bhargav072/taskflow-web]
    end

    subgraph EKS["Amazon EKS"]
        subgraph NS["Namespace: taskflow"]
            INGRESS[nginx-ingress / ALB]
            WEB_POD[web:80 / React + Vite]
            API_POD[api:4000 / Express]
            INGRESS -->|"/"| WEB_POD
            INGRESS -->|"/api"| API_POD
        end
    end

    subgraph SUPABASE["Supabase Cloud"]
        PG[(PostgreSQL)]
        AUTH[Auth Service]
    end

    subgraph SQ_VM["SonarQube Server"]
        SQ[SonarQube Community]
    end

    GIT --> BUILD
    DOCKER -->|docker push| DH
    DEPLOY -->|kubectl apply -f k8s/| INGRESS
    API_POD -->|env vars| SUPABASE
    WEB_POD -->|axios| API_POD
    SONAR -->|SONAR_HOST_URL| SQ
```

Data Flow:
1. Developer pushes code to GitHub
2. Self-hosted runner executes 8-stage pipeline (build -> test -> gitleaks -> sonarqube -> docker-build -> trivy -> push -> deploy)
3. Docker images are pushed to Docker Hub with version tag + latest
4. EKS deployment applies Kubernetes manifests and updates pod images
5. nginx-ingress controller (backed by AWS ALB) routes traffic to web (/) and api (/api)
6. API connects to Supabase Cloud for database and authentication

---

## CI/CD Pipeline

```mermaid
graph LR
    A[git push] --> B[build]
    B --> C[test]
    C --> D[gitleaks]
    D --> E[sonarqube]
    E --> F[docker-build]
    F --> G[trivy]
    G --> H[push-dockerhub]
    H --> I[deploy-to-eks]

    style A fill:#e1f5fe,stroke:#0288d1
    style I fill:#c8e6c9,stroke:#388e3c
```

| Stage | Job | Tool/Action | Purpose |
|-------|-----|-------------|---------|
| 1 | build | actions/setup-node@v4 | npm ci, typecheck, lint |
| 2 | test | vitest | Unit + integration tests |
| 3 | gitleaks | gitleaks/gitleaks-action@v2 | Scan git history for secrets |
| 4 | sonarqube | sonarsource/sonarqube-scan-action@v5 | Code quality analysis (self-hosted) |
| 5 | docker-build | docker/build-push-action@v6 | Multi-stage image build |
| 6 | trivy | aquasecurity/trivy-action@v0.35.0 | Vulnerability scan (HIGH, CRITICAL) |
| 7 | push-to-dockerhub | docker/login-action@v3 | Push version tag + latest to Docker Hub |
| 8 | deploy-to-eks | aws-actions/configure-aws-credentials@v4 | kubectl apply + set image on EKS |

Triggers:
- Code pushes and PRs trigger Stages 1-6 (build through scan)
- Docker push and EKS deploy (Stages 7-8) run only on manual workflow_dispatch from GitHub UI
- User enters a version string (e.g., v1.1) which becomes the Docker image tag

---

## Prerequisites

Local Machine (for cluster setup):
- Node 24+
- Docker
- AWS CLI v2
- eksctl
- kubectl
- Helm v3
- Docker Hub account (username: bhargav072)

AWS Resources:
- EKS cluster: taskflow-cluster (ap-south-1)
- OIDC IAM role: github-actions-eks-role with AmazonEKSClusterPolicy and inline eks:DescribeCluster + eks:AccessKubernetesApi
- EKS access entry for the OIDC role with AmazonEKSClusterAdminPolicy

Self-Hosted Runner (Ubuntu VM):
- Registered in GitHub -> Settings -> Actions -> Runners
- Installed: AWS CLI v2, kubectl, Docker
- Docker access without sudo

External Services:
- Supabase Cloud project (URL + anon key + service role key)
- SonarQube Community (Docker container on separate VM)
- Docker Hub access token

---

## Quick Start (Create)

### Step 1: Create EKS Cluster

```bash
eksctl create cluster --name taskflow-cluster --region ap-south-1 \
  --nodegroup-name standard-workers --node-type t3.medium --nodes 2 --managed
```

### Step 2: Setup Kubernetes Namespace and Secrets

```bash
kubectl create ns taskflow

kubectl create secret generic supabase-secret -n taskflow \
  --from-literal=supabase-url=https://njeyfigatkewnmcbkajg.supabase.co \
  --from-literal=supabase-service-role-key=<service-role-key> \
  --from-literal=supabase-anon-key=<anon-key>
```

### Step 3: Install nginx-ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

### Step 4: Deploy Application

```bash
kubectl apply -f k8s/
```

### Step 5: Verify Deployment

```bash
kubectl get pods -n taskflow
kubectl get ingress -n taskflow
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath="{.status.loadBalancer.ingress[0].hostname}"
```

### Step 6: Trigger Pipeline Release

Go to GitHub UI -> Actions -> Task Flow -> Run workflow -> enter version (e.g., v1.1, v1.2).

The pipeline runs all 8 stages automatically and deploys to EKS.

---

## Destroy (Clean Up)

To avoid ongoing AWS costs, tear down the entire stack:

```bash
# 1. Delete Kubernetes resources
kubectl delete -f k8s/

# 2. Uninstall nginx-ingress
helm uninstall ingress-nginx -n ingress-nginx
kubectl delete ns ingress-nginx

# 3. Delete namespace
kubectl delete ns taskflow

# 4. Delete EKS cluster (removes nodes, VPC, subnets, load balancers, EBS volumes)
eksctl delete cluster --name taskflow-cluster --region ap-south-1

# 5. Verify cleanup
kubectl config get-contexts
```

Checklist Before Destroy:
- Docker Hub images pushed (latest version saved externally)
- SonarQube data backed up (if needed)
- GitHub runner deregistered (Settings -> Actions -> Runners -> Remove)
- EBS snapshots taken (if persistent data needed)

---

## Cost Reference

| Resource | Monthly Cost | Reclaim Strategy |
|----------|-------------|------------------|
| EKS cluster (2 x t3.medium) | ~$75 | eksctl delete cluster |
| nginx-ingress ALB | ~$18 | Auto-deleted with cluster |
| SonarQube VM (t3.medium) | ~$30 | Stop or terminate |
| EBS volumes (gp3) | ~$1 | Auto-deleted |
| Total | ~$124 | |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Express, TypeScript, Zod validation |
| Shared | TypeScript types and utilities (npm workspace) |
| Database | Supabase (PostgreSQL, cloud-hosted) |
| Auth | Supabase Auth |
| Container | Docker multi-stage builds (node:22-alpine) |
| CI/CD | GitHub Actions (self-hosted Ubuntu runner) |
| Secrets Scan | Gitleaks |
| Code Quality | SonarQube Community (self-hosted) |
| Vulnerability Scan | Trivy (HIGH, CRITICAL severity) |
| Image Registry | Docker Hub (bhargav072/taskflow-*) |
| Orchestration | Amazon EKS (Kubernetes) |
| Ingress | nginx-ingress controller (AWS ALB) |
| IaC/CLI | eksctl, kubectl, Helm, AWS CLI v2 |

---

## Resolved Issues

### 1. API Container Crash - ESM Module Imports

The API container exited immediately with `ERR_MODULE_NOT_FOUND` for `/app/apps/api/dist/config`. The compiled JavaScript used extensionless relative imports like `import { config } from './config'` while Node.js ESM mode strictly requires `.js` extension.

Root Cause: The TypeScript config used `moduleResolution: "bundler"` which outputs imports without extensions -- fine for bundlers like Vite, but Node.js runtime rejects them.

Solution: Replaced the `tsc` build with `tsup`, a bundler that produces a single-file ESM output with all dependencies resolved.

```
apps/api/package.json - added tsup to devDependencies
apps/api/Dockerfile - simplified to single-stage build

build command changed from: tsc
to: tsup src/index.ts --format esm --platform node --out-dir dist
```

---

### 2. API Container Crash - WebSocket Not Found

Supabase realtime client threw `Error: Node.js detected but native WebSocket not found` at startup.

Root Cause: The `@supabase/realtime-js` package requires Node.js 22+ for native WebSocket support, but the Docker image was using `node:20-alpine`.

Solution: Upgraded the base image from `node:20-alpine` to `node:22-alpine`.

```bash
# Dockerfile base image changed
FROM node:22-alpine
```

---

### 3. Web Container - nginx Host Not Found

nginx failed with `host not found in upstream "api"` and exited immediately.

Root Cause: nginx resolves upstream hostnames at startup time using static DNS. The API container had exited (from other errors), so Docker DNS had no record for "api". Even with a healthy API, a brief startup race could trigger this.

Solution: Added Docker's internal DNS resolver (`127.0.0.11`) and a dynamic upstream variable so nginx re-resolves at request time.

```nginx
resolver 127.0.0.11 valid=30s;

location /api {
    set $api_upstream http://api:4000;
    proxy_pass $api_upstream;
}
```

---

### 4. Web Container - Exit 127 Command Not Found

Web container exited with exit code 127 -- `npm: not found`.

Root Cause: The docker-compose file overrode the nginx CMD with `npm run dev -w apps/web`, but nginx:alpine has no Node.js runtime.

Solution: Removed the command override from docker-compose. The web container now uses its production CMD (`nginx -g daemon off;`), serving the pre-built static files from the multi-stage build.

---

### 5. Supabase Migration Failure

Local supabase/postgres container failed on migration with `ERROR: role "supabase_admin" does not exist`.

Root Cause: The supabase/postgres image requires a `supabase_admin` role for running extensions like pgcrypto, but the default postgres user doesn't have it.

Solution: Removed the local supabase service from docker-compose entirely. The application now connects directly to Supabase Cloud for database and authentication.

---

### 6. AWS CLI Not Found on Runner

The deploy job failed with `aws: command not found`.

Root Cause: The GitHub self-hosted runner VM did not have AWS CLI installed.

Solution: Installed AWS CLI v2 on the runner.

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
aws --version
```

---

### 7. OIDC Authentication Denied

The deploy job failed with `AccessDeniedException: User is not authorized to perform eks:DescribeCluster`.

Root Cause: The OIDC IAM role (`github-actions-eks-role`) only had `AmazonEKSClusterPolicy` attached, which does not include `eks:DescribeCluster` -- the permission needed by `aws eks update-kubeconfig`.

Solution: Created an inline IAM policy with the required permissions.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks:DescribeCluster",
                "eks:AccessKubernetesApi"
            ],
            "Resource": "*"
        }
    ]
}
```

---

### 8. EKS Access Entry Missing

OIDC authentication succeeded (IAM), but Kubernetes API calls returned forbidden.

Root Cause: The IAM role was not registered in EKS access entries, so Kubernetes had no mapping for the IAM principal.

Solution: Created an access entry and associated the cluster admin policy.

```bash
aws eks create-access-entry \
  --cluster-name taskflow-cluster \
  --principal-arn arn:aws:iam::505017489291:role/github-actions-eks-role \
  --region ap-south-1

aws eks associate-access-policy \
  --cluster-name taskflow-cluster \
  --principal-arn arn:aws:iam::505017489291:role/github-actions-eks-role \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region ap-south-1
```

---

### 9. OIDC Credentials Could Not Be Loaded

The `aws-actions/configure-aws-credentials` action returned `Could not load credentials from any providers`.

Root Cause: The workflow was missing the `id-token: write` permission, which is required for GitHub to issue an OIDC token to the runner.

Solution: Added the permissions block at the workflow level.

```yaml
permissions:
  id-token: write
  contents: read
```

---

### 10. kubectl Not Found on Runner

The deploy job failed with `kubectl: command not found`.

Root Cause: The self-hosted runner VM did not have kubectl installed.

Solution: Installed kubectl on the runner.

```bash
curl -O https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

---

### 11. Supabase Secret Already Exists

The deploy job step failed with `Error: failed to create secret secrets "supabase-secret" already exists`.

Root Cause: The `kubectl apply` command had a conflict with the existing secret's stored configuration.

Solution: Changed the command to properly quote the secret values.

```bash
kubectl create secret generic supabase-secret \
  -n taskflow \
  --from-literal=supabase-url="${{ secrets.SUPABASE_URL }}" \
  --from-literal=supabase-service-role-key="${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
  --from-literal=supabase-anon-key="${{ secrets.SUPABASE_ANON_KEY }}" \
  --dry-run=client -o yaml | kubectl apply -f -
```

---

### 12. Kubernetes Manifest Path Not Found

The deploy job failed with `error: the path "project-2-task-flow/k8s/" does not exist`.

Root Cause: The workflow had `defaults.run.working-directory: project-2-task-flow`, so `kubectl apply -f project-2-task-flow/k8s/` resolved to `project-2-task-flow/project-2-task-flow/k8s/` (double nesting).

Solution: Changed to a relative path that works within the configured working directory.

```bash
kubectl apply -f k8s/
```

---

### 13. SonarQube - sonar.projectKey Not Defined

The SonarQube scanner failed with `You must define the following mandatory properties for 'Unknown': sonar.projectKey`.

Root Cause: The scanner ran from the CI-CD repository root, but the `sonar-project.properties` file was inside the `project-2-task-flow/` subdirectory.

Solution: Added `projectBaseDir: project-2-task-flow` to the workflow action.

```yaml
- uses: sonarsource/sonarqube-scan-action@v5
  with:
    projectBaseDir: project-2-task-flow
```

---

### 14. SonarQube - Test Directory Not Found

SonarQube scanner failed with `The folder 'apps/web/tests' does not exist for 'taskflow'`.

Root Cause: The `sonar.tests` property listed `apps/web/tests` but no test files exist in the web app (tests are only in `apps/api/tests`).

Solution: Removed the non-existent directory from `sonar-project.properties`.

```
sonar.tests changed from: apps/api/tests,apps/web/tests
to: apps/api/tests
```

---

### 15. VITE Environment Variables Not Embedded

The built web application had undefined values for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at runtime.

Root Cause: Vite statically replaces `import.meta.env.VITE_*` at build time, not runtime. The Docker build never received these values.

Solution: Added `ARG` + `ENV` declarations in the Dockerfile and passed values via `build-args`.

```dockerfile
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

---

### 16. npm ci - tsup Missing From Lock File

Docker build failed with `Missing: tsup@8.5.1 from lock file`.

Root Cause: Added tsup to `package.json` but did not update `package-lock.json` before committing.

Solution: Ran `npm install` locally to regenerate the lock file, then committed the update.

```bash
npm install
git add package-lock.json
git commit -m "chore: update lockfile for tsup dependency"
```

---

### 17. Engine Warnings - Node 20 Deprecated for Supabase

Docker build produced warnings: `Unsupported engine: required { node: '>=22.0.0' }` for all @supabase-js packages.

Root Cause: Supabase SDK deprecated Node 20 support and requires Node 22+.

Solution: Same as issue #2 -- upgraded the base image to `node:22-alpine`. The warnings were resolved after the upgrade.

---

## License

MIT
