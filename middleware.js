const jwt = require('jsonwebtoken');
const yup = require('yup');
const jwtSecret = process.env.JWT_SECRET;



async function authenticateToken (req, res, next){
    const cookies = req.headers.cookie;
    
    if(cookies)
    {
        
        const tokenCookieString = cookies.split(';').find((str)=>str.startsWith("token="));

        if(tokenCookieString)
        {
            const token = tokenCookieString.split("=")[1];
            if(token)
            {
                // console.log(token);
                jwt.verify(token, jwtSecret, {}, (err, decode)=>{
                    if(err){
                        return res.status(403).json({error: 'Invalid token'});
                    }
                    next();
                });
            }
            else
            {
                res.status(401).json({error: 'Unauthorized'});
            }
        }
        
    }
}

module.exports = {authenticateToken}; 
