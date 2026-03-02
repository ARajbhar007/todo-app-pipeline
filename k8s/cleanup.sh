#!/bin/bash
# cleanup.sh - Script to remove all Kubernetes resources

set -e

NAMESPACE="todo-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Cleaning up Todo App from Kubernetes"
echo "========================================"

# Delete in reverse order
echo "Deleting Service..."
kubectl delete -f "${SCRIPT_DIR}/service.yaml" --ignore-not-found

echo "Deleting Deployment..."
kubectl delete -f "${SCRIPT_DIR}/deployment.yaml" --ignore-not-found

echo "Deleting Persistent Storage..."
kubectl delete -f "${SCRIPT_DIR}/persistent-volume.yaml" --ignore-not-found

echo "Deleting ConfigMap..."
kubectl delete -f "${SCRIPT_DIR}/configmap.yaml" --ignore-not-found

echo "Deleting Namespace..."
kubectl delete -f "${SCRIPT_DIR}/namespace.yaml" --ignore-not-found

echo ""
echo "========================================"
echo "Cleanup Complete!"
echo "========================================"
