import connectDB from './src/db/connection.js';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import {parse} from 'querystring';  


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

const routes = {
  '/': 'index.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/dinners': 'dinners.html',
  '/meals': 'meals.html',
  '/ingredients': 'ingredients.html',
  '/occasions': 'occasions.html',
  '/cusines': 'cuisines.html',
  '/kichen-tips': 'kitchen-tips.html',

  
  '/admin': 'admin.html',
  '/admin/add-recipe': 'add-recipe.html',
  '/admin/edit-recipe': 'edit-recipe.html',
  '/about': 'about.html',
  '/contact': 'contact.html',
  }




const server = http.createServer(async (req, res) => {
  const url = req.url;
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : routes[url] || url);
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'text/plain';
  let templatePath = '';
  const __dbClns= {
    'users':'users',
    'recipes': 'recipes',
    'reviews': 'reviews',
    'details': 'details',
    'ingredients': 'ingredients',
    'instructions': 'instructions',
    'nutritions': 'nutritions'
  }

// Route handling
  if(url.startsWith('/admin')) {
    templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[url]); 
    switch(url){
      case '/admin': serveAdminDashboard(req, res, templatePath); break;
      case '/admin/add-recipe': serveServeAddRecipeForm(req, res, templatePath); break;
      case '/admin/edit-recipe': serveServeEditRecipeForm(req, res, templatePath); break;
      default:
        res.writeHead(404);
        res.end('Page Not Found');
    }
  }else{
    templatePath = path.join(__dirname, 'src', 'views', routes[url]);
    switch(url){
      case '/': serveHomePage(req, res, templatePath); break;
      case '/login': serveLoginPage(req, res, templatePath); break;
      case '/register': serveRegisterPage(req, res, templatePath); break; 
      case '/about': serveAboutPage(req, res, templatePath); break;
      case '/contact': serveContactPage(req, res, templatePath); break;
      case '/dinners':  serveHomePage(req, res, templatePath); break;
      case '/meals':  serveHomePage(req, res, templatePath); break;
      case '/ingredients':  serveHomePage(req, res, templatePath); break;
      case '/occasions':  serveHomePage(req, res, templatePath); break;
      case '/cusines':  serveHomePage(req, res, templatePath); break;
      case '/kichen-tips':  serveHomePage(req, res, templatePath); break; 
      default:
        res.writeHead(404);
        res.end('Page Not Found');
    }
  }

 /*  if(req.method === 'GET' && contentType === 'text/html') {
    console.log('GET request for:', url);
    console.log(routes[url]);
    if(url.startsWith('/recipe/')) {
      console.log('Handling dynamic recipe page for URL:', url);
      await handleDynamicRecipe(req, res);
      return;
    } else if(url.startsWith('/admin')){
      templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[url]);
    } else {
      templatePath = path.join(__dirname, 'src', 'views', routes[url]);
    }

    //serve static HTML templates
    if (routes[url]) {
      fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Template Not Found');
          return;
        }else{ 
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    }
  }else if (req.method === 'POST' && url === '/admin/add-recipe') {
    let body = '';
    
    // listen for data chunks
    req.on('data', chunk => {
      body += chunk.toString();
    });

    // when all data is received
    req.on('end', async () => {
      const formData = parse(body);
      const slug =  formData.title.toLocaleLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      // 2. Prepare the document based on ER diagram
      const newRecipe = {
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : [],
        instructions: formData.instructions ? formData.instructions.split('.').map(i => i.trim()) : [],
        slug: slug,
        createdAt: new Date(),
      }
      try{
        // connect and insert 
        const db = await connectDB();
        const result = await db.collection('recipes').insertOne(newRecipe);
        console.log('New recipe added with ID:', result.insertedId);
        res.writeHead(302, { 'Location': '/admin' });
        res.end();  
      }catch(err){
        console.error('Error inserting recipe:', err);
        res.writeHead(500);
        res.end('Internal Server Error');
      }

    })


  }
 */
 

});



server.listen(3000, async () => console.log('Server running on http://localhost:3000'));


async function handleDynamicRecipe(req, res) {
  const db = await connectDB();
  const slug = req.url.split('/recipe/')[1];

  const recipe = await db.collection('recipes').findOne({ slug });

  if (!recipe) {
    res.writeHead(404);
    res.end('Recipe Not Found');
    return;
  }

  let template = fs.readFileSync(path.join(__dirname, 'src/views/recipe.html'), 'utf8');

  const finalHtml = template
    .replace('{{TITLE}}', recipe.title)
    .replace('{{DESCRIPTION}}', recipe.description)
    .replace('{{INGREDIENTS}}', recipe.ingredients.map(i => `<li>${i}</li>`).join(''));

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(finalHtml);
}

// Server homepage
async function serveHomePage(req, res, templatePath){
  try {
    const db = await connectDB();

    //1. Fetch recipes from MongoDB
    const recipes = await db.collection(__dbClns.recipes)
      .find()
      .sort({createdAt: -1}
      .limit(12)
      .toArray()
      )
    // 2. Read the HTML template file
    let template = fs.readFileSync(templatePath, 'utf8');
    // 3. Build the Recipe Cards HTML () SEO Friendly 
    let cardsHtml = '';
    recipes.array.forEach(recipe => {
      cardsHtml += `
      <article class="recipe-card">
          <h3>${recipe.title}</h3>
          <p>${recipe.description}
      `
    });
    
  } catch (error) {
    
  }
}
// Server login page
function serveLoginPage(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })};
// Server register page
function serveRegisterPage(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })};
// Server admin dashboard
function serveAdminDashboard(req, res, templatePath){  
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }
    else{
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    } 
  })};
 // Server add recipe form
function serveServeAddRecipeForm(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })}; 
 // Server edit recipe form
function serveServeEditRecipeForm(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })}; 

 // Server about page
function serveAboutPage(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })}; 
 // Server contact page
function serveContactPage(req, res, templatePath){
  fs.readFile(templatePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Template Not Found');
      return;
    }else{ 
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })}; 