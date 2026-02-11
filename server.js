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

  
  '/admin/dashboard': 'dashboard.html',
  '/admin/add-recipe': 'add-recipe.html',
  '/admin/update-recipe': 'update-recipe.html',
  '/admin/delete-recipe': "deletefunction",
  '/about': 'about.html',
  '/contact': 'contact.html',
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
  if(pathName.match(/\.(jpg|jpeg|png|gif|webp)$/)){

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
                '.png': 'image/png'
            }[ext] || 'image/jpeg';
      res.writeHead(200, {'Content-Type':contentType});
      res.end(data);            
    })
    return;
  }




// Route handling
  if(pathName.startsWith('/admin') && routes[pathName]) {
    templatePath = path.join(__dirname, 'src', 'views', 'admin', routes[pathName]); 
    switch(pathName){
      case '/admin/dashboard': serveAdminDashboard(req, res, templatePath, cookies); break;
      case '/admin/add-recipe':if(req.method === "GET"){
                                  serveAddRecipeForm(req, res, templatePath); break;
                              }else if(req.method === 'POST'){
                                  console.log("This is post request")
                                  submitNewRecipe(req, res, templatePath); break;
                              }
      case '/admin/update-recipe': if(req.method === "GET"){
                                serveEditPage(req, res, templatePath, queryString); break;
                              }else if(req.method === "POST"){
                                handleUpdateRecipe(req, res, templatePath); break;
                              }
      case '/admin/delete-recipe': handleDeleteRecipe(req, res, queryString); break;                        
      default:
        res.writeHead(404);
        res.end('Page Not Found');
    }
  }else if(pathName.startsWith('/recipe')){
    servePublicRecipePage(req, res);
  }else if(routes[pathName]){
    templatePath = path.join(__dirname, 'src', 'views', routes[pathName]);
    switch(pathName){
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
                  };
      case '/logout' : logout(res); break;            
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



server.listen(3000, async () => console.log('Server running on http://localhost:3000'));


async function handleDynamicRecipe(req, res) {
  const db = await connectDB();
  const slug = req.pathName.split('/recipe/')[1];
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
async function serveAdminDashboard(req, res, templatePath, cookies) {
    try {
        const db = await connectDB();
        const {username} = cookies?.session || "d";
         
        // Fetch all recipes, newest first
        const recipes = await db.collection('recipes').find().sort({ createdAt: -1 }).toArray();

        let tableRows = '';

        if (recipes.length === 0) {
            tableRows = '<tr><td colspan="4">No recipes posted yet.</td></tr>';
        } else {
            recipes.forEach(recipe => {
                const date = new Date(recipe.createdAt).toLocaleDateString();
                tableRows += `
                    <tr>
                        <td><strong>${recipe.title}</strong></td>
                        <td>${date}</td>
                        <td><span class="status-tag">Published</span></td>
                        <td>
                            <div class="action-group">
                                <a href="/admin/update-recipe?id=${recipe._id}" class="btn-edit">Edit</a>
                                <button type="submit" class="btn-delete"
                                    onclick="return deleteRecipe('${recipe._id}')">
                                    Delete
                                </button>
                                
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        let template = fs.readFileSync(templatePath, 'utf8');
        let finalHtml = template
            .replace('{{USERNAME}}', username)
            .replace('{{RECIPE_TABLE_ROWS}}', tableRows);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (error) {
        console.error("Error Loading Dashboard: ", error)
        res.writeHead(500);
        res.end("Error loading Dashboard");
    }
}
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
async function serveEditPage(req, res, templatePath, query) {
    try {
        // 1. 'query' is the object from your manual parser { id: '...' }
        const {id} = queryStringParser(query);
        if (!id) {
            res.writeHead(400);
            return res.end("Missing Recipe ID");
        }

        const db = await connectDB();
        
        // 2. Find the recipe by its ID
        // Note: query.id is the string, new ObjectId(query.id) converts it
        
        const recipe = await db.collection('recipes').findOne({ 
            _id: new ObjectId(id) 
        });

        if (!recipe) {
            res.writeHead(404);
            return res.end("Recipe not found");
        }

        // 3. Read the template
        let content = fs.readFileSync(templatePath, 'utf8');

        // 4. Replace placeholders with actual data
        const finalHtml = content
            .replace('{{ID}}', recipe._id)
            .replace('{{TITLE}}', recipe.title)
            .replace('{{DESCRIPTION}}', recipe.description || '')
            .replace('{{INGREDIENTS}}', recipe.ingredients ? recipe.ingredients.join(', ') : '')
            .replace('{{INSTRUCTIONS}}', recipe.instructions || '');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(finalHtml);

    } catch (error) {
        console.error("Edit Page Error:", error);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end("Internal Server Error");
        }
    }
}
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
async function oldsubmitNewRecipe(req, res) {
  let body = '';
  console.log("Processing New Recipe Submission...");

  // 1. Collect the data stream
  req.on('data', (chunk) => {
    chunks.push(chunk);
    //body += chunk.toString();
  });

  // 2. Once the stream is finished
  req.on('end', async () => {
    try {
      console.log("chunks: ", chunks);

      // Use your manual queryStringParser here
      const formData = queryStringParser(body);

      // 3. Generate an SEO-friendly slug
      // Example: "Spicy Chicken Pasta" -> "spicy-chicken-pasta"
      const slug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w ]+/g, '') // remove special characters
        .replace(/ +/g, '-');    // replace spaces with dashes

      // 4. Structure the document (matching your ER Diagram)
      const newRecipe = {
        title: formData.title,
        slug: slug,
        description: formData.description,
        // Convert comma-separated string to an array
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : [],
        instructions: formData.instructions,
        category: formData.category || 'Uncategorized',
        createdAt: new Date()
      };

      // 5. Save to MongoDB
      const db = await connectDB();
      const result = await db.collection('recipes').insertOne(newRecipe);

      if (result.acknowledged) {
        console.log(`Success: Recipe "${newRecipe.title}" created with slug: ${slug}`);
        
        // 6. Redirect to Dashboard with a success flag
        res.writeHead(302, { 'Location': '/admin/dashboard?success=created' });
        return res.end();
      }else{
        // IF for some reason result was not acknowledged
        res.writeHead(400);
        return res.end("Could not save recipe");
        }

    } catch (error) {
      console.error("Database Error:", error);
      if(!res.headersSent){
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Error saving recipe</h1><a href="/admin/add-recipe">Try Again</a>');
        }
    }
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
          const fileUrl = `/uploads/${uniqueFileName}`;
          imageUrls.push(fileUrl);
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
        const {userID} = CookieParserHelper(req)?.session;
        // 4. Structure the document (matching your ER Diagram)
        const newRecipe = {
          autherId:  userID,
          title: result?.fields?.title,
          slug: slug,
          description: result?.fields?.description,
          // Convert comma-separated string to an array
          ingredients: result?.fields?.ingredients ? result?.fields?.ingredients.split(',').map(i => i.trim()) : [],
          instructions: result?.fields?.instructions,
          category: result?.fields?.category || 'Uncategorized',
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
async function login(req,res , templatePath){
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
      console.log(`Email: ${email} \n Password: ${password}`) 

      //2. Find the user in mongoDB
      const user = await db.collection('users').findOne({email: email});
      let redirectUrl = '/'; // Default fallback

      if (user.role === 'admin') {
          redirectUrl = '/admin/dashboard';
      } else if (user.role === 'editor') {
          redirectUrl = '/editor-dashboard';
      } else {
          redirectUrl = '/profile'; // For standard users
      }

      //3. Verify Credentials
      // (Note: In production use bcrypt.compare(password, user.password))
      if(user &&  user.password === password){
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
// Logout funciotn
function logout(res){
  res.writeHead(302, {'Set-Cookie':'session=; HttpOnly; Path=/; Max-Age=0;', 
    'Location':'/login'
  });
  res.end();

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


//handle Update Recipe
async function handleUpdateRecipe(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
        try {
            const formData = queryStringParser(body); // Your manual parser
    
            const db = await connectDB();

            // We update everything EXCEPT the slug (usually better for SEO to keep slugs permanent)
            await db.collection('recipes').updateOne(
                { _id: new ObjectId(formData.id) },
                {
                    $set: {
                        title: formData.title,
                        description: formData.description,
                        ingredients: formData.ingredients.split(',').map(i => i.trim()),
                        instructions: formData.instructions,
                        updatedAt: new Date()
                    }
                }
            );

            res.writeHead(302, { 'Location': '/admin/dashboard?success=updated' });
            return res.end();
        } catch (err) {
            console.log("Update Failed: ", err)
            res.writeHead(500);
            res.end("Update failed");
        }
    });
}


//handle delete Recipe 
async function handleDeleteRecipe(req, res, queryString){
  try{
      const {id} = queryStringParser(queryString);
      console.log(id);
      if(!id){
        res.writeHead(400);
        return res.end("Error: No recipe ID provided for deletion.");
      }
      const db = await connectDB();

      //2. Perform the deltetion
      const result = await db.collection('recipes').deleteOne({
        _id: new ObjectId(id)
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
  try{
    const db = await connectDB();
    const slug = req.url.split('/').slice(-1)[0];
    //1. Find recipe in MongoDB using the slug
    const recipe = await db.collection('recipes').findOne({slug:slug});
    if(!recipe){
      res.writeHead(404, {'Content-Type':'text/html'});
      return res.end("<h1> Recipe Not Found </h1> <a href="/"> Go Home </a> ");
    }

    // 2. Load the Templete
    
    let html = fs.readFileSync(path.join(__dirname, 'src', 'views', 'view-recipe.html'), 'utf8');

    // 3. Formate Ingredients into HTML list items
    const ingredientsHtml = recipe.ingredients
        .map(item => `<li>${item}</li>`)
        .join('');
    
    // 4. Perform replacements 
    const finalHtml = html
      .replace(/{{TITLE}}/g, recipe.title)   
      .replace('{{DESCRIPTION}}', recipe.description || '')
      .replace('{{CATEGORY}}', recipe.category)
      .replace('{{IMAGE}}', recipe.image || '/public/uploads/default-recipe.jpg')
      .replace('{{INGREDIENTS}}', ingredientsHtml)
      .replace('{{INSTRUCTIONS}}', recipe.instructions);

   // 5. SEND Responce
   res.writeHead(200, {'Content-Type': 'text/html'});
   res.end(finalHtml);
  }catch (err){
  console.error("Error Serving public recipe page:", err)
}  
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
       let [key, value] = co.split('=');
       value = JSON.parse(Buffer.from(value, "base64"));
       cookies[key] = value;
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
     // console.log("Found a File! Binary size: ", body.length);
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
