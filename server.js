import connectDB from './src/db/connection.js';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import {parse} from 'querystring';  
import { ObjectId } from 'mongodb';
import { buffer } from 'stream/consumers';
//testing


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. DECLARE OUTSIDE: These live in the "Global Scope" of your app
let cachedHeader = '';
let cachedNavbar = '';
let cachedFooter = '';
let cachedIndexHtml = '';
let cachedHero = '';
let cachedSearch = '';
let cachedContentSummary = '';
let cachedSliderShell = '';

// 2. RUN ONCE: This runs only once when the script starts
const cacheTemplates = () => {
    cachedHeader = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials', 'header.html' ), 'utf8');
    cachedNavbar = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials', 'navbar.html' ), 'utf8');
    cachedFooter = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials', 'footer.html' ), 'utf8');
     // 2. Load the base template
    cachedIndexHtml = fs.readFileSync(path.join(__dirname, 'src', 'views', 'index.html'), 'utf8');
    cachedHero = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials',  'hero.html'), 'utf8')
    cachedSearch = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials', 'search-bar.html'), 'utf8');
    cachedContentSummary = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials',  'content-summary.html'), 'utf8')
    cachedSliderShell = fs.readFileSync(path.join(__dirname, 'src', 'views', 'partials', 'featured-slider.html'), 'utf8');
  
   
};
cacheTemplates();


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
  '/logout' : 'logout',
  '/dinners': 'dinners.html',
  '/meals': 'meals.html',
  '/ingredients': 'ingredients.html',
  '/occasions': 'occasions.html',
  '/cusines': 'cuisines.html',
  '/kichen-tips': 'kitchen-tips.html',

  '/recipe' : 'view-recipe.html',
  '/recipe/review' : 'review',

  
  '/admin/dashboard': 'dashboard.html',
  '/admin/add-recipe': 'add-recipe.html',
  '/admin/update-recipe': 'update-recipe.html',
  '/admin/delete-recipe': "deletefunction",
  '/about': 'about.html',
  '/contact': 'contact.html',
  '/profile' : 'profile.html'
  }




const server = http.createServer(async (req, res) => {
  const [pathName, queryString]= req.url.split('?');
  const cookies = CookieParserHelper(req);
  console.log(`pathName: ${pathName}, Route:${routes[pathName]}, Method: ${req.method}, QueryString: ${queryString} Cookies: ${JSON.stringify(cookies)}`);
  let filePath = path.join(__dirname, pathName === '/' ? 'index.html' : routes[pathName] || pathName);
  const extname = path.extname(filePath);
  let templatePath = '';

  //1. HANDLE STATIC IMAGES
  // We look for any request that ends with common image extensions
  if(pathName.match(/\.(jpg|jpeg|png|gif|webp|ico)$/)){

    //We extract just the filename from the URL
    // (This fixes the / recipe/image.jpg problem)
    const fileName = path.basename(pathName);
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName );

    fs.readFile(filePath, (err, data) =>{
      if(err){
        res.writeHead(404);
        return res.end("Image not found");
      }
      //Set the current header so the borwser knows it's and image
      const ext = path.extname(fileName).toLowerCase();
      const contentType = {
                '.webp': 'image/webp',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.ico' : 'image/x-icon'
            }[ext] || 'image/jpeg';
      res.writeHead(200, {'Content-Type':contentType});
      res.end(data);            
    })
    return;
  }else if (pathName.endsWith('.css')) {
    // This looks for CSS files in your public/css folder
    const fileName = path.basename(pathName);
    const filePath = path.join(process.cwd(), 'public', 'css', fileName);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("CSS file not found");
        }
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(data);
    });
    return;
}


  const isLogged = cookies?.session !== undefined;
  const role = cookies?.session?.role ;


// Route handling
  if(pathName.startsWith('/admin') ) {
    templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[pathName]); 
    if (!isLogged && role !== "admin") {
       serveLoginPage(req, res); 
    }else if (isLogged && role === "admin") {
        switch(pathName){
          case '/admin/dashboard': serveAdminDashboard(req, res, templatePath, cookies); break;
          case '/admin/add-recipe':if(req.method === "GET"){
                                      serveAddRecipeForm(req, res, templatePath); break;
                                  }else if(req.method === 'POST'){
                                      submitNewRecipe(req, res, templatePath); break;
                                  }
          case '/admin/update-recipe': if(req.method === "GET"){
                                    serveEditPage(req, res, templatePath, queryString); break;
                                  }else if(req.method === "POST"){
                                    handleUpdateRecipe(req, res); break;
                                  }
          case '/admin/delete-recipe': handleDeleteRecipe(req, res, queryString); break;                        
          default:
            res.writeHead(404);
            res.end('Page Not Found');
        }
  }
  }else if(pathName.startsWith('/recipe')){
    switch(pathName){
      case '/recipe/review':if (isLogged) { 
                                return handlePostReview(req, res); break; // Added return
                            } else { 
                                  // This tells the browser to go to /login
                                  // 401 = Unauthorized
                                  res.writeHead(401, { 'Content-Type': 'application/json' });
                                  res.end(JSON.stringify({ 
                                      success: false, 
                                      redirect: '/login' 
                                  }));
                                  return;
                            }
                            // No break needed if you use return, but keeping it is fine.
                            break;
      default:  servePublicRecipePage(req, res); break;
    }
  }else if(routes[pathName]){
    templatePath = path.join(__dirname, 'src', 'views', routes[pathName]);
    switch(pathName){
      case '/': serveHomePage(req, res); break;
      case '/login':if(req.method === 'GET'){
                    serveLoginPage(req, res); break;
                  }else if (req.method === 'POST'){
                    login(req, res); break;
                  }
      case '/register': if(req.method === 'GET'){
                    serveRegisterPage(req, res, templatePath); break;
                  }else if(req.method === 'POST'){
                    register(req, res, templatePath); break;
                  };
       case '/profile':
                    const userID = cookies?.session?.userID;
                    if(!userID){
                      res.writeHead(302, {'location': '/login'});
                      return res.end();
                    }
                    serveProfilePage(req, res, userID); break;           
      case '/logout' : logout(res); break;            
      case '/about': serveAboutPage(req, res); break;
      case '/contact': serveContactPage(req, res); break;
      default:
        res.writeHead(404);
        res.end('Page Not Found');
    }
  }else if(pathName.startsWith('/category')){
     serveCatagoryPage(req, res);
  } else {
      serve404Page(req, res); 
  }

 /*  if(req.method === 'GET' && contentType === 'text/html') {
    console.log('GET request for:', pathName);
    console.log(routes[pathName]);
    if(pathName.startsWith('/recipe/')) {
      console.log('Handling dynamic recipe page for pathName:', pathName);
      await handleDynamicRecipe(req, res);
      return;
    } else if(pathName.startsWith('/admin')){
      templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[pathName]);
    } else {
      templatePath = path.join(__dirname, 'src', 'views', routes[pathName]);
    }

    //serve static HTML templates
    if (routes[pathName]) {
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
  }else if (req.method === 'POST' && pathName === '/admin/add-recipe') {
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


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});


// Server homepage
async function serveHomePage(req, res) {
    const db = await connectDB();

    // 1. Fetch Data for different sections
    const latest = await db.collection('recipes').find().sort({createdAt: -1}).limit(6).toArray();
    const trending = await db.collection('recipes').find().sort({views: -1}).limit(5).toArray(); // Assuming you track 'views'
    const featured = await db.collection('recipes').find({isFeatured: true}).limit(3).toArray();

 
   

    // 4. Generate Dynamic HTML for sections
    const latestHtml = latest.map(r => renderRecipeCard(r)).join('');
    const trendingHtml = trending.map(r => `<div class="trend-item"><a href="/recipe/${r.slug}">${r.title}</a></div>`).join('');
    const sliderItemsHtml = featured.map(recipe => `
    <div class="swiper-slide">
        <a href="/recipe/${recipe.slug}" class="slide-card">
            <img src="${recipe.image}" alt="${recipe.title}">
            <div class="slide-overlay">
                <span class="category">${recipe.category}</span>
                <h3>${recipe.title}</h3>
                <p>View Recipe &rarr;</p>
            </div>
        </a>
    </div>`).join('');
    const finalSliderHtml = cachedSliderShell.replace('{{SLIDER_ITEMS}}', sliderItemsHtml);

    // 5. Massive Replacement
    const finalHtml = cachedIndexHtml
        .replace('{{HEADER}}', cachedHeader)
        .replace('{{NAVBAR}}', cachedNavbar)
        .replace('{{SEARCH_BAR}}', cachedSearch)
        .replace('{{HERO_SECTION}}', cachedHero)
        .replace('{{CONTENT_SUMMARY}}', cachedContentSummary)
        .replace('{{LATEST_RECIPES}}', latestHtml)
        .replace('{{TRENDING_RECIPES}}', trendingHtml)
        .replace('{{FEATURED_SLIDER}}', finalSliderHtml)
        .replace('{{ANOTHER_HERO}}', cachedHero)
        .replace('{{MUST_TRY_RECIPES}}', latestHtml)
        .replace('{{SEASONAL_PEAKS}}', latestHtml)
        .replace('{{FRESH_STARS}}', latestHtml)        
        // Add all other replacements here...
        .replace('{{FOOTER}}', cachedFooter || '');

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(finalHtml);

    // Helper function to turn a recipe object into HTML
    function renderRecipeCard(recipe) {
        return `
            <div class="recipe-card">
                <a href="/recipe/${recipe.slug}">
                    <img src="${recipe.image || '/uploads/default.webp'}" alt="${recipe.title}" loading="lazy">
                    <div class="card-content">
                        <span class="card-category">${recipe.category || 'General'}</span>
                        <h3>${recipe.title}</h3>
                        <p>${recipe.description ? recipe.description.substring(0, 80) + '...' : ''}</p>
                    </div>
                </a>
            </div>
        `;
    }
}


// Server login page
function serveLoginPage(req, res){
  const templatePath = path.join(process.cwd(), 'src', 'views', 'login.html');
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
async function serveAdminDashboard(req, res, templatePath, cookies) {
    try {
        const db = await connectDB();
        
        // Safety check: Fallback if session is missing
        const username = cookies?.session?.username || "Admin";
         
        // Fetch all recipes, newest first
        const recipes = await db.collection('recipes').find().sort({ createdAt: -1 }).toArray();

        let tableRows = '';

        if (recipes.length === 0) {
            tableRows = '<tr><td colspan="4" style="text-align:center; padding: 40px;">No recipes found. Start by adding one!</td></tr>';
        } else {
            recipes.forEach(recipe => {
                // Format date for a cleaner look (e.g., Feb 16, 2026)
                const date = new Date(recipe.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                // Determine the status pill style based on if the recipe is featured
                const statusClass = recipe.isFeatured ? 'status-featured' : 'status-standard';
                const statusText = recipe.isFeatured ? '⭐ Featured' : 'Published';

                tableRows += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${recipe.image}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
                                <strong>${recipe.title}</strong>
                            </div>
                        </td>
                        <td>${date}</td>
                        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                        <td>
                            <div class="actions-flex">
                                <a href="/admin/update-recipe?id=${recipe._id}" class="btn-edit">Edit</a>
                                <button type="button" class="btn-delete" onclick="deleteRecipe('${recipe._id}')">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        // 1. Read the Main Template
        let template = fs.readFileSync(templatePath, 'utf8');

       
        // 3. Perform Replacements
        let finalHtml = template
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{FOOTER}}', cachedFooter)
            .replace('{{USERNAME}}', username)
            .replace('{{RECIPE_TABLE_ROWS}}', tableRows);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (error) {
        console.error("Error Loading Dashboard: ", error);
        res.writeHead(500);
        res.end("Error loading Dashboard. Please check server logs.");
    }
}

 // Server add recipe form
async function serveAddRecipeForm(req, res, templatePath) {
    try {

        // 1. Read the main add-recipe template
        let html = fs.readFileSync(templatePath, 'utf8');

     
        // 3. Inject partials into the main template
        const finalHtml = html
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{FOOTER}}', cachedFooter);

        // 4. Send the complete page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (err) {
        console.error("Error serving Add Recipe form:", err);
        res.writeHead(500);
        res.end('Error loading the form. Please ensure partials exist.');
    }
} 


// Server edit recipe form
async function serveEditPage(req, res, templatePath, query) {
    try {

        // 1. Extract the ID from the query string
        const { id } = queryStringParser(query);
        if (!id) {
            res.writeHead(400);
            return res.end("Missing Recipe ID");
        }

        const db = await connectDB();
        
        // 2. Find the recipe by its ID
        const recipe = await db.collection('recipes').findOne({ 
            _id: new ObjectId(id) 
        });

        if (!recipe) {
            res.writeHead(404);
            return res.end("Recipe not found");
        }

        // 3. Read the main template and partials
        let template = fs.readFileSync(templatePath, 'utf8');
      
        // 4. Perform replacements
        // We use global Regex /.../g for ID and TITLE because they appear multiple times in the HTML
        const finalHtml = template
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{FOOTER}}', cachedFooter)
            .replace(/{{ID}}/g, recipe._id.toString())
            .replace(/{{TITLE}}/g, recipe.title || '')
            .replace('{{CATEGORY_VALUE}}', (recipe.category || 'dinner').toLowerCase().trim())
            .replace('{{IMAGE_URL}}', recipe.image || '/images/placeholder.webp')
            .replace('{{DESCRIPTION}}', recipe.description || '')
            .replace('{{INGREDIENTS}}', Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : '')
            .replace('{{INSTRUCTIONS}}', recipe.instructions || '');

        // 5. Send the response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (error) {
        console.error("Edit Page Error:", error);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end("Internal Server Error loading Edit Page");
        }
    }
}

 // Server about page
function serveAboutPage(req, res){
 const aboutPath = path.join(process.cwd(), 'src', 'views', 'about.html');
    
    fs.readFile(aboutPath, 'utf8', (err, html) => {
        if (err) {
            res.writeHead(500);
            return res.end("Error loading about page");
        }

        // SSR Replacement
        let renderedHtml = html
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{NAVBAR}}', cachedNavbar)
            .replace('{{FOOTER}}', cachedFooter);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderedHtml);
    });}; 
 // Server contact page
function serveContactPage(req, res){
const contactPath = path.join(process.cwd(), 'src', 'views', 'contact.html');
    
    fs.readFile(contactPath, 'utf8', (err, html) => {
        if (err) {
          console.log(`Error Loading contact page: ${err}`);
            res.writeHead(500);
            return res.end("Error loading contact page");
            
        }

        // SSR Replacement
        let renderedHtml = html
             .replace('{{HEADER}}', cachedHeader)
            .replace('{{NAVBAR}}', cachedNavbar)
            .replace('{{FOOTER}}', cachedFooter);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderedHtml);
    });
  }

//Submit new recipe with file
async function submitNewRecipe(req, res) {
    let rawData = Buffer.alloc(0);
    //1. Collect all chunkis into one Buffer
    req.on('data', (chunk)=>{
      rawData = Buffer.concat([rawData, chunk])
    });
    req.on('end', async () =>{
      //--- File Saving loogic Start ---
      let imageUrls =[];
      const uploadDir = path.join(__dirname,  'public', 'uploads') //Ensure this folder exists!
       //2. Extract the boundary from the headers
      const contentType = req.headers['content-type'];
      const boundary =  contentType.split('boundary=')[1]
      //  console.log(`rawData:  \n Content-Type: ${contentType} \n Boundary: ${boundary}`)
      
     
      // 3. start parsing the rawData Buffer
      const result = parseMultipart(rawData, boundary);

      // Loop through all uploaded files in the 'result' object
      for(const file of result?.files){
        //Generate a unique filename to prevent overwriting
        const uniqueFileName = Date.now()+ '-' + file.filename;
        const filePath = path.join(uploadDir, uniqueFileName);
        try{
          //Write the buffer to /upload folder
          await fs.writeFile(filePath, file.data, (err) =>{
            if(err){
              console.log("Error Saving file: ", err)
            }
          });
                    
          // Create the URL (Assuming your servers  / uploads as a static folder)
        
          imageUrls.push(`/public/uploads/${uniqueFileName}`);
        }catch (err){
          console.error("Error Saving File: ", err)
        }

      }
         // Example: "Spicy Chicken Pasta" -> "spicy-chicken-pasta"
        const slug = result?.fields?.title
          .toLowerCase()
          .trim()
          .replace(/[^\w ]+/g, '') // remove special characters
          .replace(/ +/g, '-');    // replace spaces with dashes
       
        // 4. Structure the document (matching your ER Diagram)
        const newRecipe = {
          autherId:  CookieParserHelper(req)?.session,
          title: result?.fields?.title,
          slug: slug,
          description: result?.fields?.description,
          // Convert comma-separated string to an array
          ingredients: result?.fields?.ingredients ? result?.fields?.ingredients.split(',').map(i => i.trim()) : [],
          instructions: result?.fields?.instructions,
          category: result?.fields?.category || 'Uncategorized',
          isFeatured: (result?.fields?.isFeatured &&  result?.fields?.isFeatured.trim() === 'on')  || false,
          image: imageUrls[0] || null,
          allImages: imageUrls,
          createdAt: new Date()
        };



        //Saving fields data to database
        const db = await connectDB();
        const r = await db.collection('recipes').insertOne(newRecipe);
        if(r){
          res.writeHead(302, {'Content-Type' : 'text/html',
            'Location': '/admin/dashboard'
          });
          res.end("Recipe Added Successfuly!");
        }else{ res.writeHead(302, {'Content-Type' : 'text/html',
            'Location': '/admin/dashboard' });
          res.end("Recipe Added Successfuly!");
        }
      
    })
}


//Submite Login creds
async function login(req,res ){
  let body = '';
  const db = await connectDB();
  // We already have the 'user' object from our MongoDB query
  

  // 1. Collect the data chunks from the request
  req.on('data',  chunk =>{
    body += chunk.toString();
  })
  req.on('end', async ()=>{
    try{
      const {email, password} = queryStringParser(body); 
      

      //2. Find the user in mongoDB
      const user = await db.collection('users').findOne({email: email.trim()});
      // Default fallback
      console.log(`Email: ${email} \n Password: ${password} \n User is : ${JSON.stringify(user)}`) 

      
      //3. Verify Credentials
      // (Note: In production use bcrypt.compare(password, user.password))
      if(user &&  user.password === password){
         let redirectUrl = '/';
          if (user.role === 'admin') {
            redirectUrl = '/admin/dashboard'; 
        } else if (user.role === 'editor') {
            redirectUrl = '/editor-dashboard';
        } else {
            redirectUrl = '/profile'; // For standard users
        }

        //4. Generate A SESSION the raw Way
        // We create a simple string with user info and encode it to Bse64
        const sessionData = JSON.stringify({
          userID: user._id,
          username: user.username,
          role: user.role
        });
        const sessionToken = Buffer.from(sessionData).toString('base64');
        // 5. SET COOKIE & REDIRECT
        // 'HttpOnly' makes the cookie invisible to clent-site JS (Anti-XSS)
        res.writeHead(302, {
          'Set-Cookie': `session=${sessionToken}; HttpOnly; Path=/; Max-Age=86400`,
          'Location': redirectUrl
        })
        console.log(`User Logged In: ${user.username}`);
        res.end();
      }else{
        res.writeHead(401,{'Content-Type': 'text/html'});
        res.end(`
          <div style="color: red; text-align: center; margin-top: 50px;">
          <h2> Invalid Email Or Password</h2>
          <a href="/login"> Click here to try again </a>
          `)
      }
    }catch(error){
      console.error("Login Error: ", error);
      res.writeHead(500);
      res.end("Internal Server Error during Login");
    }
  })
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
        const existingUser = await  db.collection('users').findOne({email});
        
        console.log("existing User:", existingUser);
        if(existingUser){
          res.writeHead(400, {'Content-Type': 'text/html'});
          return res.end('<h1> Email already exists </h1> <a href="/register"> Go back</a>');
        }
        // 2. Create the user object (Match your ER diagram )
        const newUser = {
          username: username,
          email: email,
          password: password,
          role: 'user', // user or  admin
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


//handle Update Recipe
async function handleUpdateRecipe(req, res) {
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));

    req.on('end', async () => {
        try {
            const rawData = Buffer.concat(chunks);
            const contentType = req.headers['content-type'];
            const boundary = '--' + contentType.split('boundary=')[1];

            // 1. Parse Multipart Data
            const result = parseMultipart(rawData, boundary);
            const fields = result.fields;
            const db = await connectDB();
            const recipeId = new ObjectId(fields.id);

            // 2. Find the existing recipe to get the old image path
            const existingRecipe = await db.collection('recipes').findOne({ _id: recipeId });
            if (!existingRecipe) {
                res.writeHead(404);
                return res.end(JSON.stringify({ error: "Recipe not found" }));
            }

            // 3. Prepare the update object
            const updateData = {
                title: fields?.title,
                category: fields?.category,
                description: fields?.description,
                ingredients: fields?.ingredients ? fields.ingredients.split(',').map(i => i.trim()) : [],
                instructions: fields?.instructions,
                isFeatured: (fields.isFeatured && fields.isFeatured.trim() === 'on') || false,
                updatedAt: new Date()
            };

            const pushData = {};

            // 4. Handle Image Update
            const newImageFile = result.files.find(f => f.fieldName === 'recipeImage');
            
            // Check if a new file was actually sent (data length > 0)
            if (newImageFile && newImageFile.data && newImageFile.data.length > 0) {
                const fileName = `${Date.now()}-recipe.webp`;
                const uploadDir = path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(uploadDir, fileName);

                // Ensure directory exists
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                // Save new WebP file
                fs.writeFileSync(filePath, newImageFile.data);

                // DELETE OLD IMAGE FILE to save space
                if (existingRecipe.image && existingRecipe.image.startsWith('/public/uploads/')) {
                    const oldFilePath = path.join(process.cwd(), existingRecipe.image);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath); // Delete the physical file
                    }
                }

                // Update paths
                updateData.image = `/public/uploads/${fileName}`;
                pushData.allImages = `/public/uploads/${fileName}`;
            }

            // 5. Update MongoDB
            const updateDoc = { $set: updateData };
            if (pushData.allImages) {
                updateDoc.$push = { allImages: pushData.allImages };
            }

            await db.collection('recipes').updateOne({ _id: recipeId }, updateDoc);

            // 6. Respond
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: "Recipe updated successfully" }));

        } catch (err) {
            console.error("Update Failed: ", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    });
}
 

//handle delete Recipe 
async function handleDeleteRecipe(req, res, queryString){
  try{
      const {id} = queryStringParser(queryString);
      if(!id){
        res.writeHead(400);
        return res.end("Error: No recipe ID provided for deletion.");
      }
      const db = await connectDB();
      const recipeId =new ObjectId(id);
      
      //Find the recipe befor deleting to get image paths
      const recipe = await db.collection('recipes').findOne({_id: recipeId});
      if(!recipe){
        res.writeHead(404);
        return res.end("Recipe not found.");
      }

      // Collect all unique image paths into a list
      // We take only allImages array
      const filesToDeleted = new Set();
      if(Array.isArray(recipe.allImages)){
        recipe.allImages.forEach(img => filesToDeleted.add(img));
      }

      //  Delete files the physical /upload folder
      filesToDeleted.forEach(relativeScriptPath =>{
        // relativeScriptPath is like "uploads/ 123---"
        // We join it with -the public folder path
        const absulatePath = path.join(process.cwd(), 'public', relativeScriptPath);
        fs.unlink(absulatePath, (err) =>{
          if(err){
            console.log(`Could not delete file: ${absulatePath} (Maybe already gone?)`)
          }else{
            console.log(`Deleted file: ${relativeScriptPath}`);
          }
        })
      })

      //2. Perform the deltetion
      const result = await db.collection('recipes').deleteOne({
        _id: recipeId
      });

      if(result.deletedCount === 1){
        console.log(`Successfully deletd recipe ${id}`);
        // 3. Redirect back to dashboard with a success message
            res.writeHead(302, { 'Location': '/admin/dashboard?success=deleted' });
        return res.end();
      }else{
        //Case where id was valid but didn't match any document
        res.writeHead(404);
        return res.end("Recipe not found. It may have already been deleted.");
      }
  }catch (err){
    console.log("Error Deleteing recipe: ", err)
  }
}



// Serve Puublic recipe view page
async function servePublicRecipePage(req, res) {
  try {
    const db = await connectDB();
    const slug = req.url.split('/').slice(-1)[0];

    // 1. Find recipe in MongoDB using the slug
    const recipe = await db.collection('recipes').findOne({ slug: slug });
    if (!recipe) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end("<h1> Recipe Not Found </h1> <a href='/'> Go Home </a> ");
    }

    // 2. Fetch Reviews for this specific recipe
    // We use the string version of the ID to match the review's recipeId
    const reviews = await db.collection('reviews')
      .find({ recipeId: recipe._id.toString() })
      .sort({ date: -1 }) // Show newest reviews first
      .toArray();

    // 3. Calculate Average Rating
    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0 
      ? (reviews.reduce((sum, r) => sum + parseInt(r.rating), 0) / reviewCount).toFixed(1)
      : "0.0";

    // 4. Generate Reviews HTML
    const reviewsHtml = reviews.length > 0 
      ? reviews.map(r => `
          <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <div style="color: #f1c40f; margin-bottom: 5px;">
                ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
            </div>
            <p style="margin: 0; font-size: 0.95rem;">${r.comment}</p>
            <small style="color: #888;">${new Date(r.date).toLocaleDateString()}</small>
          </div>
        `).join('')
      : "<p style='color: #888;'>No reviews yet. Be the first to rate this recipe!</p>";

    // 5. Load the Template
    let html = fs.readFileSync(path.join(process.cwd(), 'src', 'views', 'view-recipe.html'), 'utf8');

    // 6. Format Ingredients into HTML list items
    const ingredientsHtml = recipe.ingredients
        .map(item => `<li>${item}</li>`)
        .join('');


        console.log("Image URL: ", recipe.image)
    
    // 7. Perform replacements 
    const finalHtml = html
      .replace('{{HEADER}}', cachedHeader)
      .replace('{{NAVBAR}}', cachedNavbar)
      .replace('{{FOOTER}}', cachedFooter)
      .replace(/{{ID}}/g, recipe._id.toString()) // Needed for the hidden input in your form
      .replace(/{{TITLE}}/g, recipe.title)   
      .replace('{{DESCRIPTION}}', recipe.description || '')
      .replace('{{CATEGORY}}', recipe.category)
      .replace('{{IMAGE}}', recipe.image || '/public/uploads/default-recipe.jpg')
      .replace('{{INGREDIENTS}}', ingredientsHtml)
      .replace('{{INSTRUCTIONS}}', recipe.instructions)
      .replace('{{DATE}}', new Date(recipe.createdAt || Date.now()).toLocaleDateString())
      .replace('{{AVG_RATING}}', avgRating)
      .replace('{{REVIEW_COUNT}}', reviewCount)
      .replace('{{REVIEWS_HTML}}', reviewsHtml);

    // 8. SEND Response
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(finalHtml);
  } catch (err) {
    console.error("Error Serving public recipe page:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
  }  
}

//Handle Post review function
async function handlePostReview(req,  res) {
  let body = '';

  // 1. Collect the JSON data from the request
  req.on('data', chunk =>{
    body += chunk.toString();
  });

  req.on('end', async () => {
    try{
      // 2. Parse the JSON string into and Object
      const data = JSON.parse(body);

      // Validate: Ensure we have the minimum
      if(!data.recipeId || !data.rating){
        res.writeHead(400, {'Content-Type': 'application/json'});
        return res.end(JSON.stringify({error: "Missing required fields"}));
      }

      const db = await connectDB();

      // 3. Prepare the review document
      const newReview={
        recipeId: data.recipeId,
        rating: parseInt(data.rating),
        comment: data.comment || "",
        date: new Date()
      }

      // 4. Save to a severate reviews collection
      await db.collection('reviews').insertOne(newReview);

      // 5. Respond to frontend
      res.writeHead(201, {'Content-Type': 'applicatin/json'});
      res.end(JSON.stringify({success: true, message: "Review saved!"}));
    }catch (err){
      console.error("Error Saving Review", err);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: "Internal Server Erro"}));
    }
  })
}


// Serve pages of category
async function serveCatagoryPage(req, res) {
  // 1. Extract the category from the URL (e.g., "breakfast" from /category/breakfast)
    const categoryName = req.url.split('/')[2];
    
    
    try {
        const db = await connectDB();
        
        // 2. Fetch only recipes matching this category from MongoDB
        const categoryRecipes = await db.collection('recipes')
            .find({ category: categoryName+"\r\n" })
            .sort({ createdAt: -1 })
            .toArray();

    
        
        // 3. Read your category-page template
        let html = fs.readFileSync(path.join(process.cwd(), 'src', 'views', 'category.html'), 'utf8');
      
        // 4. Generate the HTML for the cards
        const cardsHtml = categoryRecipes.map(recipe => `
            <div class="recipe-card">
                <div class="card-img">
                    <img src="${recipe.image}" alt="${recipe.title}">
                    <span class="category-tag">${recipe.category}</span>
                </div>
                <div class="card-body">
                    <h3>${recipe.title}</h3>
                    <a href="/recipe/${recipe.slug}" class="view-btn">View Recipe</a>
                </div>
            </div>
        `).join('');

        // 5. Replace placeholders
        const finalHtml = html
            .replaceAll('{{CATEGORY_NAME}}', categoryName.toUpperCase())
            .replace('{{RECIPE_CARDS}}', cardsHtml || '<p>No recipes found in this category yet.</p>')
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{NAVBAR}}', cachedNavbar)
            .replace('{{FOOTER}}', cachedFooter);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (err) {
        console.log("Error Loading Category: ", err)
        res.writeHead(500);
        res.end("Error loading category");
    }
  
}


//Serve profile page 
async function serveProfilePage(req, res, userId) {
    const templatePath = path.join(process.cwd(), 'src', 'views', 'profile.html');
    console.log('User id: ', userId);
    try {
        // 1. Fetch user from database
        // Replace 'db.users.find' with your actual database query logic
        const db = await connectDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) }); 

        if (!user) {
            res.writeHead(404);
            return res.end("User not found");
        }

        // 2. Read the HTML template
        fs.readFile(templatePath, 'utf8', (err, html) => {
            if (err) {
                res.writeHead(500);
                return res.end("Error loading profile template");
            }

            // 3. SSR Replacement Logic
            // We use user data fetched from the DB above
            let renderedHtml = html
                .replace('{{FULL_NAME}}', user.fullName || 'Valued Member')
                .replace('{{USERNAME}}', user.username || 'User')
                .replace('{{EMAIL}}', user.email || 'N/A')
                .replace('{{ROLE}}', user.role || 'Member')
                .replace('{{JOIN_DATE}}', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent')
                .replace('{{RECIPE_COUNT}}', user.recipeCount || 0)
                .replace('{{USER_INITIAL}}', (user.username || 'U').charAt(0).toUpperCase())
                .replace('{{HEADER}}', cachedHeader)
                .replace('{{NAVBAR}}', cachedNavbar)
                .replace('{{FOOTER}}', cachedFooter);
            // 4. Send the final HTML
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(renderedHtml);
        });

    } catch (error) {
        console.error("Database Error:", error);
        res.writeHead(500);
        res.end("Internal Server Error");
    }
}


// Serve 404 page res.writeHead(404);
function serve404Page(req, res){
  const errorPath = path.join(process.cwd(), 'src', 'views', '404.html');
    
    fs.readFile(errorPath, 'utf8', (err, html) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end("404 - Page Not Found");
        }

        // SSR Replacement
        let renderedHtml = html
            .replace('{{HEADER}}', cachedHeader)
            .replace('{{NAVBAR}}', cachedNavbar)
            .replace('{{SEARCH_BAR}}',  '') // Reusing your search bar partial
            .replace('{{FOOTER}}', cachedFooter);

        // Crucial: Set the status to 404
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(renderedHtml);
    });
}

//**
// Manualy parses a URL query string without using module
// @param {string } query String - the raw query string
// @returns {object } - An object containing key-value pairs
//  */
function queryStringParser(queryString){
  const params ={};

  // 1. Remove the leanding '?' if the exist
  if(queryString.startsWith('?')){
    queryString = queryString.substring(1);
  }

  // 3. Split the string by '&' to get indivisual "key=value" pairs
  const pairs = queryString.split('&');
  for(let i = 0; i < pairs.length; i++){
    const pair = pairs[i];
    //4. Split each pair by '=' to separate the key and value
    const seperatorIndex = pair.indexOf('=');
    if(seperatorIndex !== -1){
      const key = pair.substring(0, seperatorIndex);
      const value = pair.substring(seperatorIndex + 1);

      // 5. Clean upd the data (Decode URL symbls like %20)
      // and assign it to our object
      if(key){
        params[key] = decodeURIComponent(value.replace(/\+/g, ' '))
      }else{
        //Handle cases where there is a key but not "="
        if (pair) params[pair] = true;
      }
    }
  }

  return params;
}


//CookieParserHelper function
function CookieParserHelper(req){
    const cookies = {};
    const cookie = req.headers.cookie?.split(';');
    cookie?.forEach(co =>{
       const parts = co.split('=');
       const key = parts[0].trim();
       const value = parts[1] ? decodeURIComponent(parts[1]).trim() : '';
       try {
          if(value.startsWith('{') || value.startsWith('[')){
            cookies[key] = JSON.parse(value);
          }else{
            cookies[key] = value;
          }
       } catch (error) {
        cookies[key] = value;
       }
      // value = JSON.parse(Buffer.from(value, "base64"));
    })
    return cookies;
}


//Parse Multipart 
function parseMultipart(buffer, boundary){
  const boundaryBuffer = Buffer.from(boundary);
  const result ={
    fields:{},
    files:[]
  }
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
  let length = buffer.length;
  //console.log("Buffer: ",buffer)
  //console.log('BoundaryBuffer: ', boundaryBuffer, 'SizeOf BoundaryBuffer : ',boundaryBuffer.length , 'Start: ', start, "Length: ", length)
  while(start < length){
    let end = buffer.indexOf(boundaryBuffer, start);
    //console.log("End: ", end)
    if(end === -1) break;
    // Grab the "part" (includes internal headers + data)
    const part = buffer.slice(start, end);
    // Split headers from the body (found by double CRLF)
    const headerEnd = part.indexOf('\r\n\r\n');
    const headerLines = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4, part.length - 2); // -2 to remove trailing \r\n
   // console.log(`Start: ${start}\n End: ${end}\nHeaerEnd: ${headerEnd}, \n HeaderLines: ${headerLines}, \n`)
    //Extract the "name" attribute from headers
    const nameMatch = headerLines.match(/name="([^"]+)"/);
    const name = nameMatch?  nameMatch[1]: 'unknown';
    if(headerLines.includes('filename=')){
     // console.log(  "Found a File! Binary size: ", body.length);
      const fileMatch = headerLines.match(/filename="([^"]+)"/);
      const filename = fileMatch ? fileMatch[1] :'unknown_file';
      result.files.push({
        fieldName: name,
        filename: filename,
        data: body,
        contentType: headerLines.match(/Content-Type: ([^\r\n]+)/)?.[1]
      });
      
    }else{
     // console.log("Found Text Field: ", body.toString());
      result.fields[name] = body.toString();
    }

    start = end + boundaryBuffer.length;
  } 
  return result; // <-- Return the gathered data
}
