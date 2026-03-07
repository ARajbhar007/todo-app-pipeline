pipeline {
    agent any
    tools {
        jdk 'jdk'
        nodejs 'nodejs'
    }
    parameters {
        booleanParam(name: 'DEPLOY_TO_K8S', defaultValue: false, description: 'Apply Kubernetes manifests after image push')
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        AWS_ACCOUNT_ID = credentials('ACCOUNT_ID')
        AWS_ECR_REPO_NAME = credentials('ECR_REPO_TODO')
        AWS_DEFAULT_REGION = 'ap-south-1'
        REPOSITORY_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/"
    }
    stages {
        stage('Cleaning Workspace') {
            steps {
                cleanWs()
            }
        }
        stage('Checkout from Git') {
            steps {
                git branch: 'main', credentialsId: 'GITHUB', url: 'https://github.com/ARajbhar007/todo-app-pipeline.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Sonarqube Analysis') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            $SCANNER_HOME/bin/sonar-scanner \
                            -Dsonar.projectKey=app \
                            -Dsonar.projectName=app \
                            -Dsonar.sources=. \
                            -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }
        stage('Quality Check') {
            steps {
                script {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonar-token'
                }
            }
        }
        stage('Trivy File Scan') {
            steps {
                sh 'trivy fs . > trivyfs.txt'
            }
        }
        stage('Docker Image Build') {
            steps {
                script {
                    sh 'docker system prune -f'
                    sh 'docker container prune -f'
                    sh 'docker build -t ${AWS_ECR_REPO_NAME} .'
                }
            }
        }
        stage('ECR Image Pushing') {
            steps {
                script {
                    sh 'aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${REPOSITORY_URI}'
                    sh 'docker tag ${AWS_ECR_REPO_NAME} ${REPOSITORY_URI}${AWS_ECR_REPO_NAME}:${BUILD_NUMBER}'
                    sh 'docker push ${REPOSITORY_URI}${AWS_ECR_REPO_NAME}:${BUILD_NUMBER}'
                }
            }
        }
        stage('Trivy Image Scan') {
            steps {
                sh 'trivy image ${REPOSITORY_URI}${AWS_ECR_REPO_NAME}:${BUILD_NUMBER} > trivyimage.txt'
            }
        }
        stage('Update Deployment File') {
            environment {
                GIT_REPO_NAME = "todo-app-pipeline"
                GIT_USER_NAME = "ARajbhar007"
            }
            steps {
                withCredentials([string(credentialsId: 'github', variable: 'GITHUB_TOKEN')]) {
                    script {
                        sh 'git config user.email "arajbhar140@gmail.com"'
                        sh "git config user.name '${GIT_USER_NAME}'"

                        // Replace image tag in deployment.yaml with the current BUILD_NUMBER.
                        // Uses -E (ERE) so that + means "one or more" non-whitespace characters.
                        sh "sed -i -E 's|todo-app:[^[:space:]]+|todo-app:${BUILD_NUMBER}|g' k8s/deployment.yaml"

                        sh 'git add k8s/deployment.yaml'
                        def commitStatus = sh(
                            script: "git commit -m 'Update deployment image to version ${BUILD_NUMBER}'",
                            returnStatus: true
                        )
                        if (commitStatus != 0) {
                            echo "No changes to commit"
                        }

                        sh "git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME} HEAD:main"
                    }
                }
            }
        }
        stage('Deploy to Kubernetes') {
            when {
                expression { return params.DEPLOY_TO_K8S == true }
            }
            steps {
                script {
                    sh 'kubectl apply -f k8s/'
                    sh "kubectl set image deployment/todo-app todo-app=${REPOSITORY_URI}${AWS_ECR_REPO_NAME}:${BUILD_NUMBER} -n todo-app"
                    sh 'kubectl rollout status deployment/todo-app -n todo-app --timeout=120s'
                }
            }
        }
    }
    post {
        always {
            echo "========== Pipeline Execution Completed =========="
            archiveArtifacts artifacts: 'trivyfs.txt,trivyimage.txt', allowEmptyArchive: true
        }
        success {
            echo "✅ Pipeline completed successfully!"
            echo "📦 Image pushed: ${REPOSITORY_URI}${AWS_ECR_REPO_NAME}:${BUILD_NUMBER}"
            echo "🚀 Deployment file updated - ArgoCD will sync automatically"
        }
        failure {
            echo "❌ Pipeline failed! Check the logs for details."
        }
    }
}
