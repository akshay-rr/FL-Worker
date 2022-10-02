import { registerWorker, submitSubTaskResult } from "./utils/taskUtils";

// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');

const { getFileData } = require('./utils/taskUtils');

const { w3cwebsocket } = require('websocket');


let client: any;

try {
    client = new w3cwebsocket('ws://host.docker.internal:5000');
} catch (e) {
    console.log(e);
}

let workerId: any;


// Set the region 
AWS.config.update({region: 'ap-south-1'});

// Create an SQS service object
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const queueUrl = "https://sqs.ap-south-1.amazonaws.com/617770264029/dynamofl.fifo";

const readSingleSubtaskFromQueue = () => {
    const params = {
        AttributeNames: [
            "SentTimestamp"
        ],
        MaxNumberOfMessages: 1,
        MessageAttributeNames: [
            "All"
        ],
        QueueUrl: "https://sqs.ap-south-1.amazonaws.com/617770264029/dynamofl.fifo",
    };
       
    sqs.receiveMessage(params, function(err: any, data: any) {
        if (err) {
            console.log("Receive Error", err);
        } else if (data.Messages) {

            const dataMessage = data.Messages[0].MessageAttributes;
            console.log('Received Data: ', dataMessage);

            const fileId = parseInt(dataMessage.fileId.StringValue);
            const taskId = parseInt(dataMessage.taskId.StringValue);

            const deleteParams = {
                QueueUrl: queueUrl,
                ReceiptHandle: data.Messages[0].ReceiptHandle
            };
            sqs.deleteMessage(deleteParams, function(err: any, data: any) {
                if (err) {
                    console.log("Delete Error", err);
                } else {
                    console.log("Message Deleted", data);
                }
            });

            getFileData(taskId, fileId).then((data: any) => {

                const dataLength = data.length;
                const dataSum = data.reduce((partialSum: any, a: any) => partialSum + a, 0);
                const avg = dataSum/dataLength;

                submitSubTaskResult(taskId, fileId, avg, dataLength).then((response) => {
                    console.log(response);

                    client.send(JSON.stringify({
                        sender: 'worker',
                        type: 'WORKER_READY',
                        data: workerId
                    }));

                }).catch((e) => {
                    console.log('Error Submitting File Result');
                    console.log(e);
                });
            }).catch((e: any) => {
                console.log('Error Fetching File Data');
                console.log(e);
            });
        } else {
            client.send(JSON.stringify({
                sender: 'worker',
                type: 'WORKER_IDLE',
                data: workerId
            }));
        }
    });
}

console.log('Worker Starting');

client.onopen = () => {
    console.log('WebSocket Client Connected');
    registerWorker().then((result) => {
        console.log("Registered Worker: ", result);
    
        workerId = result.id;
        client.send(JSON.stringify({
            sender: 'worker',
            type: 'WORKER_READY',
            data: workerId
        }));
    }).catch((e) => {
        console.log('Error Registering Worker');
        console.log(e);
    });
    
};

client.onmessage = (message: any) => {
    const dataFromServer = JSON.parse(message.data);
    if (dataFromServer.type === 'ACTIVATE_WORKER' && dataFromServer.data === workerId) {
        console.log(`Worker ${workerId} ACTIVATED`);
        readSingleSubtaskFromQueue();
    }
};
