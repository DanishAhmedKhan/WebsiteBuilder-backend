const Joi = require('joi');

const error = (msg) => {
    return {
        status: 'error',
        msg: msg
    };
};

const success = (data) => {
    return {
        status: 'success',
        data: data
    };
};

const validate = (data, schemaObject) => {
    const schema = Joi.object().keys(schemaObject);

    const { error } = Joi.validate(data, schema, {
        abortEarly: true, 
        convert: true,
        allowUnknown: true
    });
    
    return error;
};

const getCurrentDateTime = () => {
    const dateTime = new Date();

    const year = dateTime.getFullYear();
    const month = dateTime.getMonth();
    const day = dateTime.getDate();
    const hour = dateTime.getHours();
    const minute = dateTime.getMinutes();
    const second = dateTime.getSeconds();
    const timestamp = dateTime.getTime();

    const currentDateTime = {
        year, month, day, hour, minute, second, timestamp
    }
    return currentDateTime;
}

const getCurrentDate = () => {
    const dateTime = new Date();

    const year = dateTime.getFullYear();
    const month = dateTime.getMonth();
    const day = dateTime.getDate();

    const currentTime = {
        year, month, day, 
        hour: null,
        minute: null,
        second: null,
    };
    return currentTime;
}

const toStringDate = (date) => {
    return date.year + '-' + date.month + '-' + date.day;
}

const getNextDay = (currentDay) => {
    const currentDate = new Date(
        currentDay.year,
        currentDay.month, 
        currentDay.day,
    );
    const nextDayDate = new Date();
    nextDayDate.setDate(currentDate.getDate() + 1);

    return nextDayDate;
};

const isToday = (date) => {
    return _.isEqual(getCurrentDate, date);
}

const generateId = (length) => {
    let result = '';
    const alphabetsUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphabetsLower = alphabetsUpper.toLowerCase();
    const alphabets = alphabetsUpper + alphabetsLower;
    const numbers = '0123456789';
    const characters =  alphabets + numbers;
    const charactersLength = characters.length;
    for (let i = 0; i < length - 1; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    result += characters.charAt(Math.floor(Math.random() * alphabets.length));
    return result;
}

module.exports = {
    error, 
    success,
    validate,
    getCurrentDateTime,
    toStringDate,
    getCurrentDate,
    getNextDay,
    isToday,
    generateId,
};