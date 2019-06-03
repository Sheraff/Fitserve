const secret = require('./data/secret')

function getAPI(token, endpoint) {
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

async function data (endpoint) {
    return await token.get()
        .then(token => getAPI(token, endpoint))
        .catch('got a dud')
}

async function calories () {
    const result = await data(`activities/date/today.json`)
    return result.summary.calories.total
}

async function heart () {
    const result = await data(`activities/heart/date/today/1d/1sec.json`)
    return result['activities-heart-intraday'].dataset.pop().value
}

async function sleep () {
    const result = await data(`sleep/date/today.json`)
    return result.summary.totalMinutesAsleep
}

async function devices () {
    const result = await data(`devices.json`)
    return result
        .map(device => `${device.deviceVersion} (battery ${device.battery.toLowerCase()})`)
        .join(', ')
}

async function weight () {
    const date = new Date().toISOString().slice(0,10)
    const result = await data(`body/log/weight/date/${date}/30d.json`)
    return result.weight.pop().weight
}



const Server = require('./modules/Server')
const server = new Server()
const Token = require('./modules/Token')
const token = new Token()

token.get()
.then(() => server.ready = true)
.catch((e) => console.error('WTF ?!', e))



server.start(async (req, res) => {
    

    if (server.ready) {
        if (req.url==='/') {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(`
                <a href="/calories">calories</a><br>
                <a href="/heart">heart</a><br>
                <a href="/sleep">sleep</a><br>
                <a href="/devices">devices</a><br>
                <a href="/weight">weight</a><br>
            `)
            return
        }
        let response = ''
        switch (req.url) {
            case '/calories':
                try { response = await calories() } catch { console.error('problem with calories()') }
                break;
            case '/heart':
                try { response = await heart() }    catch { console.error('problem with heart()') }
                break;
            case '/sleep':
                try { response = await sleep() }    catch { console.error('problem with sleep()') }
                break;
            case '/devices':
                try { response = await devices() }  catch { console.error('problem with devices()') }
                break;
            case '/weight':
                try { response = await weight() }   catch { console.error('problem with weight()') }
                break;
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain')
        res.end(`${response}`)
    } else {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain')
        res.end('server not ready')
    }
})