// add the required modules
import bodyParser from "body-parser";
import express from "express";
import pg from "pg";

// create our app object  
const app = express();
const port = 3000; // define the port that the server is going to be listening on

// create a db client object
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BookNotes",
  password: "asdf",
  port: 5432,
});

// use it to connect to our db
db.connect();
// flag to allow rendering sorted resuts
var is_sorted = false;

// the array that will contain our book objects
var booksArray = []

// mount the middleware that allows us to extract data from forms
app.use(bodyParser.urlencoded({ extended: true }));
// tell our app that the public folder contains the static files
app.use(express.static("public"));

//**********/
// Routes
//**********/

// configure the / route
app.get("/", async (req, res)=>{
    
    if(!is_sorted){
    // get all books from the db
        await FetchDataDB()
    }
    
    configureBookGetRoutes();
    // pass the array to the frontend
    res.render("index.ejs", {booksArr:booksArray})
    is_sorted=false;

})


// configure the edit route
app.post("/edit", async (req, res)=>{
    // fetch the data from the req
    var reqBody = req.body

    var bookId = parseInt(reqBody["bookId"]);
    var newTitle = reqBody["bookTitleEdit"];
    var newISBN = parseInt(reqBody["bookISBNEdit"]);
    var newDate = reqBody["bookDateEdit"];
    var newRating = parseInt(reqBody["bookRatingEdit"]);
    var newDescription = reqBody["bookDescriptionEdit"];
    var newNotes = reqBody["bookNotesEdit"];


    // do the sql query to update the data in the db.
    await db.query(`UPDATE books
                    SET isbn=$1, title=$2, rating=$3, date_read=$4, description=$5, notes=$6
                    WHERE id=$7`,
                    [newISBN, newTitle, newRating, newDate , newDescription, newNotes, bookId])
     
    // fetch data from db and configure get routes
    await FetchDataDB()
    configureBookGetRoutes()

    // redirect to the main page
    res.redirect("/"+req.body.bookId)
})

app.get("/create", (req, res)=>{
    res.render("create.ejs")
})

app.post("/create", async (req,res)=>{
        // fetch the data from the req
        var reqBody = req.body    
    
        var bookTitle = reqBody["bookTitle"];
        var bookISBN = parseInt(reqBody["bookISBN"]);
        var bookDate = reqBody["bookDate"];
        var bookRating = parseInt(reqBody["bookRating"]);
        var bookDescription = reqBody["bookDescription"];
        var bookNotes = reqBody["bookNotes"];
    
    
        // do the sql query to update the data in the db.
        await db.query(`INSERT INTO books(isbn, title, rating, date_read, description, notes)
                        VALUES($1, $2, $3, $4, $5, $6)`,
                        [bookISBN, bookTitle, bookRating , bookDate, bookDescription, bookNotes])
         
        // fetch data from db and configure get routes
        await FetchDataDB()
        configureBookGetRoutes()
    
        // redirect to the main page
        res.redirect("/")
    
})

app.post("/delete", async (req, res)=>{
    // fetch the data from the req
    var bookId = req.body.bookId

    // do the sql query to update the data in the db.
    await db.query(`DELETE FROM books
              WHERE id=$1`,
            [bookId])
            
    // fetch data from db and configure get routes
    await FetchDataDB()
    configureBookGetRoutes()

    // redirect to the main page
    res.redirect("/")

    
})

app.post("/sort-books", async (req, res)=>{
    var sorting_option = req.body['filter-option'];
    await FetchDataDB()
    var sort_by;
    // sort the array according to the type of sorting we want
    if (sorting_option==="recency"){

        booksArray = (await db.query(`SELECT * 
            FROM books
            ORDER BY date_read ASC`)).rows

    }
    else{

        booksArray = (await db.query(`SELECT * 
            FROM books
            ORDER BY rating DESC`)).rows

    }
    
    is_sorted=true;

    res.redirect("/")
})

// make the server listen to client requests
app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`)
})

//**********/
// Functions
//**********/
function configureBookGetRoutes(){
    // configure the /{bookid} routes
    booksArray.forEach(bookObject => {
        // Remove any existing route for the current book ID
        app._router.stack = app._router.stack.filter(r => {
            // Remove route if it exists for the current book ID
            if (r.route && r.route.path === "/" + String(bookObject.id)) {
                return false; // This will filter out the existing route handler
            }
            return true; // Keep all other routes
        });
        
        app.get("/"+String(bookObject.id), async(req, res)=>{
            res.render("book.ejs", {bookObj:bookObject})
        })
    });
}


async function FetchDataDB(){
    booksArray = (await db.query(`SELECT * FROM books`)).rows
}

// 3.11.2025 successes
// create the update routes 
// create the create route
// So far we can CRU
//...D :)

// 3.13.2025 goal:
// work on making the notes input functional cuz it seems like it doesn't appear
// add a sorting option 