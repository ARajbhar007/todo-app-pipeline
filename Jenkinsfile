pipeline {
    agent any
    tools {
        jdk 'jdk'
        nodejs 'nodejs'
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
                            -Dsonar.host.url=http://13.127.106.232:9000 \
                            -Dsonar.login=sqp_cda8cbd28ea40d94cec19ad185e4cd6a02ac22c9
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
                dir('k8s') {
                    withCredentials([string(credentialsId: 'github', variable: 'GITHUB_TOKEN')]) {
                        script {
                            sh '''
                                git config user.email "arajbhar140@gmail.com"
                                git config user.name "ARajbhar007"
                            '''

                            // Replace image tag with BUILD_NUMBER
                            sh '''
                                sed -i 's|todo-app:[^ ]*|todo-app:''' + BUILD_NUMBER + '''|g' deployment.yaml
                            '''

                            // Commit and push changes
                            sh '''
                                git add deployment.yaml
                                git commit -m "Update deployment Image to version ''' + BUILD_NUMBER + '''" || echo "No changes to commit"
                                git remote set-url origin https://ARajbhar007:${GITHUB_TOKEN}@github.com/ARajbhar007/todo-app-pipeline.git
                                git push origin HEAD:main
                            '''
                        }
                    }
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
