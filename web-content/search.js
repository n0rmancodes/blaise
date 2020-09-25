const scrapers = [
    "vidlox",
    "mixdrop",
    "gounlimited"
]

for (var c in scrapers) {
    scraper(scrapers[c]);
}

function scraper(a) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/scrape/" + a + "/?query=" + window.location.search.substring(3) );
    xhr.send();
    xhr.onload = function() {
        var json = JSON.parse(xhr.responseText);
        if (json.err) { 
            document.getElementById("noResults").style.display = "";
        } else {
            for (var c in json.results) {
                console.log(json.results[c])
                var a = document.createElement("A");
                a.href = json.results[c].link;
                var d = document.createElement("DIV");
                d.classList.add("result");
                var id = document.createElement("DIV");
                var h2 = document.createElement("H2");
                h2.innerHTML = json.results[c].title;
                id.appendChild(h2);
                d.appendChild(id)
                a.appendChild(d);
                document.getElementById("results").appendChild(a)
            }
        }
    }
}