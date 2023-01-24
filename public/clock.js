function updateClock(){
    var quote_text = document.getElementById('text');
    var quote_author = document.getElementById('author');
    var now = new Date();
    url = `/api/getquote?timestamp=${now.getTime()}`;

    fetch(url).then(function(response) {
      return response.json();
    }).then(function(data) {
      quote_text.innerHTML = data.text;
      quote_author.innerHTML = `${data.author}, «${data.book}»`;
    }).catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
}

function runClock() {
    var now = new Date();
    var timeToNextTick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
      updateClock();
      runClock();
    }, timeToNextTick);
}

