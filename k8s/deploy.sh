#!/bin/bash
# deploy.sh - Script to deploy Todo App to AWS EKS

set -e

# Configuration - Update these values
AWS_REGION="${AWS_REGION:-ap-south-1}"
EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-my-eks-cluster}"
NAMESPACE="todo-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Deploying Todo App to AWS EKS"
echo "========================================"
echo "Region: ${AWS_REGION}"
echo "Cluster: ${EKS_CLUSTER_NAME}"
echo "========================================"

# Configure kubectl for EKS
echo "Configuring kubectl for EKS..."
aws eks update-kubeconfig --name ${EKS_CLUSTER_NAME} --region ${AWS_REGION}

# Create namespace first
echo "Creating namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"

# Apply ConfigMap
echo "Applying ConfigMap..."
kubectl apply -f "${SCRIPT_DIR}/configmap.yaml"

# Apply ServiceAccount and RBAC
echo "Applying ServiceAccount..."
kubectl apply -f "${SCRIPT_DIR}/serviceaccount.yaml"

# Apply PersistentVolumeClaim (EBS)
echo "Applying Persistent Storage (EBS)..."
kubectl apply -f "${SCRIPT_DIR}/persistent-volume.yaml"

# Apply Deployment
echo "Applying Deployment..."
kubectl apply -f "${SCRIPT_DIR}/deployment.yaml"

# Apply Service
echo "Applying Service..."
kubectl apply -f "${SCRIPT_DIR}/service.yaml"

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/todo-app -n ${NAMESPACE} --timeout=180s

# Display deployment info
echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
kubectl get all -n ${NAMESPACE}

# Get access information
echo ""
echo "========================================"
echo "Access Information"
echo "========================================"
NODE_PORT=$(kubectl get svc todo-app-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].nodePort}')
echo "NodePort: ${NODE_PORT}"
echo ""
echo "Get Node IPs with:"
echo "  kubectl get nodes -o wide"
echo ""
echo "Access the application at: http://<NODE_EXTERNAL_IP>:${NODE_PORT}"
