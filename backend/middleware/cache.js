const NodeCache = require('node-cache');
const cache = new NodeCache();

module.exports = {
    route: (duration) => (req, res, next) => {
        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            res.json(cachedResponse);
            return;
        }

        res.originalJson = res.json;
        res.json = (body) => {
            res.originalJson(body);
            cache.set(key, body, duration);
        };
        next();
    },
    
    clear: (key) => {
        cache.del(key);
    }
}; 