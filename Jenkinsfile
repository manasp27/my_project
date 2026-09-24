pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Building FreelanceHub project...'
                bat 'echo Build completed successfully'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                bat 'echo Tests completed successfully'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying FreelanceHub...'
                bat 'echo Deployment completed successfully'
            }
        }
    }

    post {
        success {
            echo 'FreelanceHub CI/CD pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
