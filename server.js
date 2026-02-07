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
  console.log(`URL: ${url}, Route:${routes[url]}, Method: ${req.method}`);
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
// Sultan ahmed
// Route handling
  if(url.startsWith('/admin') && routes[url]) {
    templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[url]); 
    switch(url){
      case '/admin': serveAdminDashboard(req, res, templatePath); break;
      case '/admin/add-recipe':if(req.method === "GET"){
                                  serveAddRecipeForm(req, res, templatePath); break;
                              }else if(req.method === 'POST'){
                                  console.log("This is post request")
                                  submitNewRecipe(req, res, templatePath);
                              }
      case '/admin/edit-recipe': serveServeEditRecipeForm(req, res, templatePath); break;
      default:
        res.writeHead(404);
        res.end('Page Not Found');
    }
  }else if(routes[url]){
    templatePath = path.join(__dirname, 'src', 'views', routes[url]);
    switch(url){
      case '/': serveHomePage(req, res, templatePath); break;
      case '/login':if(req.method === 'GET'){
                    serveLoginPage(req, res, templatePath); break;
                  }else if (req.method === 'POST'){
                    login(req, res, templatePath); break;
                  }
      case '/register': if(req.method === 'GET'){
                    serveRegisterPage(req, res, templatePath); break;
                  }else if(req.method === 'POST'){
                    register(req, res, templatePath); break;
                  }
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
  }else{
      res.writeHead(404);
      res.end('Page not found');
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
async function serveHomePage(req, res, templatePath) {
  try {
    const db = await connectDB();

    // 1. Fetch recipes from MongoDB
    // FIX: Ensure .toArray() is called AFTER .limit()
    const recipes = await db.collection("recipes")
      .find()
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray(); 

    console.log('Recipes fetched successfully');

    // 2. Read the HTML template file
    let template = fs.readFileSync(templatePath, 'utf8');

    // 3. Build the Recipe Cards HTML (SEO Friendly)
    let cardsHtml = '';

    // FIX: recipes is already an array, remove ".array"
    recipes.forEach(recipe => {
      cardsHtml += `
      <article class="recipe-card">
          <h3>${recipe.title}</h3>
          <p>${recipe.description || ''}</p>
          <a href="/recipe/${recipe.slug}">View Recipe</a>
      </article>
      `;
    });

    // 4. Handle empty state (Good for UX)
    if (recipes.length === 0) {
      cardsHtml = '<p>No recipes found yet. Check back soon!</p>';
    }

    // 5. Inject and Send
    const page = template.replace('{{RECIPE_CARDS}}', cardsHtml);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(page);

  } catch (error) {
    console.error("Home Page Error:", error);
    res.writeHead(500);
    res.end("Internal server error");
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
function serveAddRecipeForm(req, res, templatePath){
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
//Submit new recipe
async function submitNewRecipe(req, res, templatePath) {
  let body = '';
  console.log("Inside submitNewReciep function")
  //Get request body
  req.on('data', (chunk) => {
    body += chunk.toString();
    console.log(`chunk: ${chunk}, chunktoString: $${chunk.toString()}`);
    console.log(`body: ${body}`);
  })
}  

//Submite Login creds
function login(req,res , templatePath){
  console.log('Complete your login function');
}

//User register
async function register(req, res, templatePath){
    let body = '';
    req.on('data', chunk =>{
      body += chunk.toString();
    })
    req.on('end', async () =>{
      try{
        const formData = parse(body);
        const {username, email, password} = formData;
        const db = await  connectDB();
        
        //1. check if the email is already taken or not
        const existingUser = await  db.collection('users').find({email});
        if(existingUser){
          res.writeHead(400, {'Content-Type': 'text/html'});
          return res.end('<h1> Email already exists </h1> <a href="/register"> Go back</a>');
        }
        // 2. Create the user object (Match your ER diagram )
        const newUser = {
          usename: username,
          email: email,
          password: password,
          role: 'admin',
          createdAt: new Date()
        };
        
        // 3. Save to MongoDB
        await db.collection('users').insertOne(newUser);

        // 4. Redirect to Login page upon success
        console.log('New user registerd: ', username);
        res.writeHead(302, {'Location': '/login?registered=success'});
        res.end();
      }catch (error){
        console.error("Registration Error", error);
        res.writeHead(500);
        res.end("Internal Server Error during registration ");
      }
    });
}