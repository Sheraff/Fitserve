const Server = require('./modules/Server')
const server = new Server()
const Token  = require('./modules/Token')
const token  = new Token()
const API    = require('./modules/API') 


let killTimeoutID
function kill () {
    clearTimeout(killTimeoutID)
    killTimeoutID = setTimeout(() => {
        fs.unlink(__dirname+'/data/root.txt', process.exit)
    }, 10*60*1000)
}
kill()
process.title = 'Fitserve'

server.createServer(async (req, res) => {
    
    kill()
    
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
            try { response = await token.get().then(API.calories) } catch (e) { console.error('problem with calories()', e) }
            break;
        case '/heart':
            try { response = await token.get().then(API.heart) }    catch (e) { console.error('problem with heart()', e) }
            break;
        case '/sleep':
            try { response = await token.get().then(API.sleep) }    catch (e) { console.error('problem with sleep()', e) }
            break;
        case '/devices':
            try { response = await token.get().then(API.devices) }  catch (e) { console.error('problem with devices()', e) }
            break;
        case '/weight':
            try { response = await token.get().then(API.weight) }   catch (e) { console.error('problem with weight()', e) }
            break;
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${response}`)
})

token.get()
.then(server.start)
.then(({port, host}) => {
    const fs = require('fs')
    const url = `http://${host}:${port}`
    fs.writeFile(__dirname+'/data/root.txt', url, 'utf8', (err) => {
        if (err) 
            console.error(err)
    })
    console.log(url)
})
.catch((e) => console.error('WTF ?!', e))
