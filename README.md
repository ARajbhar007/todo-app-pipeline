# Todo Application - DevOps Pipeline Project

A production-grade Todo application with complete CI/CD pipeline using Jenkins and Kubernetes deployment.

## 📁 Project Structure

```
pipeline/
├── src/
│   ├── server.js              # Express server entry point
│   ├── routes/
│   │   ├── todoRoutes.js      # Todo CRUD API routes
│   │   └── healthRoutes.js    # Health check endpoints
│   └── utils/
│       └── storage.js         # File-based storage utility
├── public/
│   ├── index.html             # Frontend HTML
│   ├── css/
│   │   └── style.css          # Styles
│   └── js/
│       └── app.js             # Frontend JavaScript
├── k8s/
│   ├── namespace.yaml         # Kubernetes namespace
│   ├── configmap.yaml         # Application configuration
│   ├── persistent-volume.yaml # PV and PVC for data persistence
│   ├── deployment.yaml        # Deployment with ReplicaSets
│   ├── service.yaml           # NodePort service
│   ├── deploy.sh              # Deployment script
│   └── cleanup.sh             # Cleanup script
├── Dockerfile                 # Multi-stage production Dockerfile
├── .dockerignore              # Docker ignore file
├── Jenkinsfile                # CI/CD Pipeline
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

### Docker Build

```bash
# Build image
docker build -t todo-app:latest .

# Run container
docker run -p 3000:3000 -v todo-data:/app/data todo-app:latest
```

### Kubernetes Deployment

```bash
# Deploy all resources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Or use the deploy script
chmod +x k8s/deploy.sh
./k8s/deploy.sh

# Access at http://<node-ip>:30080
```

## 🔧 Jenkins Pipeline Setup

### Prerequisites

1. **Jenkins** with plugins:
   - Docker Pipeline
   - Kubernetes CLI
   - Pipeline

2. **Docker Registry** (local or remote)

3. **Kubernetes Cluster** with kubectl configured

### Pipeline Configuration

1. Create a new Pipeline job in Jenkins
2. Configure SCM to point to your repository
3. Set the script path to `Jenkinsfile`
4. Update environment variables in `Jenkinsfile`:
   - `DOCKER_REGISTRY`: Your Docker registry URL
   - Adjust credentials as needed

### Pipeline Stages

| Stage | Description |
|-------|-------------|
| Checkout | Clone source code from SCM |
| Install Dependencies | Run `npm ci` for clean install |
| Code Quality | Parallel lint and security audit |
| Build Docker Image | Build production Docker image |
| Push to Registry | Push tagged images to registry |
| Deploy to Kubernetes | Apply K8s manifests and update deployment |
| Verify Deployment | Check pods, services, and deployment status |
| Health Check | Verify application is responding |

## 📋 API Endpoints

### Todos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| GET | `/api/todos/:id` | Get single todo |
| POST | `/api/todos` | Create new todo |
| PUT | `/api/todos/:id` | Update todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completion |
| DELETE | `/api/todos/:id` | Delete todo |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Detailed health info |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |

## ⚙️ Kubernetes Resources

### Deployment Features
- **3 Replicas** for high availability
- **Rolling Updates** with zero downtime
- **Resource Limits** (128Mi-256Mi memory, 100m-500m CPU)
- **Liveness & Readiness Probes** for health monitoring
- **Non-root User** for security

### Persistent Storage
- **PersistentVolume**: 1Gi hostPath storage
- **PersistentVolumeClaim**: Bound to deployment
- **Retain Policy**: Data preserved on pod restart

### Service
- **Type**: NodePort
- **Port**: 30080 (external) → 80 (service) → 3000 (container)

## 🔒 Security Features

- Non-root container user (UID 1001)
- Helmet.js security headers
- No privilege escalation
- Production-only dependencies in container
- Health checks for automatic recovery

## 📊 Monitoring

The application exposes health endpoints for:
- **Liveness**: Is the application running?
- **Readiness**: Is the application ready to serve traffic?
- **Metrics**: Memory usage, uptime, system info

## 🧹 Cleanup

```bash
# Remove all Kubernetes resources
chmod +x k8s/cleanup.sh
./k8s/cleanup.sh

# Or manually
kubectl delete namespace todo-app
kubectl delete pv todo-app-pv
```

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| DATA_DIR | ./data | Data storage directory |
| APP_VERSION | 1.0.0 | Application version |

## 📄 License

MIT License
