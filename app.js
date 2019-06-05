const Server = require('./modules/Server')
const server = new Server()
const Token  = require('./modules/Token')
const token  = new Token()
const API    = require('./modules/API') 


let killTimeoutID
function kill () {
    clearTimeout(killTimeoutID)
    killTimeoutID = setTimeout(process.exit, 10*60*1000)
}
kill()

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
            try { response = await token.get().then(API.calories) } catch { console.error('problem with calories()') }
            break;
        case '/heart':
            try { response = await token.get().then(API.heart) }    catch { console.error('problem with heart()') }
            break;
        case '/sleep':
            try { response = await token.get().then(API.sleep) }    catch { console.error('problem with sleep()') }
            break;
        case '/devices':
            try { response = await token.get().then(API.devices) }  catch { console.error('problem with devices()') }
            break;
        case '/weight':
            try { response = await token.get().then(API.weight) }   catch { console.error('problem with weight()') }
            break;
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end(`${response}`)
})

token.get()
.then(() => server.start())
.catch((e) => console.error('WTF ?!', e))
