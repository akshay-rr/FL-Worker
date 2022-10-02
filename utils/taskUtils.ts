const axios = require('axios');
const querystring = require('querystring');

const API_BASE_URL = "http://localhost:5000/"

export const submitSubTaskResult = async (taskId: number, fileId: number, result: number, fileSize: number) => {
    const formBody = querystring.stringify({
        taskId: taskId,
        fileId: fileId,
        result: result,
        fileSize: fileSize
    });

    const requestConfig = {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    const requestUrl = API_BASE_URL + 'sendresult';

    const response = await axios.post(requestUrl, formBody, requestConfig);
    const data = response.data;
    return data;
}

export const registerWorker = async () => {
    const formBody = querystring.stringify({});

    const requestConfig = {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    const requestUrl = API_BASE_URL + 'registerworker';

    const response = await axios.post(requestUrl, formBody, requestConfig);
    const data = response.data;

    return data;
}

export const getFileData = async (taskId: number, fileId: number) => {
    const formBody = querystring.stringify({
        taskId: taskId,
        fileId: fileId
    });

    const requestConfig = {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    const requestUrl = API_BASE_URL + 'filedata';

    const response = await axios.post(requestUrl, formBody, requestConfig);
    const data = response.data;
    return data.split(',').map((value: string) => parseInt(value));
}