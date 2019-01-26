pipeline {
  agent any
  stages {
    stage('Install') {
      steps {
        sh 'npm install'
      }
    }
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
    stage('Deploy') {
      steps {
        sh 'npm run prod-start'
      }
    }
  }
}
