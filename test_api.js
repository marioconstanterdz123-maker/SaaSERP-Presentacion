const http = require('http');

const data = JSON.stringify({ email: 'conrdz123456@gmail.com', password: 'Admin123!' });

const req = http.request({
    hostname: '134.209.214.44',
    port: 80,
    path: '/api/Auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const token = JSON.parse(body).token;
            if (!token) throw new Error('No token found');
            
            http.get({
                hostname: '134.209.214.44',
                port: 80,
                path: '/api/negocios',
                headers: { 'Authorization': `Bearer ${token}` }
            }, res2 => {
                let b2 = '';
                res2.on('data', d => b2 += d);
                res2.on('end', () => {
                    const negs = JSON.parse(b2);
                    console.log('KEYS:', Object.keys(negs[0]));
                    console.log('FechaVal:', negs[0].fechaVencimientoSuscripcion);
                    console.log('FechaVal Pascal:', negs[0].FechaVencimientoSuscripcion);
                });
            });
        } catch (e) {
            console.error('Error in login', body);
        }
    });
});
req.write(data);
req.end();
