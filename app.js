const express = require('express')
const Database = require('better-sqlite3');
const MarkdownIt = require('markdown-it');


const app = express()
const port = 5080

const md = new MarkdownIt({
    breaks: true,
    typographer: true,
    quotes: '«»„“'
});

const db = new Database('quotes.sqlite');

const csrf = require('csurf');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const csrfProtect = csrf({cookie: true});
const urlParser = express.urlencoded({extended: false});

function GetQuote(date){
    const hour = date.getHours();
    const mins = date.getMinutes();

    let rows = db.prepare('SELECT * FROM quotes WHERE approved=1 AND hour = ? AND min = ?').all(hour, mins);

    if (rows.length === 0)
        for (var i =0; i<30; i++){
            rows = db.prepare('SELECT * FROM quotes WHERE approved=1 AND hour = ? AND min = ?').all(hour, mins - i);
            if (rows.length>0) break;
        }
    
    if (rows.length === 0)
        rows = db.prepare('SELECT * FROM quotes WHERE approved=1 AND hour = ? AND min = 0').all(hour);

    if (rows){
        random_quote = RandomItem(rows);
        return random_quote;
    }
    else{
        console.log('Can\'t find a quote');
        return null;
    }
}

function RandomItem(items)
{
    return items[Math.floor(Math.random()*items.length)];    
}

function AddQuote(data) {
    console.log ("AddQuote");
    let stmt = db.prepare('INSERT INTO quotes (hour, min, text, author, book, approved) VALUES (?, ?, ?, ?, ?, ?)')
    let info = stmt.run(data.hour, data.min, data.quote, data.author, data.book, 0);
    return info.changes;
}

app.set('view engine', 'ejs')
app.use('/static', express.static('public'));
app.use(cookieParser());

app.get('/', (req, res) => {
    const date = new Date();
    let quote = GetQuote(date);
    if(quote)
        quote.text = md.render(quote.text);
    else
        quote={};
    res.render('index', { quote: quote })
});

app.get('/api/getquote', (req, res) => {
    const date = new Date();
    const timestamp = req.query.timestamp;
    date.setTime(timestamp);
    let quote = GetQuote(date);
    if(quote)
        quote.text = md.render(quote.text);
    else
        quote={};
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(quote));
});


app.get('/api/getauthors', (req, res) => {
    let authors = db.prepare('SELECT DISTINCT author FROM quotes ORDEr by author').all();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(authors));
});


app.get('/add', csrfProtect, (req, res) => {
    //console.log('Token to Browser/form: ' + req.csrfToken());
    res.render('add', { csrfToken: req.csrfToken() })
});


app.post('/add', urlParser, csrfProtect, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    var response = {"status":"ok",'message':'Thank you'};

    if (req.body.hour < 0 || req.body.hour > 23)
        response = {'status':'err','message':'Неверно указан час.'};

    else if (req.body.min < 0 || req.body.hour > 59)
        response = {'status':'err','message':'Неверно указаны минуты.'};

    else if (req.body.author.length == 0)
        response = {'status':'err','message':'Имя автора не может быть пустым.'};

    else if (req.body.book.length == 0)
        response = {'status':'err','message':'Название произведения не может быть пустым.'};

    else if (req.body.quote.length == 0)
        response = {'status':'err','message':'Цитата не может быть пустой.'};

    else if (! req.body.human)
        response = {'status':'err','message':'Только человек может добавлять цитаты.'};
    
    response.hour = req.body.hour;
    response.min = req.body.min;
    response.author = req.body.author;
    response.book = req.body.book;
    response.quote = req.body.quote;
    response.csrfToken = req.csrfToken();

    if (response.status == 'ok' && AddQuote(response) != 1)
        response = {'status':'err','message':'Какая-то ошибка с базой данных. Не получислось добавить зхапись.'};
    
    res.render('add', response);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});
