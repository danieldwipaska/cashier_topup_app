const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();

const menuRoute = require('./routes/menu');
const createRoute = require('./routes/create');
const activationRoute = require('./routes/activation');
const checkinRoute = require('./routes/checkin');
const checkoutRoute = require('./routes/checkout');
const topupRoute = require('./routes/topup');
const paymentRoute = require('./routes/payment');
const fnbRoutes = require('./routes/fnb');
const authRoute = require('./routes/auth');
const cardRoute = require('./routes/card');

const app = express();

//MIDDLEWARES
app.use(expressLayouts);
app.use(express.json({ limit: '10mb' }));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(`${__dirname}/public`)); // make files able to access
app.use('/public', express.static(path.join(__dirname, 'public')));
// app.use(cors());

//ROUTES
app.use('/', menuRoute);
app.use('/create', createRoute);
app.use('/activation', activationRoute);
app.use('/checkin', checkinRoute);
app.use('/checkout', checkoutRoute);
app.use('/topup', topupRoute);
app.use('/payment', paymentRoute);
app.use('/fnb', fnbRoutes);
app.use('/auth', authRoute);
app.use('/card', cardRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening at port ${port} !!!`);
});
