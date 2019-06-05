const secret = require('../data/secret')

function callAPI(token, endpoint) {
    return new Promise((resolve, reject) => {
        const https = require('https')
        const url = `https://api.fitbit.com/1.2/user/${secret.user_id}/${endpoint}`
        console.log(`getting data from ${url}`)
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${token.token.access_token}`
            }
        }
        
        const request = https.request(url, options, res => {
            const buffers = []
            res.on('data', chunk => buffers.push(chunk))
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(Buffer.concat(buffers))
                    if(parsedData.errors)
                        reject(parsedData)
                    else
                        resolve(parsedData)
                } catch (e) {
                    reject(e.message)
                }
            })
        })
        request.end();
    })
}

module.exports.calories = async (token) => {
    const result = await callAPI(token, `activities/date/today.json`)
    return result.summary.calories.total
}

module.exports.heart = async (token) => {
    const result = await callAPI(token, `activities/heart/date/today/1d/1sec.json`)
    return result['activities-heart-intraday'].dataset.pop().value
}

module.exports.sleep = async (token) => {
    const result = await callAPI(token, `sleep/date/today.json`)
    return result.summary.totalMinutesAsleep
}

module.exports.devices = async (token) => {
    const result = await callAPI(token, `devices.json`)
    return result
        .map(device => `${device.deviceVersion} (battery ${device.battery.toLowerCase()})`)
        .join(', ')
}

module.exports.weight = async (token) => {
    const date = new Date().toISOString().slice(0,10)
    const result = await callAPI(token, `body/log/weight/date/${date}/30d.json`)
    return result.weight.pop().weight
}