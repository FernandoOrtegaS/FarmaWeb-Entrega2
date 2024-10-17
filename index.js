import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';

const sql = neon('postgresql://udpproyecto_owner:ZcEbr9vWGi8P@ep-small-credit-a5un2coi.us-east-2.aws.neon.tech/udpproyecto?sslmode=require');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/images', express.static('images')); //rutas estaticasssss
app.use(express.static('public'));

app.get('/', async (req, res) => { // base de datoss 
const lista = await sql('SELECT * FROM playing_with_neon');
  res.render('productos', {lista});
});

app.get('/login', (req,res)=>{
res.render('login')
});

app.post('/login', async (req, res) => {
  const correo = req.body.correo;
  const contraseña = req.body.contraseña;

  // Asegúrate de que la consulta coincide con los nombres de tus columnas en la base de datos
  const query = 'INSERT INTO login (correo, contraseña) VALUES ($1, $2)';
  
  try {
    // Inserta los datos en la base de datos
    await sql(query, [correo, contraseña]);

    // Redirige a la página principal después de guardar los datos
    res.redirect('/');
  } catch (error) {
    console.error('Error al guardar en la base de datos:', error);
    res.status(500).send('Error al iniciar sesión');
  }
});

app.listen(3000, () => console.log('tuki'));