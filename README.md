# Benchmark RabbitMQ and Kafka

## Features
- **Framework**: Express
- **Code**: ESLint, Prettier, Husky
- **Debuging**: Debug, VS Code configurations
- **Logging**: Winston
- **Testing**: Jest, SuperTest, AutoCannon
- **Continuous Integration**: GitHub Actions + Docker Compose
- **Other**: PM2, DotEnv
- **Message Broker**: RabbitMQ, Kafka

## Getting Started
```shell
# Setup Docker RabbitMQ
git clone https://github.com/micahhausler/rabbitmq-compose
cd rabbitmq-compose
docker-compose up

# Setup Docker Kafka : https://www.bennettnotes.com/post/setup-kafka-zookeeper-in-docker/
git clone https://github.com/wurstmeister/kafka-docker
cd kafka-docker
docker-compose up --build -d

# Install all dependencies
git clone https://github.com/harryranakl/benchmark-rabbitmq-kafka
cd benchmark-rabbitmq-kafka
npm install

# Run on port 3000
npm start

```

## Structure

```
.
├── config                  # App configuration files
│   ├── index.js        	# config
│   └── ...                 # Other configurations
├── db                      # Data access stuff
├── docs                    # Documentation
├── helpers                 # Helpers (formats, validation, etc)
├── services                # External services implementation  
│   ├── controllers         # Request managers
│   ├── middlewares         # Request middlewares
│   └── routes.js           # Define routes and middlewares here
├── scripts                 # Standalone scripts for dev uses
├── tests                   # Testing
├── .env                    # Environment variables
├── app.js                  # App starting point
├── Dockerfile              # Dockerfile
├── process.json            # pm2 init
├── package.json
└── README.md         
```

```shell

Case: rabbitmq publish
EndPoint: http://localhost:4000/publish/<msg>
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[publish]: msg12345 Message sent at 2020-04-30 17:21:21.648"
}

Case: rabbitmq subscribe
EndPoint: http://localhost:4000/subscribe
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[publish]: msg12345, [subscribe]: Message received at 2020-04-30 17:21:24.564"
}

Case: rabbitmq client
EndPoint: http://localhost:4000/client/<msg>
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[client]: msg12345 Message sent at 2020-04-30 17:21:21.648"
}

Case: rabbitmq server
EndPoint: http://localhost:4000/server
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[client]: msg12345, [server]: Message received at 2020-04-30 17:21:24.564"
}


Case: kafka producer
EndPoint: http://localhost:4000/producer/<msg>
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[producer]: msg12345 Message sent at 2020-04-30 17:21:21.648"
}

Case: kafka consumer
EndPoint: http://localhost:4000/consumer
Method:GET
Response:{
    "httpCode": 200,
    "msgTxt": "[producer]: msg12345, [consumer]: Message received at 2020-04-30 17:21:24.564"
}

```