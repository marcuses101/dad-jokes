"use strict"
// git pages
const $form = $("#dad-form");
const $topic = $("#topic");
const $results = $("#results");
const dadURL = "https://icanhazdadjoke.com/";
const entitiesURL = `https://language.googleapis.com/v1beta2/documents:analyzeEntities`
// if running locally use IP restricted key, else domain restricted key
const G_API_KEY = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
?'AIzaSyAZDw24a7VN9oXC1X01JfhI2Fm-fMAXXYs'
: 'AIzaSyCeg3qyipDzL4M0oibcrbF_MoepU7iXk3I'
const imageURL = `https://api.cognitive.microsoft.com//bing/v7.0/images/search`
const AZURE_KEY = `dcb174f76ef74c55bd2ced6b4152bae6`
const excludedSearchTerms = [
    "difference",
    "experience",
    "Legend-dairy",
    "someone",
    "man",
    "dad",
    "one",
    "person",
    "bad",
    "Q",
    "reservation",
    "group",
    "something",
    "kind",
    "puns",
    "word",
    "rest",
    "people",
    "add",
    "thing",
    "guy",
    "Someone",
    "someone",
    "pun",
    "pair"
]
let searching = false

function dateReviver(key, value) {
    if (key === "date") {
        return new Date(value);
    } else {
        return value;
    }
}

async function handleSubmit(e) {
    try {
        e.preventDefault();
        $results.children().first().addClass("slide-to-right");
        // prevent from running if already searching for a new joke
        if (searching) return;
        searching = true;
        const topic = $topic.val();
        //fetch random joke text or joke text based on topic.
        let jokeText = topic
            ? await getJokeByTopic(topic)
            : await getRandomJoke();
        if (!jokeText) throw new Error("Could not find Joke")
        console.log(jokeText);
        // get joke subject. Will default to "dad" on error.
        const jokeSubject = await processJokeText(jokeText);
        console.log(jokeSubject);
        const imagesData = await getJokeImageData(jokeSubject);
        // load image. If image fails to load get another.
        let jokeImage = await selectAndLoadImage(imagesData);
        while (!jokeImage.htmlElement) {
            console.log("getting new image")
            jokeImage = await selectAndLoadImage(imagesData);
        }
        displayJoke(jokeText, jokeImage.htmlElement);
        searching = false;
    }
    catch (e) {
        searching = false;
        $form[0].reset();
        console.log(e);
        displayError();
    }

}

function displayError() {
    $(".card").addClass("slide-to-right").on("animationend",()=>{
        $results.html(
            `<div class="card slide-from-left">
                <h4>Error: This is not the topic you are looking for</h4>
                <img src="https://media.giphy.com/media/4560Nv2656Gv0Lvp9F/giphy.gif">
            </div>`
        )
    })
}

// Get joke text
async function getJokeByTopic(topic) {
    try {
        const url = `${dadURL}search?term=${encodeURIComponent(topic.trim())}&limit=1`
        const initialResponse = await fetch(url, { headers: { "Accept": "application/json" } });
        const initialData = await initialResponse.json();
        if (!initialResponse.ok) throw new Error(initialResponse.status + ": " + initialResponse.statusText)
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
    catch (error) {
        console.log(error)
    }
}

async function getRandomJoke() {
    try {
        const response = await fetch(dadURL, { headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(response.status + ": " + response.statusText)
        const data = await response.json();
        return data.joke;
    } catch (e) {
        console.log(e);
    }
}

// process joke text extract key words
async function processJokeText(joke) {
    const jokeToSearch = joke.replace(/\n/g, " ")
    const body = {
        "document": {
            content: jokeToSearch,
            type: "PLAIN_TEXT"
        },
        "encodingType": "NONE"
    }
    try {
        let response = await fetch(entitiesURL + `?key=${G_API_KEY}`, {
            method: "POST",
            body: JSON.stringify(body)
        })
        if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`)
        const data = await response.json();
        // return if no entities found
        console.log(data);
        if (data.entities.length === 0) return "dad"
        let index = 0;
        while (excludedSearchTerms.includes(data.entities[index].name)) {
            index++
        }
        const entity = data.entities[index].name;
        if (entity === "girl") return "woman";
        // split two word entity
        return /\s/.test(entity)
            ? entity.split(" ")[0]
            : entity

    } catch (error) {
        console.log(error)
        return "dad"
    }

}

// get cheesy images to display with joke
async function getJokeImageData(keyword) {
    const query = `?q=${keyword}&imagetype=clipart&count=10`
    const fullURL = imageURL + query;
    console.log(fullURL)
    try {
        const response = await fetch(fullURL, {
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_KEY
            }
        })
        if (!response.ok) throw new Error(response.status + ": " + response.statusText)
        const data = await response.json();
        console.log(data)
        return data;
    } catch (error) {
        console.log(error)
    }

}
// return and object containing an <img> and the associated bing result. 
// return false if image fails to load.
function selectAndLoadImage(jokeData) {
    return new Promise((resolve, reject) => {
        // randomly select image in the first 10 results
        const urlIndex = Math.floor(Math.random() * jokeData.value.length)
        // remove image from image pool.
        const jokeImageObject = jokeData.value.splice(urlIndex,1)[0];
        console.log(jokeImageObject)
        const image = document.createElement("img");
        // use lower res image on smaller devices
        image.src = (screen.width <= 500) 
        ? jokeImageObject.thumbnailUrl
        : jokeImageObject.contentUrl;
        console.dir(image)
        if (image.complete) resolve({
            htmlElement: image,
        })
        $(image).on("load", () => {
            console.log("image loaded")
            resolve(
                {
                    htmlElement: image,
                }
            )
        })
        $(image).on("error", () => { resolve(false) })
        setTimeout(() => { resolve(false) }, 5000)
    })

}

// display formatted joke and image

function displayJoke(jokeText, image) {

    let $div = $(
        `<div class="card slide-from-left">
            <h4 class="joke-text">${jokeText}</h4>
            <div>
            </div>
        </div>`
        )
        $div.children("div").append(image)
        $results.html($div);
}

function handleStart(e){
    $(this).css({opacity: 1.0, visibility: "visible"}).animate({opacity: 0}, 200);
    $("#dad-form").addClass("slide-from-left")
}

$(() => {
    $form.on("submit", handleSubmit)
    $("nav a").on("click", (event)=>{
        $(event.target).addClass("active");
        $("nav a").not(event.target).removeClass("active");
    })
    $("#start-btn").on("click",handleStart)
})
