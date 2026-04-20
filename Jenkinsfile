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
                    -Dsonar.sources=. \
                    -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/tests/** \
                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                    -Dsonar.host.url=http://172.17.0.3:9000 \
                    -Dsonar.token=sqa_5e365bb149dee0eeb70f0dd2765ea3c147971f68
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
                sh 'docker rm -f grade-tracker-staging || true'
                sh """
                    docker run -d \
                    --name grade-tracker-staging \
                    -p 3001:3000 \
                    -e PORT=3000 \
                    -e NODE_ENV=staging \
                    ${IMAGE_NAME}:${IMAGE_TAG}
                """
                sh 'sleep 5'
                sh 'docker exec grade-tracker-staging wget -qO- http://localhost:3000/health || exit 1'
                echo 'Staging deployment successful!'
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
                sh 'docker rm -f grade-tracker-prometheus grade-tracker-grafana || true'
                sh '''
                    docker run -d \
                    --name grade-tracker-prometheus \
                    -p 9090:9090 \
                    prom/prometheus:latest
                '''
                sh '''
                    docker run -d \
                    --name grade-tracker-grafana \
                    -p 3002:3000 \
                    -e GF_SECURITY_ADMIN_PASSWORD=admin123 \
                    grafana/grafana:latest
                '''
                sh 'sleep 15'
                sh 'docker exec grade-tracker-prometheus wget -qO- http://localhost:9090/-/healthy || exit 1'
                echo 'Prometheus is UP at http://localhost:9090'
                echo 'Grafana is UP at http://localhost:3002'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            echo "Application is live at http://localhost:3000"
            echo "Staging at http://localhost:3001"
            echo "Monitoring at http://localhost:9090"
            echo "Grafana at http://localhost:3002"
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}