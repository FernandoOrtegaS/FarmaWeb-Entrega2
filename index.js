import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

const CLAVE_SECRETA = 'sedavueltaelsemestre123';
const AUTH_COOKIE_NAME = 'segurida';
const sql = neon('postgresql://udpproyecto_owner:ZcEbr9vWGi8P@ep-small-credit-a5un2coi.us-east-2.aws.neon.tech/udpproyecto?sslmode=require');

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/images', express.static('images'));
app.use(express.static('public'));

app.get('/administracion', (req, res) => {
  res.render('administracion');
});

app.get('/login', (req, res) => {
  const error = req.query.error;
  res.render('login', { error });
});


app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const query = 'SELECT id, password FROM users WHERE email = $1';
  const results = await sql(query, [email]);

  if (results.length === 0) {
    res.redirect(302, '/login?error=unauthorized'); // Corregido el typo de "uanuthorized"
    return;
  }

  const id = results[0].id;
  const hash = results[0].password;

  if (bcrypt.compareSync(password, hash)) {
    const fiveMinutesFromNowInSeconds = Math.floor(Date.now() / 1000) + 5 * 60;
    const token = jwt.sign({ id, exp: fiveMinutesFromNowInSeconds }, CLAVE_SECRETA);

    res.cookie(AUTH_COOKIE_NAME, token, { maxAge: 60 * 5 * 1000, httpOnly: true });
    res.redirect(302, '/profile');
    return;
  }
  res.redirect('/login?error=unauthorized'); 
});

app.post('/signup', async (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const hash = bcrypt.hashSync(password, 5);

  const query = 
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id';
  const results = await sql(query, [name, email, hash]);
  const id = results[0].id;

  const fiveMinutesFromNowInSeconds = Math.floor(Date.now() / 1000) + 5 * 60;
  const token = jwt.sign(
    { id, exp: fiveMinutesFromNowInSeconds },
    CLAVE_SECRETA
  );

  res.cookie(AUTH_COOKIE_NAME, token, { maxAge: 60 * 5 * 1000 });
  res.redirect(302, '/profile');
});

const AuthMiddleware = (req, res, next) => {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.render('unauthorized');
  }

  try {
    req.user = jwt.verify(token, CLAVE_SECRETA);
    next();
  } catch (e) {
    res.render('unauthorized');
  }
};

app.get('/', async (req, res) => {
  const lista = await sql('SELECT * FROM playing_with_neon');
    res.render('productos', {lista});
  });

app.get('/profile', AuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  const query = 'SELECT name, email FROM users WHERE id = $1';

  try {
    const results = await sql(query, [userId]);
    const user = results[0];

    res.render('profile', { user });
  } catch (error) {
    res.render('unauthorized');
  }
});


app.listen(3006, () => console.log('Servidor corriendo en el puerto 3000'));
