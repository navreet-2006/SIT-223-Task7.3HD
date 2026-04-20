pipeline {
    agent any

    environment {
        IMAGE_NAME = 'student-grade-tracker'
        IMAGE_TAG = "1.0.${BUILD_NUMBER}"
        STAGING_PORT = '3001'
    }

    stages {

        stage('Build') {
            steps {
                echo 'Installing dependencies and building Docker image...'
                sh 'npm install'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
                echo "Docker image built: ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Test') {
            steps {
                echo 'Running unit and integration tests...'
                sh 'npm test'
            }
            post {
                always {
                    echo 'Test stage completed.'
                }
                failure {
                    echo 'Tests failed! Pipeline stopped.'
                }
            }
        }

        stage('Code Quality') {
            steps {
                echo 'Running SonarQube code quality analysis...'
                sh '''
                    docker run --rm \
                    --network host \
                    -v "$(pwd):/usr/src" \
                    -w /usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=student-grade-tracker \
                    -Dsonar.sources=src \
                    -Dsonar.tests=tests \
                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                    -Dsonar.host.url=http://sonarqube:9000 \
                    -Dsonar.login=admin \
                    -Dsonar.password=admin123
                '''
            }
        }

        stage('Security') {
            steps {
                echo 'Running Trivy security scan...'
                sh '''
                    docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    aquasec/trivy:latest image \
                    --exit-code 0 \
                    --severity LOW,MEDIUM,HIGH,CRITICAL \
                    --format table \
                    ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy to Staging') {
            steps {
                echo 'Deploying to staging environment...'
                sh 'docker compose -f docker-compose.staging.yml down || true'
                sh "IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.staging.yml up -d"
                echo "App deployed to staging on port ${STAGING_PORT}"
                sh 'sleep 10'
                sh 'curl -f http://localhost:3001/health || exit 1'
                echo 'Staging health check passed!'
            }
        }

        stage('Release') {
            steps {
                echo 'Tagging release...'
                sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:release-${IMAGE_TAG}"
                sh "git tag -a v${IMAGE_TAG} -m 'Release version ${IMAGE_TAG}' || true"
                echo "Release tagged: v${IMAGE_TAG}"
            }
        }

        stage('Monitoring') {
            steps {
                echo 'Starting monitoring stack...'
                sh 'docker compose up -d prometheus grafana'
                sh 'sleep 10'
                sh 'curl -f http://localhost:9090/-/healthy || exit 1'
                echo 'Prometheus is UP!'
                echo 'Grafana is available at http://localhost:3001'
                echo 'Monitoring stack is running!'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Application is live at http://localhost:3000"
            echo "Monitoring at http://localhost:9090"
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}