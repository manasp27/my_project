pipeline {
    agent any

    environment {
        PATH = "C:\\Program Files\\nodejs;${env.PATH}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Verify Node.js') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Verify Application') {
            steps {
                bat 'node --check server.js'
            }
        }

        stage('Deployment') {
            steps {
                echo 'FreelanceHub deployment stage completed successfully.'
            }
        }
    }
}
