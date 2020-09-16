const $form = $("#dad-form");
const $topic = $("#topic");
const $results = $("#results");
baseURL = "https://icanhazdadjoke.com/";

String.prototype.splice = function (idx, rem, str) {
    return this.slice(0, idx) + str  + this.slice(idx + Math.abs(rem))
}

async function handleSubmit(e) {
    console.log("submit fired")
    e.preventDefault();
    const topic = $topic.val();
    let joke = topic
        ? await getJokeByTopic(topic)
        : await getRandomJoke()
        if (!joke) {
            displayError()
            return;
        }
        joke = formatJoke(joke)
        console.log(joke)
    displayJoke(joke)
}

function displayError(){
    $results.html("Error: This is not the topic you are looking for.")
}

function formatJoke (string) {
    return string.split(/(?<=[\.\,\!\?])\s/g).join("<br><br>");
}

// Get joke text

async function getJokeByTopic(topic) {
    try{
        const url = `${baseURL}search?term=${encodeURIComponent(topic.trim())}&limit=1`
        console.log(url);
        const initialResponse = await fetch(url, { headers: { "Accept": "application/json" } });
        console.log(initialResponse)
        const initialData = await initialResponse.json();
        if (!initialResponse.ok) throw new Error(initialResponse.status+": "+initialResponse.statusText)
        console.log(initialData)
        const randomJokePage = Math.ceil(Math.random() * initialData.total_pages);
        const randomJokeURL = `${url}&page=${randomJokePage}`;
        const response = await fetch(randomJokeURL, { headers: { "Accept": "application/json" } });
        const data = await response.json();
        if (data.results.length > 0) {
            return data.results[0].joke;
        } else {
            return false;
        }
    }
    catch(error){
        displayError();
        console.log(error)
    }
}

async function getRandomJoke() {
    try {
        const response = await fetch(baseURL, { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(response.status + ": " + response.statusText)
        const data = await response.json();
        return data.joke;
    } catch (e) {
        displayError();
        console.log(e);
    }
}



// process joke text extract key words

async function processJokeText(joke){
    try {
        const response = await fetch()
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`)
        const data = await response.json();

    } catch (error) {
        
    }
}

// get cheesy images to display with joke


// display formatted joke and image

function displayJoke(joke) {
        $results.html(joke)
    }

$(() => {
    $form.on("submit", handleSubmit)
    console.log("hello World")
})
