require('./instrument');
const Sentry = require('@sentry/node');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const menuRoute = require('./routes/menu');
const createRoute = require('./routes/create');
const activationRoute = require('./routes/activation');
// const checkinRoute = require('./routes/checkin');
const checkoutRoute = require('./routes/checkout');
const topupRoute = require('./routes/topup');
const paymentRoute = require('./routes/payment');

const authRoute = require('./routes/auth');
const cardRoute = require('./routes/card');
// const dineInCalcRoute = require('./routes/api/dineInCalc');
const userRoute = require('./routes/user');

const memberRoute = require('./routes/member');
const analysisRoute = require('./routes/analysis');
const thirdPartyRoute = require('./routes/thirdParty');
const transferRoute = require('./routes/transfer');
const fnbRoute = require('./routes/fnbs');
const adjustmentRoute = require('./routes/adjustment');
const supportRoute = require('./routes/support');
const crewRoute = require('./routes/crew');

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
app.use(cors());

//ROUTES
app.use('/', menuRoute);
app.use('/create', createRoute);
app.use('/activation', activationRoute);
// app.use('/checkin', checkinRoute);
app.use('/checkout', checkoutRoute);
app.use('/topup', topupRoute);
app.use('/payment', paymentRoute);

app.use('/auth', authRoute);
app.use('/card', cardRoute);
// app.use('/api/dinein', dineInCalcRoute);
app.use('/user', userRoute);

app.use('/member', memberRoute);
app.use('/analysis', analysisRoute);
app.use('/thirdparty', thirdPartyRoute);
app.use('/transfer', transferRoute);
app.use('/fnb', fnbRoute);
app.use('/adjustment', adjustmentRoute);
app.use('/support', supportRoute);
app.use('/crew', crewRoute);

Sentry.setupExpressErrorHandler(app);

app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + '\n');
});

missingFunction();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening at port ${port} !!!`);
});
