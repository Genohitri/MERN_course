const {Router} = require('express');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User'); 
const router = Router();

// /api/auth/register
router.post(
    '/register',
    [
        check('email', 'Uncorrect email').isEmail(),
        check('password', 'Invalid password').isLength({min: 6})
    ],
     async (req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty) {
            return res.status(400).json({errors: errors.array(),
            message: "Uncorrect data registation"
            })
        }

        const {email, password} = req.body;
        const candidate = await User.findOne({ email: email});

        if (candidate) {
            return res.status(400).json({message: "User already registered"});
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User ({ email, password: hashedPassword });

        await user.save();

        res.status(201).json({message: "User saved successfully"});

    } catch (e) {
        res.status(500).json({ message: "Something gone wrong, try againe"})
    }
});
// /api/auth/login
router.post(
    '/login',
    [
        check('email', 'Enter your email').normalizeEmail().isEmail(),
        check('password', 'Enter your password').exists()
    ],
     async (req, res) => {

    try {
        const errors = validationResult(req);
        if(!errors.isEmpty) {
            return res.status(400).json({errors: errors.array(),
            message: "Uncorrect data login"
            })
        }
    
        const {email, password} = req.body;
        
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password"})
        }

        const token = jwt.sign(
            { userId: user.id },
            config.get('jwtSecret'),
            {expiresIn: '1h'}
        )
        
        res.json({ token, userId: user.id })

    } catch (e) {
        res.status(500).json({ message: "Something gone wrong, try againe"})
    }    


});

module.exports = router;