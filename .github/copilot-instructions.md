# Copilot Instructions for Todo App Pipeline

## Architecture Overview

This is a **production-grade Node.js/Express Todo API** with a complete CI/CD pipeline for AWS EKS deployment.

**Data Flow:** Frontend (vanilla JS) → Express API (`/api/todos`) → File-based JSON storage (`data/todos.json`)

**Key Architectural Decisions:**
- File-based persistence instead of database for simplicity (uses Kubernetes PersistentVolume in prod)
- Multi-stage Docker build with non-root user (UID 1001) for security
- Jenkins GitOps: Pipeline updates `k8s/deployment.yaml` image tag and pushes to trigger ArgoCD/kubectl apply

## Project Structure

| Path | Purpose |
|------|---------|
| `src/server.js` | Express entry point, middleware setup, graceful shutdown |
| `src/routes/todoRoutes.js` | CRUD endpoints using UUID for IDs |
| `src/routes/healthRoutes.js` | K8s probes: `/live`, `/ready`, `/` (detailed) |
| `src/utils/storage.js` | Synchronous file I/O for `todos.json` |
| `k8s/*.yaml` | Kubernetes manifests (namespace, deployment, service, PVC) |
| `Jenkinsfile` | CI/CD: npm install → SonarQube → Trivy → ECR push → GitOps update |

## Developer Commands

```bash
npm run dev      # Start with nodemon (hot reload)
npm test         # Jest with coverage report
npm run lint     # ESLint on src/
npm start        # Production mode
```

## Code Patterns

**API Routes:** Follow existing pattern in [todoRoutes.js](src/routes/todoRoutes.js)
```javascript
router.get('/:id', (req, res) => {
  const todos = readTodos();
  const todo = todos.find(t => t.id === req.params.id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});
```

**Todo Object Schema:**
```javascript
{ id: 'uuid', title: 'string', description: 'string', completed: boolean, createdAt: 'ISO', updatedAt: 'ISO' }
```

**Storage:** Use `readTodos()`/`writeTodos(todos)` from `src/utils/storage.js` - always read-modify-write full array.

**Health Endpoints:** Add K8s-compatible probes. Liveness = app running, Readiness = dependencies ready (check `DATA_DIR` access).

## Testing

Tests use **supertest** against the Express app instance exported from `src/server.js`:
```javascript
const request = require('supertest');
const app = require('../src/server');
// Tests run against actual app, modifying data/todos.json
```

Place tests in `tests/*.test.js`. The server exports `app` for testing without starting the listener.

## Docker & Kubernetes

**Environment Variables:**
- `PORT` (default: 3000)
- `DATA_DIR` (default: `./data`) - must be writable, mapped to PVC in K8s
- `NODE_ENV` - set to `production` in container

**Container runs as non-root (UID 1001).** Ensure file permissions in volumes.

**K8s Deployment:** Image tag in `k8s/deployment.yaml` is updated by Jenkins using regex replacement—maintain the `image: ACCOUNT_ID.dkr.ecr...todo-app:TAG` format.

## CI/CD Pipeline (Jenkinsfile)

Pipeline stages: Clean → Checkout → npm install → SonarQube → Trivy FS scan → Docker build → ECR push → Trivy image scan → Update deployment.yaml → Git push

**Required Jenkins credentials:** `ACCOUNT_ID`, `ECR_REPO_TODO`, `GITHUB`, `github` (PAT), `sonar-token`

When modifying pipeline, preserve the GitOps pattern: pipeline updates `deployment.yaml` with `BUILD_NUMBER` tag and commits back to repo.
