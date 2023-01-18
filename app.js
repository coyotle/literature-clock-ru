const express = require('express')
const app = express()
const port = 5080

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({
    breaks: true,
    typographer: true,
    quotes: '«»„“'
});

const Database = require('better-sqlite3');
const db = new Database('quotes.sqlite');


function GetQuote(date){
    const hour = date.getHours();
    const mins = date.getMinutes();

    let rows = db.prepare('SELECT * FROM quotes WHERE hour = ? AND min = ?').all(hour, mins);

    if (rows.length === 0)
        for (var i =0; i<30; i++){
            rows = db.prepare('SELECT * FROM quotes WHERE hour = ? AND min = ?').all(hour, mins - i);
            if (rows.length>0) break;
        }
    
    if (rows.length === 0)
        rows = db.prepare('SELECT * FROM quotes WHERE hour = ? AND min = 0').all(hour);

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


app.set('view engine', 'ejs')
app.use('/static', express.static('public'));

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
    console.log(date);
    let quote = GetQuote(date);
    if(quote)
        quote.text = md.render(quote.text);
    else
        quote={};
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(quote));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});
