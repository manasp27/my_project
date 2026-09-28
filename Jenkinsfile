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
        bat '''
        if exist server.pid (
            for /f %%p in (server.pid) do taskkill /F /PID %%p
            del server.pid
        )

        start /B cmd /c "npm start > server.log 2>&1"
        '''
        echo 'FreelanceHub server started successfully.'
    }
}
    }
}
